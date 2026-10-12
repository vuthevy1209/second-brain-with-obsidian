"""Flat-style illustration helpers (PIL only). 800x600 canvas, drawn at 2x then downsampled.
Use: from illustrate import C, SKIN, INK, ground ; c = C(bg, bg2); c.person(...); c.save(path)
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageFont

W, H, S = 800, 600, 2

SKIN = ["#f4c9a3", "#e0a97c", "#c68a5e", "#8d5a3b"]
INK = "#2b2d42"


def font(size, bold=True):
    for p in ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, int(size * S))
    return ImageFont.load_default()


class C:
    def __init__(self, bg="#dff1ff", bg2=None):
        self.im = Image.new("RGB", (W * S, H * S), bg)
        self.d = ImageDraw.Draw(self.im)
        if bg2:  # vertical gradient
            for y in range(H * S):
                t = y / (H * S)
                c1 = tuple(int(bg[i:i + 2], 16) for i in (1, 3, 5))
                c2 = tuple(int(bg2[i:i + 2], 16) for i in (1, 3, 5))
                self.d.line([(0, y), (W * S, y)], fill=tuple(int(c1[k] + (c2[k] - c1[k]) * t) for k in range(3)))

    def p(self, pts):
        return [(x * S, y * S) for x, y in pts]

    def rect(self, x0, y0, x1, y1, fill, r=0, outline=None, w=0):
        if r:
            self.d.rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], r * S, fill=fill, outline=outline, width=int(w * S))
        else:
            self.d.rectangle([x0 * S, y0 * S, x1 * S, y1 * S], fill=fill, outline=outline, width=int(w * S))

    def ell(self, x0, y0, x1, y1, fill=None, outline=None, w=0):
        self.d.ellipse([x0 * S, y0 * S, x1 * S, y1 * S], fill=fill, outline=outline, width=int(w * S))

    def circ(self, cx, cy, r, fill=None, outline=None, w=0):
        self.ell(cx - r, cy - r, cx + r, cy + r, fill, outline, w)

    def poly(self, pts, fill, outline=None):
        self.d.polygon(self.p(pts), fill=fill, outline=outline)

    def line(self, pts, fill, w=3, cap=True):
        self.d.line(self.p(pts), fill=fill, width=int(w * S), joint="curve")
        if cap:
            for x, y in (pts[0], pts[-1]):
                self.circ(x, y, w / 2, fill)

    def arc(self, box, a0, a1, fill, w=3):
        x0, y0, x1, y1 = box
        self.d.arc([x0 * S, y0 * S, x1 * S, y1 * S], a0, a1, fill=fill, width=int(w * S))

    def text(self, xy, s, size, fill=INK, anchor="mm"):
        self.d.text((xy[0] * S, xy[1] * S), s, font=font(size), fill=fill, anchor=anchor)

    def arrow(self, a, b, fill, w=5, head=16):
        self.line([a, b], fill, w)
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        p1 = (b[0] - head * math.cos(ang - 0.45), b[1] - head * math.sin(ang - 0.45))
        p2 = (b[0] - head * math.cos(ang + 0.45), b[1] - head * math.sin(ang + 0.45))
        self.poly([b, p1, p2], fill)

    def person(self, cx, by, h, shirt, pants="#3d405b", skin=SKIN[0], hair="#3b2a20",
               armL=None, armR=None, flip=False, tie=None, hat=None, head_dx=0):
        """cx: centre x, by: feet y, h: height. arms: hand offset (dx, dy) from shoulder, in units of h."""
        u = h / 100.0
        legt = by - 38 * u
        torso_top = by - 72 * u
        hr = 11 * u
        # legs
        self.rect(cx - 11 * u, legt, cx - 1.5 * u, by - 3 * u, pants, r=3 * u)
        self.rect(cx + 1.5 * u, legt, cx + 11 * u, by - 3 * u, pants, r=3 * u)
        self.rect(cx - 13 * u, by - 5 * u, cx - 1 * u, by, "#222", r=3 * u)
        self.rect(cx + 1 * u, by - 5 * u, cx + 13 * u, by, "#222", r=3 * u)
        # arms
        for arm, sx in ((armL, -1), (armR, 1)):
            sh = (cx + sx * 13 * u, torso_top + 6 * u)
            if arm is None:
                arm = (sx * 3, 32)
            hand = (sh[0] + arm[0] * u, sh[1] + arm[1] * u)
            self.line([sh, hand], shirt, 8.5 * u)
            self.circ(hand[0], hand[1], 4.8 * u, skin)
        # torso
        self.rect(cx - 15 * u, torso_top, cx + 15 * u, legt + 4 * u, shirt, r=7 * u)
        if tie:
            self.poly([(cx - 3 * u, torso_top), (cx + 3 * u, torso_top), (cx + 4 * u, torso_top + 22 * u), (cx, torso_top + 27 * u), (cx - 4 * u, torso_top + 22 * u)], tie)
        # neck+head
        hx, hy = cx + head_dx, torso_top - hr - 1 * u
        self.rect(hx - 4 * u, torso_top - 5 * u, hx + 4 * u, torso_top + 2 * u, skin)
        self.circ(hx, hy, hr, skin)
        self.d.pieslice([(hx - hr) * S, (hy - hr) * S, (hx + hr) * S, (hy + hr) * S], 180, 360, fill=hair)
        self.circ(hx + (3 if not flip else -3) * u, hy + 0.5 * u, 1.3 * u, INK)
        self.circ(hx + (-3 if not flip else 3) * u, hy + 0.5 * u, 1.3 * u, INK)
        self.arc([hx - 4 * u, hy + 1 * u, hx + 4 * u, hy + 8 * u], 20, 160, INK, 1.3 * u)
        if hat:
            self.hardhat(hx, hy - hr + 1 * u, hr, hat)
        return hx, hy, hr

    def hardhat(self, x, y, r, color="#ffd23f"):
        self.d.pieslice([(x - r * 1.15) * S, (y - r * 1.1) * S, (x + r * 1.15) * S, (y + r * 1.1) * S], 180, 360, fill=color)
        self.rect(x - r * 1.5, y - 1, x + r * 1.5, y + r * 0.25, color, r=2)

    def save(self, path):
        """path: output .webp (e.g. <assets>/vocabulary-<slug>.webp). Also writes a .png preview next to it in /tmp-ish dir if PREVIEW_DIR set."""
        im = self.im.resize((W, H), Image.LANCZOS)
        im.save(path, "WEBP", quality=88)
        pv = os.environ.get("PREVIEW_DIR")
        if pv:
            os.makedirs(pv, exist_ok=True)
            im.save(os.path.join(pv, os.path.basename(path).replace(".webp", ".png")))


def ground(c, y, col="#cfe8b0"):
    c.rect(0, y, W, H, col)


