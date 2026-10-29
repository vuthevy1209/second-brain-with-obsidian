"""Bộ vẽ tranh minh họa kiểu sách cổ (chỉ dùng Pillow, không cần numpy).

Cảnh được mô tả bằng các lệnh hình (shape / line / shadow / spot / text); kiểu vẽ do `style` của Canvas quyết định:
  - "engraving"  (mặc định, người dùng chọn): tranh khắc tô màu: viền mực đậm, bóng tối bằng nét gạch chéo,
                 màu nhạt như tranh in cũ, giấy ngả vàng
  - "watercolor": màu nước loang + nét mực nâu run tay
  - "gouache":    màu bột có khối sáng tối mềm, không viền (kiểu sách truyện)
Toạ độ luôn theo khung 800x600; vẽ ở độ phân giải S lần rồi thu nhỏ để khử răng cưa.
Mọi phép tính chỉ làm trên vùng bao quanh hình nên mỗi ảnh vẽ xong trong vài giây.
"""
import math, os, random
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

W, H, S = 800, 600, 3
# Độ sáng kiểu tranh khắc: người dùng muốn sáng, tươi như sách tranh Oxford (giấy gần trắng, ít ngả nâu)
ENGRAVING = {"paper": "#f9f4e8", "tint": 0.12, "sepia": 0.05, "vignette": 0.12, "color": 1.12}
FONTS = "/System/Library/Fonts/Supplemental/"


def rgb(c):
    if isinstance(c, tuple):
        return tuple(int(v) for v in c[:3])
    if len(c) == 4:  # "#abc"
        c = "#" + "".join(ch * 2 for ch in c[1:])
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def mix(a, b, t):
    a, b = rgb(a), rgb(b)
    return tuple(int(a[k] + (b[k] - a[k]) * t) for k in range(3))


def darker(c, t=0.3):
    # Bóng ngả về nâu tím thay vì đen cho có cảm giác màu vẽ
    return mix(c, (60, 40, 55), t)


def lighter(c, t=0.3):
    return mix(c, (255, 250, 235), t)


def catmull(pts, closed=True, n=10):
    """Đường cong mượt đi qua các điểm (Catmull-Rom)."""
    pts = list(pts)
    if len(pts) < 3:
        return pts
    out = []
    m = len(pts)
    for i in (range(m) if closed else range(m - 1)):
        p0 = pts[(i - 1) % m] if closed or i > 0 else pts[0]
        p1, p2 = pts[i], pts[(i + 1) % m]
        p3 = pts[(i + 2) % m] if closed or i + 2 < m else pts[-1]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                       + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    if not closed:
        out.append(pts[-1])
    return out


def ellipse_pts(cx, cy, rx, ry, n=48, a0=0, a1=360, rot=0):
    """Điểm trên elip; a0..a1 tính bằng độ (0 = bên phải, 90 = phía dưới), rot = xoay elip."""
    full = abs(a1 - a0) >= 360
    cr, sr = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    out = []
    for i in range(n + (0 if full else 1)):
        a = math.radians(a0 + (a1 - a0) * i / n)
        x, y = rx * math.cos(a), ry * math.sin(a)
        out.append((cx + x * cr - y * sr, cy + x * sr + y * cr))
    return out


def rect_pts(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def font(name, size):
    path = {
        "hand": FONTS + "Bradley Hand Bold.ttf",
        "serif": FONTS + "Baskerville.ttc",
        "type": FONTS + "AmericanTypewriter.ttc",
        "georgia": FONTS + "Georgia Bold.ttf",
        "georgia-i": FONTS + "Georgia Italic.ttf",
    }[name]
    return ImageFont.truetype(path, int(size * S))


def noise(w, h, scale, seed=0):
    """Nhiễu mịn (đốm loang) 0..255 quanh 128; scale càng lớn đốm càng to."""
    random.seed(seed)
    sw, sh = max(2, int(w / scale)), max(2, int(h / scale))
    return Image.effect_noise((sw, sh), 64).resize((w, h), Image.BICUBIC)


class Canvas:
    def __init__(self, style="engraving", paper=None, seed=3):
        self.style = style
        self.seed = seed
        self.light = (0.6, -0.8)  # hướng tới nguồn sáng: phía trên bên phải
        random.seed(seed)
        self.w, self.h = W * S, H * S
        paper = paper or {"engraving": ENGRAVING["paper"], "watercolor": "#f3e8d0", "gouache": "#f6efe2"}[style]
        self.paper = rgb(paper)
        self.im = Image.new("RGB", (self.w, self.h), self.paper)
        self.ink = {"watercolor": (70, 48, 36), "gouache": (60, 45, 50), "engraving": (34, 26, 22)}[style]
        # Kết cấu loang màu dùng chung cho cả tranh
        self._blot = noise(self.w, self.h, 20 * S, seed).filter(ImageFilter.GaussianBlur(6 * S))
        self._fine = noise(self.w, self.h, 6, seed + 1)

    # ---------- tiện ích ----------
    def P(self, pts):
        return [(x * S, y * S) for x, y in pts]

    def mask(self, pts, smooth=True):
        m = Image.new("L", (self.w, self.h), 0)
        pp = catmull(pts) if smooth else pts
        ImageDraw.Draw(m).polygon(self.P(pp), fill=255)
        return m

    def _box(self, m, pad):
        b = m.getbbox()
        if not b:
            return None
        p = int(pad)
        return (max(0, b[0] - p), max(0, b[1] - p), min(self.w, b[2] + p), min(self.h, b[3] + p))

    def _paste(self, color, mm, box):
        self.im.paste(rgb(color), box, mm)

    @staticmethod
    def _shift(m, dx, dy):
        return ImageChops.offset(m, int(dx), int(dy))

    @staticmethod
    def _scale(m, t):
        t = max(0.0, min(1.0, t))
        return m.point(lambda v: int(v * t))

    def _gradient(self, size, c1, c2, angle=90):
        """Ảnh màu chuyển từ c1 sang c2; angle=90: trên xuống dưới, angle=0: trái sang phải."""
        g = Image.linear_gradient("L").rotate(90 - angle, resample=Image.BICUBIC).resize(size)
        return Image.composite(Image.new("RGB", size, rgb(c2)), Image.new("RGB", size, rgb(c1)), g)

    # ---------- hình tô màu ----------
    def shape(self, pts, color, smooth=True, shade=0.45, hi=0.25, light=None, depth=None,
              grad=None, grad_angle=90, outline=True, ow=1.6, texture=1.0, m=None, hatch_angle=-35):
        """Một mảng màu có khối. shade = độ tối phía khuất sáng, hi = độ sáng phía có đèn,
        depth = bề dày vùng bóng (px khung 800), grad = màu thứ 2 để chuyển màu."""
        full = m if m is not None else self.mask(pts, smooth)
        bb = full.getbbox()
        if not bb:
            return full
        size = min(bb[2] - bb[0], bb[3] - bb[1]) / S
        d = (depth if depth is not None else max(4, size * 0.28)) * S
        box = self._box(full, d * 1.7 + 6 * S)
        m = full.crop(box)
        sz = m.size
        lx, ly = light or self.light
        st = self.style
        base = rgb(color)
        if st == "engraving":
            base = mix(base, self.paper, ENGRAVING["tint"])

        # 1. lớp màu nền (có thể chuyển màu)
        if grad:
            g2 = mix(grad, self.paper, ENGRAVING["tint"]) if st == "engraving" else grad
            self.im.paste(self._gradient(sz, base, g2, grad_angle), box, m)
        else:
            self._paste(base, m, box)

        # vùng khuất sáng = phần hình không bị che khi đẩy hình về phía đèn
        dark = ImageChops.subtract(m, self._shift(m, lx * d, ly * d))
        dark = ImageChops.multiply(dark.filter(ImageFilter.GaussianBlur(d * 0.7)), m)
        lit = ImageChops.subtract(m, self._shift(m, -lx * d * 0.7, -ly * d * 0.7))
        lit = ImageChops.multiply(lit.filter(ImageFilter.GaussianBlur(d * 0.6)), m)

        if st == "watercolor":
            blot = ImageChops.multiply(self._blot.crop(box).point(lambda v: max(0, v - 120) * 3), m)
            self._paste(darker(base, 0.18), self._scale(blot, 0.22 * texture), box)
            self._paste(darker(base, 0.55), self._scale(dark, shade * 1.1), box)
            self._paste(lighter(base, 0.6), self._scale(lit, hi * 0.8), box)
            edge = ImageChops.subtract(m, m.filter(ImageFilter.GaussianBlur(1.6 * S)))
            self._paste(darker(base, 0.35), self._scale(edge, 0.9), box)
        elif st == "gouache":
            self._paste(darker(base, 0.6), self._scale(dark, shade), box)
            self._paste(lighter(base, 0.65), self._scale(lit, hi), box)
            grain = ImageChops.multiply(self._fine.crop(box).point(lambda v: max(0, v - 140) * 2), m)
            self._paste(lighter(base, 0.25), self._scale(grain, 0.25 * texture), box)
        else:  # engraving: bóng bằng nét gạch, đậm hơn ở chỗ tối nhất
            if shade > 0:
                self._paste(lighter(base, 0.5), self._scale(lit, hi * 0.6), box)
                th = 40 / max(shade, 0.05) * 0.5
                self._hatch(dark.point(lambda v: 255 if v > th else 0), box, hatch_angle,
                            2.4 if shade > 0.3 else 3.4, 0.6)
                if shade > 0.4:
                    self._hatch(dark.point(lambda v: 255 if v > 120 else 0), box, hatch_angle + 75, 3.4, 0.6)

        if outline and st != "gouache":
            self.stroke(catmull(pts) if smooth else list(pts) + [pts[0]],
                        w=ow if st == "watercolor" else ow * 1.25, wobble=0.6 if st == "watercolor" else 0.25)
        elif outline:
            edge = ImageChops.subtract(m, m.filter(ImageFilter.GaussianBlur(1.0 * S)))
            self._paste(darker(base, 0.45), self._scale(edge, 0.8), box)
        return full

    def _hatch(self, region, box, angle=-35, gap=3.5, w=0.7, color=None):
        """Nét gạch song song trong vùng `region` (mask L đã cắt theo `box`)."""
        if not region.getbbox():
            return
        lines = Image.new("L", region.size, 0)
        dr = ImageDraw.Draw(lines)
        a = math.radians(angle)
        dx, dy = math.cos(a), math.sin(a)
        nx, ny = -dy, dx
        cx, cy = region.size[0] / 2, region.size[1] / 2
        R = math.hypot(*region.size) / 2 + 10
        k = -R
        while k < R:
            j = random.uniform(-0.25, 0.25) * gap * S
            ox, oy = cx + nx * (k + j), cy + ny * (k + j)
            dr.line([(ox - dx * R, oy - dy * R), (ox + dx * R, oy + dy * R)], fill=255, width=max(1, int(w * S)))
            k += gap * S
        self._paste(color or self.ink, ImageChops.multiply(lines, region), box)

    def hatch(self, pts, angle=-35, gap=3.0, w=0.6, smooth=True, color=None):
        """Gạch bóng thủ công cho một vùng (vd. bóng dưới gầm bàn)."""
        full = self.mask(pts, smooth)
        box = self._box(full, 2)
        if box:
            self._hatch(full.crop(box), box, angle, gap, w, color)

    def stroke(self, pts, color=None, w=1.6, closed=False, wobble=0.5, smooth=False, taper=True):
        """Nét mực: hơi run tay và thon hai đầu."""
        pts = list(pts)
        if smooth:
            pts = catmull(pts, closed=closed)
        if closed:
            pts = pts + [pts[0]]
        if len(pts) < 2:
            return
        col = rgb(color) if color else self.ink
        dr = ImageDraw.Draw(self.im)
        ph = random.uniform(0, 6.28)
        n = len(pts)
        prev = None
        for i, (x, y) in enumerate(pts):
            t = i / (n - 1)
            wob = wobble * math.sin(ph + i * 0.35)
            p = ((x + wob * 0.6) * S, (y + wob * 0.4) * S)
            ww = w * (0.55 + 0.45 * math.sin(math.pi * t)) if taper else w
            ww *= 0.9 + 0.2 * math.sin(ph * 2 + i * 0.21)
            if prev:
                dr.line([prev, p], fill=col, width=max(1, int(ww * S)))
                r = ww * S / 2
                dr.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=col)
            prev = p

    def line(self, pts, color=None, w=1.4, smooth=True, wobble=0.3, taper=True):
        """Nét chi tiết (mắt, miệng, nếp áo, vân gỗ, chữ viết tay...)."""
        col = color
        if self.style == "gouache" and color is None:
            col = (90, 60, 60)
        pts = list(pts)
        self.stroke(catmull(pts, closed=False) if smooth and len(pts) > 2 else pts, col, w, wobble=wobble,
                    taper=taper)

    def shadow(self, pts, strength=0.35, blur=8, dx=6, dy=6, smooth=True, color=(70, 50, 60)):
        """Bóng đổ mềm của vật lên mặt phẳng (tranh khắc: vùng gạch chéo)."""
        full = self._shift(self.mask(pts, smooth), dx * S, dy * S)
        box = self._box(full, blur * S * 2.5 + 2)
        if not box:
            return
        m = full.crop(box).filter(ImageFilter.GaussianBlur(blur * S))
        if self.style == "engraving":
            self._hatch(m.point(lambda v: 255 if v > 80 else 0), box, 20, 2.8, 0.6)
            return
        self._paste(mix(color, self.paper, 0.2), self._scale(m, strength), box)

    def _soft_ellipse(self, cx, cy, rx, ry, color, strength, blur):
        pad = max(rx, ry) * blur * 3 + 2
        x0, y0 = int(max(0, (cx - rx - pad) * S)), int(max(0, (cy - ry - pad) * S))
        x1, y1 = int(min(self.w, (cx + rx + pad) * S)), int(min(self.h, (cy + ry + pad) * S))
        if x1 <= x0 or y1 <= y0:
            return
        m = Image.new("L", (x1 - x0, y1 - y0), 0)
        ImageDraw.Draw(m).ellipse([(cx - rx) * S - x0, (cy - ry) * S - y0, (cx + rx) * S - x0, (cy + ry) * S - y0],
                                  fill=255)
        m = m.filter(ImageFilter.GaussianBlur(max(0.5, min(rx, ry) * S * blur)))
        self._paste(color, self._scale(m, strength), (x0, y0, x1, y1))

    def glow(self, cx, cy, r, color, strength=0.5):
        self._soft_ellipse(cx, cy, r, r, color, strength, 0.4)

    def spot(self, cx, cy, rx, ry, color, strength=0.9, blur=0.35):
        """Đốm sáng/tối mềm (má hồng, ánh phản chiếu, hoa văn nhỏ)."""
        self._soft_ellipse(cx, cy, rx, ry, color, strength, blur)

    def text(self, xy, s, size, face="hand", color=None, anchor="mm", angle=0):
        col = rgb(color) if color else self.ink
        f = font(face, size)
        if not angle:
            ImageDraw.Draw(self.im).text((xy[0] * S, xy[1] * S), s, font=f, fill=col, anchor=anchor)
            return
        layer = Image.new("L", (self.w, self.h), 0)
        ImageDraw.Draw(layer).text((xy[0] * S, xy[1] * S), s, font=f, fill=255, anchor=anchor)
        layer = layer.rotate(angle, center=(xy[0] * S, xy[1] * S), resample=Image.BICUBIC)
        self._paste(col, layer, None)

    # ---------- hoàn thiện ----------
    def finish(self, path, preview_dir=None, vignette=None, sepia=None, grain=0.1, border=True, color=1.0,
               contrast=1.0):
        """Thêm vân giấy, ngả màu cũ, tối 4 góc rồi lưu webp 800x600 (và png xem trước nếu có preview_dir)."""
        st = self.style
        vignette = {"engraving": ENGRAVING["vignette"], "watercolor": 0.3, "gouache": 0.12}[st] if vignette is None else vignette
        sepia = {"engraving": ENGRAVING["sepia"], "watercolor": 0.12, "gouache": 0.0}[st] if sepia is None else sepia
        if st == "engraving" and color == 1.0:
            color = ENGRAVING["color"]
        im = self.im
        if st != "gouache":
            g = self._fine.filter(ImageFilter.GaussianBlur(0.6 * S)).point(lambda v: 255 - int(abs(v - 128) * grain * 2.2))
            im = ImageChops.multiply(im, Image.merge("RGB", (g, g, g)))
            blot = self._blot.point(lambda v: 255 - int(max(0, 128 - v) * 0.07))
            im = ImageChops.multiply(im, Image.merge("RGB", (blot, blot, blot)))
        else:
            g = self._fine.point(lambda v: 255 - int(abs(v - 128) * grain))
            im = ImageChops.multiply(im, Image.merge("RGB", (g, g, g)))
        if sepia:
            sp = ImageOps.colorize(ImageOps.grayscale(im), (40, 26, 16), (255, 246, 228))
            im = Image.blend(im, sp, sepia)
        if vignette:
            v = Image.radial_gradient("L").resize((self.w, self.h)).point(lambda x: 255 - int(max(0, x - 150) * vignette * 2))
            im = ImageChops.multiply(im, Image.merge("RGB", (v, v, v)))
        if color != 1.0:
            im = ImageEnhance.Color(im).enhance(color)
        if contrast != 1.0:
            im = ImageEnhance.Contrast(im).enhance(contrast)
        im = im.resize((W, H), Image.LANCZOS)
        if border and st != "gouache":
            ImageDraw.Draw(im).rectangle([10, 10, W - 11, H - 11], outline=mix(self.ink, self.paper, 0.35), width=2)
        im.save(path, "WEBP", quality=90)
        if preview_dir:
            os.makedirs(preview_dir, exist_ok=True)
            im.save(os.path.join(preview_dir, os.path.basename(path).rsplit(".", 1)[0] + ".png"))
        return im
