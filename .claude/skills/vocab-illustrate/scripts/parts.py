"""Bộ phận dựng cảnh dùng chung cho paint.Canvas: người, phòng, đồ vật, chữ.

    import sys; sys.path.insert(0, "<skill>/scripts")
    from paint import *
    from parts import *
    c = Canvas()                      # kiểu tranh khắc tô màu (mặc định)
    room(c); person(c, 300, 520, 330, pose=("wave", "down"), face="happy")
    c.finish("<assets>/vocabulary-<slug>.webp", preview_dir="<tmp>")

Toạ độ theo khung 800x600. Kích thước người: `h` = chiều cao từ đỉnh đầu tới gót chân.
"""
import math, random
from paint import Canvas, catmull, darker, ellipse_pts, lighter, mix, rect_pts, rgb

SKIN = ["#f1c7a0", "#e3ae84", "#c98d62", "#8f5b3c"]
HAIR = {"brown": "#6b3f22", "black": "#2e2420", "blond": "#c9a052", "grey": "#9a948c", "red": "#9c4a26"}
INK_RED = (150, 52, 40)


# ---------------------------------------------------------------- hình học
def limb_pts(p0, p1, w0, w1, n=10):
    """Hình con nhộng từ p0 tới p1, bề rộng nửa w0 ở p0 và w1 ở p1 (tay, chân, ống tay áo)."""
    th = math.degrees(math.atan2(p1[1] - p0[1], p1[0] - p0[0]))
    return ellipse_pts(p1[0], p1[1], w1, w1, n, th - 90, th + 90) + ellipse_pts(p0[0], p0[1], w0, w0, n, th + 90,
                                                                                    th + 270)


def ik(sh, hand, l1, l2, outward):
    """Vị trí khuỷu tay để bàn tay chạm `hand`; chọn phía khuỷu hướng ra ngoài (outward = -1 trái, 1 phải)."""
    dx, dy = hand[0] - sh[0], hand[1] - sh[1]
    d = max(1e-3, min(math.hypot(dx, dy), l1 + l2 - 1e-3))
    a = math.atan2(dy, dx)
    b = math.acos(max(-1, min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
    cands = [(sh[0] + l1 * math.cos(a + s * b), sh[1] + l1 * math.sin(a + s * b)) for s in (1, -1)]
    return max(cands, key=lambda e: (e[0] - sh[0]) * outward + 0.3 * (e[1] - sh[1]))


# Tư thế tay: vị trí bàn tay so với vai, đơn vị u = h/100; x dương = hướng ra ngoài người
ARM_POSES = {
    "down": (3, 31), "hip": (8, 22), "wave": (10, -22), "up": (4, -33), "point": (31, -4),
    "shrug": (15, -2), "chin": (-6, -5), "hold": (8, 18), "forward": (24, 8), "head": (-3, -22),
    "cheek": (-5, -12), "fist": (12, -20),
}


# ---------------------------------------------------------------- người
def person(c, cx, by, h, shirt="#5f7fa8", pants="#4a4a58", skin=SKIN[0], hair="brown", hair_style="short",
           face="smile", pose=("down", "down"), jacket=None, tie=None, skirt=None, glasses=False, shoes="#3a2a22",
           look=0, sleeves="long", legs=True):
    """Người đứng nhìn thẳng. pose = (tay trái, tay phải) theo phía người xem: tên trong ARM_POSES
    hoặc (dx, dy) tự chọn. face: smile | happy | laugh | worried | confused | surprised | neutral | sad | think.
    jacket/tie/skirt: màu (None = không có). look: -1..1 đưa mắt sang trái/phải.
    Trả về dict vị trí đầu, tay để đặt đồ vật vào tay."""
    u = h / 100
    hc = HAIR.get(hair, hair)
    hx, hy = cx, by - 90 * u
    sy = by - 76 * u
    out = {"head": (hx, hy, 8 * u)}

    # tóc phía sau (vẽ trước để nằm sau mặt và thân)
    if hair_style in ("bob", "long"):
        drop = 18 if hair_style == "bob" else 30
        c.shape([(hx - 10 * u, hy + 4 * u), (hx - 10 * u, hy - 5 * u), (hx - 6 * u, hy - 10.5 * u), (hx, hy - 11.5 * u),
                 (hx + 6 * u, hy - 10.5 * u), (hx + 10 * u, hy - 5 * u), (hx + 10 * u, hy + 4 * u),
                 (hx + 9.5 * u, hy + drop * 0.5 * u), (hx + 7 * u, hy + drop * 0.55 * u), (hx, hy + 6 * u),
                 (hx - 7 * u, hy + drop * 0.55 * u), (hx - 9.5 * u, hy + drop * 0.5 * u)], hc, shade=0.6, hi=0.35,
                depth=3 * u, ow=1.4)

    # chân + giày, bóng dưới chân
    if legs:
        c.shadow(ellipse_pts(cx, by, 16 * u, 3 * u, 24), 0.3, blur=2 * u, dx=4 * u, dy=0)
        leg_top = by - 46 * u
        if skirt:
            for sx in (-1, 1):
                c.shape(limb_pts((cx + sx * 4 * u, by - 28 * u), (cx + sx * 4.4 * u, by - 4 * u), 2.4 * u, 2 * u),
                        skin, shade=0.4, hi=0.2, depth=1.2 * u, ow=1.1)
        else:
            for sx in (-1, 1):
                c.shape([(cx + sx * 9.6 * u, leg_top), (cx + sx * 0.5 * u, leg_top), (cx + sx * 1.4 * u, by - 4 * u),
                         (cx + sx * 7.8 * u, by - 4 * u)], pants, smooth=False, shade=0.55, hi=0.25, depth=3 * u,
                        ow=1.3)
            c.line([(cx - 5 * u, by - 30 * u), (cx - 4.6 * u, by - 12 * u)], color=darker(pants, 0.5), w=0.8)
            c.line([(cx + 5 * u, by - 30 * u), (cx + 4.6 * u, by - 12 * u)], color=darker(pants, 0.5), w=0.8)
        for sx in (-1, 1):
            x0 = cx + sx * 1 * u
            x1 = cx + sx * 10 * u
            c.shape([(x0, by - 5 * u), (x1 - sx * 1.5 * u, by - 5.4 * u), (x1 + sx * 1.5 * u, by - 1.5 * u),
                     (x1 + sx * 0.5 * u, by), (x0, by)], shoes, shade=0.5, hi=0.5, depth=1.5 * u, ow=1.2)

    # cổ
    c.shape(rect_pts(hx - 2.6 * u, hy + 6 * u, hx + 2.6 * u, sy + 2 * u), darker(skin, 0.12), smooth=False, shade=0.5,
            depth=1.6 * u, ow=1.1)

    # thân áo (váy nếu có skirt)
    torso = [(cx - 11.5 * u, sy), (cx, sy - 1.6 * u), (cx + 11.5 * u, sy), (cx + 10.4 * u, by - 60 * u),
             (cx + 9.6 * u, by - 45 * u), (cx - 9.6 * u, by - 45 * u), (cx - 10.4 * u, by - 60 * u)]
    if skirt:
        c.shape([(cx - 9.4 * u, by - 50 * u), (cx + 9.4 * u, by - 50 * u), (cx + 14 * u, by - 27 * u),
                 (cx - 14 * u, by - 27 * u)], skirt, shade=0.5, hi=0.3, depth=3 * u, ow=1.3)
        for k in (-6, 0, 6):
            c.line([(cx + k * 0.8 * u, by - 46 * u), (cx + k * 1.4 * u, by - 28 * u)], color=darker(skirt, 0.45), w=0.8)
    c.shape(torso, shirt, shade=0.55, hi=0.3, depth=4 * u, ow=1.4)
    if jacket:
        for sx in (-1, 1):
            c.shape([(cx + sx * 11.6 * u, sy), (cx + sx * 4 * u, sy - 0.6 * u), (cx + sx * 0.4 * u, by - 56 * u),
                     (cx + sx * 0.4 * u, by - 45 * u), (cx + sx * 9.7 * u, by - 45 * u), (cx + sx * 10.5 * u, by - 60 * u)],
                    jacket, smooth=False, shade=0.55, hi=0.3, depth=3.5 * u, ow=1.3)
            c.line([(cx + sx * 4 * u, sy - 0.4 * u), (cx + sx * 6.6 * u, by - 64 * u), (cx + sx * 1.2 * u, by - 56 * u)],
                   w=0.9, smooth=False)
        c.spot(cx - 1.6 * u, by - 51 * u, 0.7 * u, 0.7 * u, darker(jacket, 0.6), 0.9, blur=0.2)
    if tie:
        c.shape([(cx - 1.3 * u, sy - 0.6 * u), (cx + 1.3 * u, sy - 0.6 * u), (cx + 1.9 * u, by - 60 * u), (cx, by - 57 * u),
                 (cx - 1.9 * u, by - 60 * u)], tie, smooth=False, shade=0.4, hi=0.3, depth=1 * u, ow=1.0)
    # cổ áo
    collar = "#f6f1e6" if jacket else lighter(shirt, 0.15)
    for sx in (-1, 1):
        c.shape([(cx, sy + 1.6 * u), (cx + sx * 4.4 * u, sy - 1.2 * u), (cx + sx * 5.2 * u, sy + 0.6 * u),
                 (cx + sx * 1.2 * u, sy + 3.6 * u)], collar, smooth=False, shade=0.3, hi=0.2, depth=0.8 * u, ow=1.0)

    # tay: tay chống cằm/áp má vẽ sau mặt để nằm phía trước
    l1, l2 = 16 * u, 15 * u
    sleeve = jacket or shirt

    def draw_arm(sx, p):
        sh = (cx + sx * 9.6 * u, sy + 2.4 * u)
        off = ARM_POSES[p] if isinstance(p, str) else p
        hand = (sh[0] + sx * off[0] * u, sh[1] + off[1] * u)
        el = ik(sh, hand, l1, l2, sx)
        c.shape(limb_pts(sh, el, 3.3 * u, 2.9 * u), sleeve, shade=0.55, hi=0.3, depth=1.8 * u, ow=1.3)
        if sleeves == "long":
            c.shape(limb_pts(el, hand, 2.9 * u, 2.4 * u), sleeve, shade=0.55, hi=0.3, depth=1.6 * u, ow=1.3)
            d = (hand[0] - el[0], hand[1] - el[1])
            L = math.hypot(*d) or 1
            cuff = (hand[0] - d[0] / L * 2.6 * u, hand[1] - d[1] / L * 2.6 * u)
            c.shape(limb_pts(cuff, (hand[0] - d[0] / L * 1.2 * u, hand[1] - d[1] / L * 1.2 * u), 2.6 * u, 2.6 * u),
                    "#f6f1e6", shade=0.3, hi=0.2, depth=0.8 * u, ow=1.0)
        else:
            c.shape(limb_pts(el, hand, 2.4 * u, 2.0 * u), skin, shade=0.45, hi=0.25, depth=1.4 * u, ow=1.2)
        c.shape(ellipse_pts(hand[0], hand[1] + 0.6 * u, 2.8 * u, 3.2 * u, 20), skin, shade=0.45, hi=0.3, depth=1.4 * u,
                ow=1.2)
        c.line([(hand[0] - sx * 1.6 * u, hand[1] - 0.6 * u), (hand[0] - sx * 2.6 * u, hand[1] + 1.4 * u)],
               color=darker(skin, 0.4), w=0.8)
        out["hand_l" if sx < 0 else "hand_r"] = hand

    front = [(sx, p) for sx, p in ((-1, pose[0]), (1, pose[1])) if p in ("chin", "cheek")]
    for sx, p in ((-1, pose[0]), (1, pose[1])):
        if (sx, p) not in front:
            draw_arm(sx, p)

    # đầu: tai, mặt
    for sx in (-1, 1):
        c.shape(ellipse_pts(hx + sx * 7.9 * u, hy + 1 * u, 1.5 * u, 2.4 * u, 16), skin, shade=0.5, hi=0.2,
                depth=0.8 * u, ow=1.1)
    FACE = [(hx - 7.8 * u, hy - 1 * u), (hx - 6.6 * u, hy - 6.6 * u), (hx, hy - 9 * u), (hx + 6.6 * u, hy - 6.6 * u),
            (hx + 7.8 * u, hy - 1 * u), (hx + 6.8 * u, hy + 4.6 * u), (hx + 3.4 * u, hy + 8 * u), (hx, hy + 8.8 * u),
            (hx - 3.4 * u, hy + 8 * u), (hx - 6.8 * u, hy + 4.6 * u)]
    c.shadow(FACE, 0.3, blur=0.6 * u, dx=0, dy=1.2 * u)
    c.shape(FACE, skin, shade=0.4, hi=0.35, depth=2.4 * u, ow=1.4)
    if face in ("smile", "happy", "laugh", "surprised"):
        for sx in (-1, 1):
            c.spot(hx + sx * 4.4 * u, hy + 3.4 * u, 1.8 * u, 1.1 * u, "#ec8f86", 0.4)

    # tóc trước
    if hair_style == "short":
        c.shape([(hx - 8 * u, hy + 0.5 * u), (hx - 8.4 * u, hy - 4.4 * u), (hx - 5 * u, hy - 9.2 * u), (hx, hy - 10.4 * u),
                 (hx + 5.4 * u, hy - 9.4 * u), (hx + 8.4 * u, hy - 4.4 * u), (hx + 8 * u, hy + 0.5 * u),
                 (hx + 7 * u, hy - 3.6 * u), (hx + 2 * u, hy - 5.8 * u), (hx - 3.6 * u, hy - 5 * u),
                 (hx - 6.8 * u, hy - 3 * u)], hc, shade=0.55, hi=0.4, depth=2 * u, ow=1.3)
        c.line([(hx - 3 * u, hy - 8.6 * u), (hx - 4.6 * u, hy - 5.6 * u)], color=darker(hc, 0.5), w=0.8)
        c.line([(hx + 2 * u, hy - 9 * u), (hx + 1 * u, hy - 6.2 * u)], color=darker(hc, 0.5), w=0.8)
    elif hair_style in ("bob", "long", "bun"):
        bangs = [(hx - 8.2 * u, hy + 0.5 * u), (hx - 8.4 * u, hy - 5 * u), (hx - 4.4 * u, hy - 9.6 * u), (hx, hy - 10.4 * u),
                 (hx + 4.4 * u, hy - 9.6 * u), (hx + 8.4 * u, hy - 5 * u), (hx + 8.2 * u, hy + 0.5 * u),
                 (hx + 6.6 * u, hy - 3.2 * u), (hx + 4.4 * u, hy - 2.4 * u), (hx + 2.2 * u, hy - 4.6 * u),
                 (hx, hy - 3 * u), (hx - 2.4 * u, hy - 4.6 * u), (hx - 4.6 * u, hy - 2.6 * u), (hx - 6.6 * u, hy - 3.6 * u)]
        if hair_style == "bun":
            c.shape(ellipse_pts(hx, hy - 11.5 * u, 4 * u, 3.4 * u, 20), hc, shade=0.55, hi=0.4, depth=1.4 * u, ow=1.2)
        c.shadow(bangs, 0.25, blur=0.6 * u, dx=0, dy=0.9 * u)
        c.shape(bangs, hc, shade=0.5, hi=0.45, depth=2 * u, ow=1.3)
    elif hair_style == "bald":
        for sx in (-1, 1):
            c.shape([(hx + sx * 8 * u, hy + 1 * u), (hx + sx * 8.4 * u, hy - 4 * u), (hx + sx * 6.6 * u, hy - 5 * u),
                     (hx + sx * 7 * u, hy)], hc, shade=0.4, hi=0.3, depth=1 * u, ow=1.1)

    # nét mặt
    ex = 3.1 * u
    ey = hy + 0.4 * u
    lk = look * 0.7 * u
    for sx in (-1, 1):
        x = hx + sx * ex
        if face in ("happy", "laugh"):
            c.line([(x - 1.6 * u, ey + 0.4 * u), (x, ey - 1 * u), (x + 1.6 * u, ey + 0.4 * u)], w=1.6)
        else:
            r = 1.25 * u if face == "surprised" else 1.0 * u
            c.spot(x + lk, ey, r * 0.95, r * 1.15, (40, 30, 26), 1.0, blur=0.12)
            c.spot(x + lk + 0.35 * u, ey - 0.35 * u, 0.32 * u, 0.32 * u, (255, 255, 250), 0.95, blur=0.15)
        by_ = hy - 3 * u
        inner = hx + sx * 1.3 * u
        outer = hx + sx * 4.6 * u
        if face in ("worried", "sad"):
            pts = [(outer, by_ + 0.4 * u), (inner, by_ - 0.9 * u)]
        elif face == "confused":
            pts = [(outer, by_ - (1.2 if sx > 0 else -0.2) * u), (inner, by_ - (0.2 if sx > 0 else 0.4) * u)]
        elif face == "surprised":
            pts = [(outer, by_ - 0.8 * u), ((outer + inner) / 2, by_ - 1.6 * u), (inner, by_ - 0.9 * u)]
        else:
            pts = [(outer, by_ + 0.2 * u), ((outer + inner) / 2, by_ - 0.7 * u), (inner, by_ - 0.1 * u)]
        c.line(pts, color=darker(hc, 0.25), w=1.4)
        if glasses:
            c.stroke(ellipse_pts(x, ey, 2.4 * u, 2.1 * u, 24), w=1.1, closed=True, taper=False, wobble=0.1)
    if glasses:
        c.line([(hx - 0.8 * u, ey - 0.4 * u), (hx + 0.8 * u, ey - 0.4 * u)], w=1.0)
    c.line([(hx + 0.2 * u, hy + 1.2 * u), (hx - 0.6 * u, hy + 3.4 * u), (hx + 0.6 * u, hy + 3.7 * u)],
           color=darker(skin, 0.45), w=1.0)
    my = hy + 5.4 * u
    if face == "laugh":
        c.shape([(hx - 3 * u, my - 0.4 * u), (hx + 3 * u, my - 0.4 * u), (hx + 2 * u, my + 1.8 * u), (hx, my + 2.4 * u),
                 (hx - 2 * u, my + 1.8 * u)], "#93343a", shade=0.3, hi=0, depth=0.6 * u, ow=1.1)
        c.shape(rect_pts(hx - 2.6 * u, my - 0.3 * u, hx + 2.6 * u, my + 0.4 * u), "#fbf5ec", smooth=False, shade=0,
                hi=0, outline=False)
    elif face in ("smile", "happy"):
        c.line([(hx - 2.6 * u, my - 0.2 * u), (hx, my + 1.3 * u), (hx + 2.6 * u, my - 0.2 * u)], w=1.4)
    elif face in ("worried",):
        c.line([(hx - 2.2 * u, my + 0.6 * u), (hx - 1 * u, my), (hx + 0.4 * u, my + 0.5 * u), (hx + 2.2 * u, my)], w=1.3)
        c.spot(hx + 7.4 * u, hy - 4 * u, 0.7 * u, 1.1 * u, "#9fc6dd", 0.9, blur=0.2)  # giọt mồ hôi
    elif face == "sad":
        c.line([(hx - 2.4 * u, my + 1 * u), (hx, my - 0.1 * u), (hx + 2.4 * u, my + 1 * u)], w=1.3)
    elif face == "surprised":
        c.shape(ellipse_pts(hx, my + 0.6 * u, 1.3 * u, 1.7 * u, 16), "#93343a", shade=0.2, hi=0, depth=0.5 * u, ow=1.1)
    elif face == "confused":
        c.line([(hx - 2 * u, my + 0.4 * u), (hx + 2.4 * u, my - 0.4 * u)], w=1.3)
    elif face == "think":
        c.line([(hx - 1.4 * u, my + 0.3 * u), (hx + 1.8 * u, my)], w=1.3)
    else:
        c.line([(hx - 2 * u, my + 0.2 * u), (hx, my + 0.6 * u), (hx + 2 * u, my + 0.2 * u)], w=1.3)
    for sx, p in front:
        draw_arm(sx, p)
    return out


# ---------------------------------------------------------------- phòng & nội thất
def room(c, floor_y=430, wall="#e6d4ae", stripes=True, flowers=True, wainscot=True, floor="#a8794c"):
    """Tường giấy dán sọc hoa nhỏ + gờ tường + sàn gỗ."""
    c.shape(rect_pts(0, 0, 800, floor_y), wall, smooth=False, shade=0, hi=0, outline=False)
    if stripes:
        for x in range(0, 800, 44):
            c.shape(rect_pts(x + 14, 0, x + 26, floor_y), darker(wall, 0.06), smooth=False, shade=0, hi=0, outline=False)
    if flowers:
        for row, y in enumerate(range(28, floor_y - 90, 52)):
            for x in range(0 if row % 2 else 22, 800, 44):
                for a in range(0, 360, 72):
                    c.spot(x + 4 * math.cos(math.radians(a)), y + 4 * math.sin(math.radians(a)), 2.4, 2.4, "#c98f6a",
                           0.5, blur=0.2)
                c.spot(x, y, 1.6, 1.6, "#8f9a5a", 0.7, blur=0.2)
    if wainscot:
        ry = floor_y - 90
        c.shape(rect_pts(0, ry, 800, ry + 12), "#9b6a40", smooth=False, shade=0.3, hi=0.3, depth=4, ow=1.0)
        c.shape(rect_pts(0, ry + 12, 800, floor_y), "#c6a173", smooth=False, shade=0, hi=0, outline=False)
        for x in range(30, 800, 120):
            c.shape(rect_pts(x, ry + 24, x + 90, floor_y - 10), "#bf986a", smooth=False, shade=0.3, hi=0.25, depth=3,
                    ow=0.9)
    c.shape(rect_pts(0, floor_y, 800, 600), floor, smooth=False, grad=darker(floor, 0.2), shade=0, hi=0, ow=1.2)
    for k in range(-8, 10):
        c.line([(400 + k * 60, floor_y), (400 + k * 130, 600)], color=darker(floor, 0.45), w=0.8, smooth=False,
               wobble=0.1)
    return floor_y


def office(c, floor_y=440, wall="#dfe2cc"):
    """Văn phòng cổ điển: tường sơn, ốp gỗ thấp, sàn gỗ."""
    return room(c, floor_y, wall=wall, stripes=False, flowers=False, wainscot=True, floor="#9c6e45")


def window(c, x0, y0, x1, y1, curtains="#b85445", sky=("#b9d8e6", "#eef3e4"), sun=None, tree=True):
    c.shape(rect_pts(x0, y0, x1, y1), "#f4efe2", smooth=False, shade=0.3, hi=0.2, depth=6, ow=1.4)
    ix0, iy0, ix1, iy1 = x0 + 14, y0 + 14, x1 - 14, y1 - 14
    c.shape(rect_pts(ix0, iy0, ix1, iy1), sky[0], smooth=False, grad=sky[1], shade=0, hi=0, outline=False)
    if sun:
        sx, sy, sr = sun
        c.glow(sx, sy, sr * 2.2, "#ffe9a8", 0.6)
        c.shape(ellipse_pts(sx, sy, sr, sr, 24), "#f2b63c", shade=0.2, hi=0.4, depth=3, ow=1.0)
    hill = iy1 - (iy1 - iy0) * 0.25
    c.shape([(ix0, hill), ((ix0 + ix1) / 2, hill - 14), (ix1, hill - 4), (ix1, iy1), (ix0, iy1)], "#9fbf86",
            shade=0.2, hi=0.2, outline=False)
    if tree:
        tx = ix0 + (ix1 - ix0) * 0.4
        c.shape(rect_pts(tx - 5, hill - 40, tx + 5, iy1), "#7a5534", smooth=False, shade=0.4, ow=0.8)
        for dx, dy, r in ((-22, -60, 24), (6, -76, 30), (28, -54, 22)):
            c.shape(ellipse_pts(tx + dx, hill + dy, r, r * 0.9, 16), "#6f9a55", shade=0.5, hi=0.35, ow=0.8)
    mx, my = (ix0 + ix1) / 2, (iy0 + iy1) / 2
    c.shape(rect_pts(mx - 5, iy0, mx + 5, iy1), "#f4efe2", smooth=False, shade=0.2, hi=0.2, depth=3, ow=1)
    c.shape(rect_pts(ix0, my - 4, ix1, my + 4), "#f4efe2", smooth=False, shade=0.2, hi=0.2, depth=3, ow=1)
    c.shape([(x0 - 8, y1), (x1 + 8, y1), (x1 + 14, y1 + 14), (x0 - 14, y1 + 14)], "#efe8d8", smooth=False, shade=0.4,
            hi=0.3, depth=4, ow=1.2)
    if curtains:
        for side in (-1, 1):
            e = x0 if side < 0 else x1  # mép cửa sổ phía rèm
            f = lambda dx: e - side * dx  # dx dương = vào trong khung
            pts = [(f(-22), y0 - 16), (f(32), y0 - 16), (f(28), y0 + 70), (f(16), (y0 + y1) / 2), (f(30), y1),
                   (f(-6), y1 + 18), (f(-20), (y0 + y1) / 2 + 20), (f(-16), y0 + 70)]
            c.shape(pts, curtains, shade=0.5, hi=0.3, depth=14, ow=1.4)
            for k in (2, 16):
                c.line([(f(k), y0 - 12), (f(k - 4), (y0 + y1) / 2), (f(k + 2), y1 + 8)], color=darker(curtains, 0.45),
                       w=1.0)
        c.shape(rect_pts(x0 - 40, y0 - 24, x1 + 40, y0 - 12), "#7d5534", smooth=False, shade=0.4, hi=0.4, depth=3, ow=1)


def desk(c, x0, top, x1, bottom=None, wood="#8f5b34", drawers=True):
    """Bàn gỗ nhìn chính diện: mặt bàn dày + thân có ngăn kéo + chân."""
    bottom = bottom or min(590, top + 150)
    c.shadow(rect_pts(x0 + 10, bottom - 8, x1 + 10, bottom + 6), 0.3, blur=6, dx=8, dy=2, smooth=False)
    c.shape(rect_pts(x0, top, x1, top + 14), lighter(wood, 0.1), smooth=False, shade=0.3, hi=0.4, depth=4, ow=1.3)
    c.shape(rect_pts(x0 + 12, top + 14, x1 - 12, bottom), wood, smooth=False, grad=darker(wood, 0.25), shade=0.35,
            hi=0.2, depth=10, ow=1.3)
    if drawers:
        n = 2
        dw = (x1 - x0 - 24) / n
        for i in range(n):
            a = x0 + 12 + i * dw
            c.shape(rect_pts(a + 10, top + 26, a + dw - 10, top + 62), lighter(wood, 0.08), smooth=False, shade=0.4,
                    hi=0.3, depth=4, ow=1.0)
            c.spot((a + a + dw) / 2, top + 44, 3.5, 3.5, "#d8b25a", 0.95, blur=0.2)
    for y in range(int(top + 70), int(bottom), 18):
        c.line([(x0 + 16, y), (x1 - 16, y + 2)], color=darker(wood, 0.4), w=0.6, smooth=False, wobble=0.15)


def table_top(c, y0=418, y1=548, wood="#a8703f"):
    """Mặt bàn ăn chạy ngang khung (người ngồi phía sau)."""
    c.shape(rect_pts(0, y0, 800, y1), wood, smooth=False, grad=darker(wood, 0.15), shade=0, hi=0, ow=1.2)
    c.shape(rect_pts(0, y1, 800, 600), darker(wood, 0.3), smooth=False, shade=0, hi=0, ow=1.2)
    random.seed(11)
    for k in range(22):
        y = random.uniform(y0 + 6, y1 - 4)
        x = random.uniform(-40, 760)
        L = random.uniform(80, 220)
        c.line([(x + L * t / 6, y + 2.5 * math.sin(t + k)) for t in range(7)], color=darker(wood, 0.3), w=0.6,
               wobble=0.1)


def clock(c, cx, cy, r, hour=10, minute=10, rim="#8a5a2b", roman=True, legs=False, bells=False):
    """Đồng hồ treo tường (hoặc đồng hồ báo thức nếu bells=True)."""
    if bells:
        for sx in (-1, 1):
            c.shape(ellipse_pts(cx + sx * r * 0.62, cy - r * 0.92, r * 0.34, r * 0.26, 20), "#c9a24a", shade=0.5, hi=0.5,
                    depth=r * 0.1, ow=1.2)
        c.line([(cx - r * 0.3, cy - r * 1.2), (cx, cy - r * 1.3), (cx + r * 0.3, cy - r * 1.2)], w=2.0)
    if legs:
        for sx in (-1, 1):
            c.line([(cx + sx * r * 0.55, cy + r * 0.8), (cx + sx * r * 0.75, cy + r * 1.15)], w=2.4)
    c.shadow(ellipse_pts(cx, cy, r, r, 40), 0.3, blur=6, dx=6, dy=6)
    c.shape(ellipse_pts(cx, cy, r, r, 48), rim, shade=0.5, hi=0.5, depth=r * 0.18, ow=1.6)
    c.shape(ellipse_pts(cx, cy, r * 0.84, r * 0.84, 48), "#f6efdc", shade=0.25, hi=0.2, depth=r * 0.12, ow=1.2)
    nums = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"]
    for i in range(12):
        a = math.radians(i * 30 - 90)
        if roman and r >= 50:
            c.text((cx + math.cos(a) * r * 0.66, cy + math.sin(a) * r * 0.66), nums[i], r * 0.15, face="serif")
        else:
            c.line([(cx + math.cos(a) * r * 0.62, cy + math.sin(a) * r * 0.62),
                    (cx + math.cos(a) * r * 0.76, cy + math.sin(a) * r * 0.76)], w=1.6 if i % 3 == 0 else 1.0,
                   smooth=False)
    for i in range(60):
        a = math.radians(i * 6)
        c.line([(cx + math.cos(a) * r * 0.79, cy + math.sin(a) * r * 0.79),
                (cx + math.cos(a) * r * 0.82, cy + math.sin(a) * r * 0.82)], w=0.6, smooth=False, wobble=0)
    ha = math.radians((hour % 12 + minute / 60) * 30 - 90)
    ma = math.radians(minute * 6 - 90)
    for ang, L, w in ((ha, 0.45, 3.2), (ma, 0.68, 2.0)):
        tip = (cx + math.cos(ang) * r * L, cy + math.sin(ang) * r * L)
        c.line([(cx, cy), tip], w=w, smooth=False, wobble=0, taper=False)
        c.spot(tip[0] - math.cos(ang) * r * 0.06, tip[1] - math.sin(ang) * r * 0.06, w * 0.9, w * 0.9, c.ink, 1, blur=0.1)
    c.spot(cx, cy, r * 0.05, r * 0.05, c.ink, 1, blur=0.1)


def paper(c, x0, y0, x1, y1, color="#fbf6e8", lines=6, title=None, title_size=16, ruled=False, shade=0.25,
          line_color=None, start=None):
    """Tờ giấy có tiêu đề và các dòng chữ giả (nét nguệch ngoạc)."""
    c.shadow(rect_pts(x0, y0, x1, y1), 0.25, blur=4, dx=4, dy=5, smooth=False)
    c.shape(rect_pts(x0, y0, x1, y1), color, smooth=False, shade=shade, hi=0.1, depth=6, ow=1.2)
    y = start or y0 + 18
    if title:
        c.text(((x0 + x1) / 2, y + title_size * 0.4), title, title_size, face="serif")
        y += title_size * 1.6
    if ruled:
        for k in range(int((y1 - y - 6) // 18)):
            c.line([(x0 + 8, y + k * 18 + 10), (x1 - 8, y + k * 18 + 10)], color=line_color or "#9fb8cf", w=0.6,
                   smooth=False, wobble=0, taper=False)
    random.seed(int(x0 * 7 + y0))
    for k in range(lines):
        yy = y + 6 + k * 16
        if yy > y1 - 10:
            break
        xe = x1 - 14 - random.uniform(0, (x1 - x0) * 0.3)
        pts = [(x0 + 14 + t * (xe - x0 - 14) / 8, yy + random.uniform(-0.8, 0.8)) for t in range(9)]
        c.line(pts, color=line_color or mix(c.ink, c.paper, 0.35), w=1.0, wobble=0.4)


def bubble(c, cx, cy, rx, ry, text, tail, size=34, face="hand", color=INK_RED, thought=False, angle=0):
    """Bong bóng thoại có đuôi chỉ về `tail` (x, y); thought=True: bóng suy nghĩ với các chấm tròn."""
    pts = ellipse_pts(cx, cy, rx, ry, 14)
    if not thought:
        a = math.atan2(tail[1] - cy, tail[0] - cx)
        i = int(((math.degrees(a) % 360) / 360) * 14) % 14
        pts = pts[:i + 1] + [tail] + pts[i + 1:]
    c.shadow(pts, 0.18, blur=5, dx=4, dy=5)
    c.shape(pts, "#fffaf0", shade=0.12, hi=0, depth=8, ow=1.8)
    if thought:
        for t, r in ((0.35, 9), (0.65, 6)):
            x = cx + (tail[0] - cx) * (0.55 + t * 0.45)
            y = cy + (tail[1] - cy) * (0.55 + t * 0.45)
            c.shape(ellipse_pts(x, y, r, r * 0.85, 12), "#fffaf0", shade=0.1, hi=0, depth=3, ow=1.4)
    if text:
        c.text((cx, cy), text, size, face=face, color=color, angle=angle)


def banner(c, cx, cy, text, w=None, size=28, color="#c9a35a", text_color=None):
    """Băng rôn cuộn kiểu nhãn sách cổ (biển hiệu, tên cửa hàng...). KHÔNG dùng để ghi từ vựng lên ảnh."""
    w = w or max(200, len(text) * size * 0.62 + 60)
    h = size * 1.5
    x0, x1 = cx - w / 2, cx + w / 2
    for sx, xe in ((-1, x0), (1, x1)):
        tail = [(xe - sx * 10, cy - h * 0.2), (xe + sx * 34, cy - h * 0.2), (xe + sx * 22, cy + h * 0.3),
                (xe + sx * 34, cy + h * 0.8), (xe - sx * 10, cy + h * 0.8)]
        c.shape(tail, darker(color, 0.2), smooth=False, shade=0.5, hi=0.2, depth=6, ow=1.3)
        c.shape([(xe, cy + h * 0.5), (xe - sx * 12, cy + h * 0.5), (xe, cy + h * 0.8)], darker(color, 0.5),
                smooth=False, shade=0, hi=0, ow=1.0)
    body = [(x0, cy - h / 2), (cx, cy - h / 2 - 6), (x1, cy - h / 2), (x1, cy + h / 2), (cx, cy + h / 2 - 6),
            (x0, cy + h / 2)]
    c.shape(body, color, smooth=False, shade=0.35, hi=0.4, depth=8, ow=1.5)
    c.text((cx, cy - 2), text, size, face="serif", color=text_color or c.ink)


def plant(c, x, by, h=120, pot="#b5643c", leaf="#5f8f4a"):
    """Chậu cây lá to."""
    random.seed(int(x))
    for k in range(9):
        a = math.radians(-90 + (k - 4) * 20 + random.uniform(-6, 6))
        L = h * random.uniform(0.6, 0.95)
        tip = (x + math.cos(a) * L * 0.8, by - h * 0.3 + math.sin(a) * L)
        base = (x, by - h * 0.3)
        mid = ((base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2)
        nx, ny = -(tip[1] - base[1]), tip[0] - base[0]
        nl = math.hypot(nx, ny) or 1
        wv = L * 0.16
        c.shape([base, (mid[0] + nx / nl * wv, mid[1] + ny / nl * wv), tip, (mid[0] - nx / nl * wv, mid[1] - ny / nl * wv)],
                leaf, shade=0.5, hi=0.4, depth=6, ow=1.0)
        c.line([base, tip], color=darker(leaf, 0.5), w=0.7, smooth=False)
    c.shape([(x - h * 0.28, by - h * 0.32), (x + h * 0.28, by - h * 0.32), (x + h * 0.21, by), (x - h * 0.21, by)], pot,
            smooth=False, shade=0.5, hi=0.4, depth=8, ow=1.3)
    c.shape(rect_pts(x - h * 0.31, by - h * 0.36, x + h * 0.31, by - h * 0.29), darker(pot, 0.1), smooth=False,
            shade=0.4, hi=0.4, depth=3, ow=1.2)


def tree(c, x, by, h=140, leaf="#6f9a55", trunk="#7a5534"):
    c.shape([(x - h * 0.05, by), (x - h * 0.035, by - h * 0.5), (x + h * 0.035, by - h * 0.5), (x + h * 0.05, by)],
            trunk, smooth=False, shade=0.5, hi=0.3, depth=4, ow=1.1)
    for dx, dy, r in ((-0.22, -0.62, 0.24), (0.2, -0.64, 0.24), (0, -0.82, 0.3), (-0.05, -0.55, 0.22)):
        c.shape(ellipse_pts(x + dx * h, by + dy * h, r * h, r * h * 0.88, 18), leaf, shade=0.55, hi=0.35, depth=r * h * 0.4,
                ow=1.0)


def coin(c, x, y, r=12, color="#d8b25a"):
    c.shape(ellipse_pts(x, y, r, r * 0.9, 24), color, shade=0.5, hi=0.5, depth=r * 0.4, ow=1.1)
    c.text((x, y), "$", r * 1.1, face="georgia", color=darker(color, 0.55))


def coin_stack(c, x, by, n=4, r=16, color="#d8b25a"):
    for i in range(n):
        y = by - i * r * 0.42
        c.shape(ellipse_pts(x, y, r, r * 0.38, 24), color, shade=0.5, hi=0.4, depth=r * 0.2, ow=1.0)


def arrow(c, pts, color="#b8433a", w=6, head=18, dashed=False):
    """Mũi tên đường đi (dạng nét màu có viền mực)."""
    pts = catmull(pts, closed=False) if len(pts) > 2 else list(pts)
    if dashed:
        for i in range(0, len(pts) - 2, 4):
            c.line(pts[i:i + 3], color=color, w=w, smooth=False, wobble=0, taper=False)
    else:
        c.line(pts, color=color, w=w, smooth=False, wobble=0, taper=False)
    (ax, ay), (bx, by) = pts[-3], pts[-1]
    ang = math.atan2(by - ay, bx - ax)
    tip = (bx + math.cos(ang) * head * 0.6, by + math.sin(ang) * head * 0.6)
    p1 = (tip[0] - head * math.cos(ang - 0.5), tip[1] - head * math.sin(ang - 0.5))
    p2 = (tip[0] - head * math.cos(ang + 0.5), tip[1] - head * math.sin(ang + 0.5))
    c.shape([tip, p1, p2], color, smooth=False, shade=0.2, hi=0.2, depth=3, ow=1.2)


def sparkles(c, pts, color="#e9b83c"):
    for x, y, r in pts:
        star = [(x, y - r), (x + r * 0.28, y - r * 0.28), (x + r, y), (x + r * 0.28, y + r * 0.28), (x, y + r),
                (x - r * 0.28, y + r * 0.28), (x - r, y), (x - r * 0.28, y - r * 0.28)]
        c.shape(star, color, smooth=False, shade=0.2, hi=0.4, depth=2, ow=0.9)


def question_marks(c, pts, color=INK_RED):
    for x, y, s, a in pts:
        c.text((x, y), "?", s, face="georgia", color=color, angle=a)


def check(c, x, y, s=14, color="#4f7f3a"):
    c.line([(x - s * 0.6, y), (x - s * 0.15, y + s * 0.5), (x + s * 0.7, y - s * 0.6)], color=color, w=s * 0.22,
           smooth=False, wobble=0.2)


def cross(c, x, y, s=14, color="#b8433a"):
    c.line([(x - s * 0.6, y - s * 0.6), (x + s * 0.6, y + s * 0.6)], color=color, w=s * 0.22, smooth=False)
    c.line([(x + s * 0.6, y - s * 0.6), (x - s * 0.6, y + s * 0.6)], color=color, w=s * 0.22, smooth=False)


def stamp(c, cx, cy, text, size=22, color="#b8433a", angle=-8):
    """Con dấu mực đỏ hình chữ nhật (TENTATIVE, DRAFT, ...)."""
    w = len(text) * size * 0.66 + 26
    h = size * 1.7
    a = math.radians(angle)
    pts = [(cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a))
           for x, y in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]
    c.stroke(pts + [pts[0]], color=color, w=2.4, wobble=0.3, taper=False)
    c.text((cx, cy), text, size, face="type", color=color, angle=-angle)


# ---------------------------------------------------------------- đồ vật thường gặp
def magnifier(c, x, y, r=34, angle=45, handle="#6d4a2e"):
    """Kính lúp: tâm kính (x, y), cán chéo xuống theo `angle` (độ)."""
    a = math.radians(angle)
    hx0, hy0 = x + math.cos(a) * r, y + math.sin(a) * r
    hx1, hy1 = x + math.cos(a) * r * 2.4, y + math.sin(a) * r * 2.4
    from_pts = limb_pts((hx0, hy0), (hx1, hy1), r * 0.16, r * 0.2)
    c.shape(from_pts, handle, shade=0.45, hi=0.4, depth=3, ow=1.3)
    c.shape(ellipse_pts(x, y, r * 1.12, r * 1.12, 32), "#b9a06a", shade=0.45, hi=0.5, depth=r * 0.15, ow=1.4)
    c.shape(ellipse_pts(x, y, r, r, 32), "#dcebef", grad="#b8d0d8", shade=0.15, hi=0.5, depth=r * 0.2, ow=1.0)
    c.spot(x - r * 0.35, y - r * 0.35, r * 0.25, r * 0.12, "#ffffff", 0.8)


def gear(c, x, y, r, teeth=10, color="#c9a24a", rot=0):
    pts = []
    for i in range(teeth * 4):
        a = math.radians(rot + i * 360 / (teeth * 4))
        rr = r if (i % 4) in (0, 1) else r * 0.8
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    c.shape(pts, color, smooth=False, shade=0.5, hi=0.5, depth=r * 0.2, ow=1.3)
    c.shape(ellipse_pts(x, y, r * 0.5, r * 0.5, 24), lighter(color, 0.15), shade=0.4, hi=0.3, depth=r * 0.1, ow=1.0)
    c.shape(ellipse_pts(x, y, r * 0.14, r * 0.14, 12), darker(color, 0.4), shade=0.2, depth=2, ow=1.0)


def book(c, x0, y0, w, h, color="#8a3a2e", open_=False, title=None):
    """Sách đóng (đứng/nằm) hoặc mở (open_=True, hai trang)."""
    if open_:
        cx = x0 + w / 2
        for sx in (-1, 1):
            xe = x0 if sx < 0 else x0 + w
            c.shape([(cx, y0 + 6), (xe, y0), (xe, y0 + h), (cx, y0 + h + 6)], "#fbf6e8", smooth=False, shade=0.3,
                    hi=0.1, depth=6, ow=1.3)
            for k in range(5):
                yy = y0 + 14 + k * (h - 24) / 5
                c.line([(cx + sx * 8, yy + 4), (xe - sx * 10, yy)], color=mix(c.ink, c.paper, 0.45), w=0.8,
                       smooth=False)
        c.line([(cx, y0 + 6), (cx, y0 + h + 6)], w=1.2, smooth=False)
        return
    c.shape(rect_pts(x0, y0, x0 + w, y0 + h), color, smooth=False, shade=0.45, hi=0.4, depth=6, ow=1.3)
    c.shape(rect_pts(x0 + w * 0.12, y0, x0 + w * 0.2, y0 + h), darker(color, 0.3), smooth=False, shade=0, hi=0,
            ow=0.8)
    if title:
        c.text((x0 + w * 0.6, y0 + h / 2), title, min(14, h * 0.3), face="serif", color=CREAM_T)


CREAM_T = (246, 240, 226)


def book_stack(c, x, by, n=5, w=110, colors=("#8a3a2e", "#3f5f7e", "#5f7f4a", "#a8703f", "#6d4a6e")):
    random.seed(int(x * 3 + n))
    y = by
    for i in range(n):
        h = random.uniform(16, 24)
        dx = random.uniform(-8, 8)
        col = colors[i % len(colors)]
        c.shape(rect_pts(x + dx, y - h, x + dx + w, y), col, smooth=False, shade=0.4, hi=0.35, depth=4, ow=1.2)
        c.shape(rect_pts(x + dx + w - 8, y - h + 3, x + dx + w - 2, y - 3), "#f1e6c8", smooth=False, shade=0, hi=0,
                ow=0.6)
        y -= h
    return y


def suitcase(c, x0, y0, w, h, color="#8a3a2e"):
    c.shadow(rect_pts(x0, y0, x0 + w, y0 + h), 0.3, blur=4, dx=6, dy=4, smooth=False)
    c.shape(rect_pts(x0 + w * 0.36, y0 - h * 0.16, x0 + w * 0.64, y0 + 4), darker(color, 0.4), smooth=False, shade=0.3,
            hi=0.3, depth=3, ow=1.2)
    c.shape(rect_pts(x0 + w * 0.42, y0 - h * 0.1, x0 + w * 0.58, y0), c.paper, smooth=False, shade=0, hi=0,
            outline=False)
    c.shape(rect_pts(x0, y0, x0 + w, y0 + h), color, smooth=False, shade=0.5, hi=0.4, depth=12, ow=1.5)
    for t in (0.22, 0.78):
        c.shape(rect_pts(x0 + w * t - 4, y0, x0 + w * t + 4, y0 + h), "#c9a35a", smooth=False, shade=0.4, hi=0.4,
                depth=2, ow=1.0)


def briefcase(c, x0, y0, w, h, color="#5a3a26"):
    c.shape([(x0 + w * 0.34, y0 + 2), (x0 + w * 0.36, y0 - h * 0.22), (x0 + w * 0.64, y0 - h * 0.22),
             (x0 + w * 0.66, y0 + 2)], darker(color, 0.2), smooth=False, shade=0.3, hi=0.3, depth=2, ow=1.2)
    c.shape([(x0 + w * 0.4, y0 + 2), (x0 + w * 0.41, y0 - h * 0.12), (x0 + w * 0.59, y0 - h * 0.12),
             (x0 + w * 0.6, y0 + 2)], c.paper, smooth=False, shade=0, hi=0, outline=False)
    c.shape(rect_pts(x0, y0, x0 + w, y0 + h), color, smooth=False, shade=0.5, hi=0.4, depth=10, ow=1.4)
    c.line([(x0, y0 + h * 0.3), (x0 + w, y0 + h * 0.3)], w=1.0, smooth=False)
    c.spot(x0 + w / 2, y0 + h * 0.3, 4, 3, "#d8b25a", 1, blur=0.2)


def umbrella(c, x, y, r=80, color="#3f5f7e", tilt=0):
    """Ô mở: (x, y) = đỉnh tán; cán thẳng xuống."""
    c.line([(x, y), (x, y + r * 1.5)], color="#4a3a2a", w=3, smooth=False, taper=False)
    c.stroke(ellipse_pts(x - 10, y + r * 1.5, 10, 10, 12, 0, 180), color="#4a3a2a", w=3, taper=False)
    pts = ellipse_pts(x, y + r * 0.55, r, r * 0.7, 24, 180, 360)
    scal = []
    for i in range(5):
        x0 = x + r - i * 2 * r / 5
        x1 = x0 - 2 * r / 5
        scal += [(x0, y + r * 0.55), ((x0 + x1) / 2, y + r * 0.42)]
    c.shape(pts + scal, color, smooth=False, shade=0.5, hi=0.4, depth=r * 0.25, ow=1.5)
    for i in range(1, 5):
        xx = x + r - i * 2 * r / 5
        c.line([(x, y), (xx, y + r * 0.55)], color=darker(color, 0.45), w=0.9, smooth=False)


def mortarboard(c, x, y, s=30, color="#2f2a28"):
    """Mũ tốt nghiệp đặt trên đầu tại (x, y) = đỉnh đầu."""
    c.shape([(x - s * 0.5, y + s * 0.05), (x + s * 0.5, y + s * 0.05), (x + s * 0.45, y - s * 0.25),
             (x - s * 0.45, y - s * 0.25)], color, smooth=False, shade=0.3, hi=0.3, depth=2, ow=1.1)
    c.shape([(x - s, y - s * 0.28), (x, y - s * 0.58), (x + s, y - s * 0.28), (x, y + 0.02 * s)], color, smooth=False,
            shade=0.3, hi=0.4, depth=3, ow=1.2)
    c.line([(x, y - s * 0.28), (x + s * 0.7, y - s * 0.1), (x + s * 0.72, y + s * 0.3)], color="#d8b25a", w=1.6)


def heart(c, x, y, s=16, color="#c9483a"):
    pts = [(x, y + s * 0.9), (x - s, y - s * 0.1), (x - s * 0.85, y - s * 0.7), (x - s * 0.35, y - s * 0.85),
           (x, y - s * 0.4), (x + s * 0.35, y - s * 0.85), (x + s * 0.85, y - s * 0.7), (x + s, y - s * 0.1)]
    c.shape(pts, color, shade=0.4, hi=0.5, depth=s * 0.3, ow=1.1)


def music_note(c, x, y, s=24, color=None, double=False):
    col = color or c.ink
    c.shape(ellipse_pts(x, y, s * 0.38, s * 0.27, 16, rot=-20), col, shade=0, hi=0.3, depth=2, ow=0.8)
    c.line([(x + s * 0.34, y - s * 0.05), (x + s * 0.34, y - s * 1.2)], color=col, w=s * 0.08, smooth=False,
           taper=False)
    if double:
        c.shape(ellipse_pts(x + s * 0.8, y - s * 0.15, s * 0.38, s * 0.27, 16, rot=-20), col, shade=0, hi=0.3,
                depth=2, ow=0.8)
        c.line([(x + s * 1.14, y - s * 0.2), (x + s * 1.14, y - s * 1.35)], color=col, w=s * 0.08, smooth=False,
               taper=False)
        c.line([(x + s * 0.34, y - s * 1.2), (x + s * 1.14, y - s * 1.35)], color=col, w=s * 0.22, smooth=False,
               taper=False)
    else:
        c.line([(x + s * 0.34, y - s * 1.2), (x + s * 0.7, y - s * 0.85)], color=col, w=s * 0.1)


def easel(c, x, by, w=170, h=140, canvas_color="#f6efdc", wood="#7a4c2a"):
    """Giá vẽ có khung tranh; trả về khung (x0, y0, x1, y1) để vẽ tranh lên."""
    top = by - h - 140
    for a, b in (((x - w * 0.35, by), (x - w * 0.12, top)), ((x + w * 0.35, by), (x + w * 0.12, top)),
                 ((x, by - 10), (x, top)), ):
        c.line([a, b], color=wood, w=5, smooth=False, taper=False)
    x0, y0, x1, y1 = x - w / 2, top + 20, x + w / 2, top + 20 + h
    c.shape(rect_pts(x0, y0, x1, y1), canvas_color, smooth=False, shade=0.3, hi=0.1, depth=6, ow=1.4)
    c.shape(rect_pts(x0 - 10, y1, x1 + 10, y1 + 8), wood, smooth=False, shade=0.3, hi=0.3, depth=2, ow=1.0)
    return x0, y0, x1, y1


def column_building(c, x0, by, w, h, color="#e8dcc0", n=6):
    """Toà nhà cổ điển có cột và mái tam giác (trường đại học, cơ quan)."""
    c.shape(rect_pts(x0 - 20, by - 18, x0 + w + 20, by), darker(color, 0.1), smooth=False, shade=0.3, hi=0.3,
            depth=4, ow=1.3)
    c.shape(rect_pts(x0 - 10, by - 32, x0 + w + 10, by - 18), color, smooth=False, shade=0.3, hi=0.3, depth=4, ow=1.2)
    top = by - h
    c.shape(rect_pts(x0, top + 36, x0 + w, by - 32), darker(color, 0.12), smooth=False, shade=0.3, hi=0.1, depth=10,
            ow=1.2)
    for i in range(n):
        cx = x0 + 18 + i * (w - 36) / (n - 1)
        c.shape(rect_pts(cx - 11, top + 46, cx + 11, by - 32), color, smooth=False, shade=0.5, hi=0.5, depth=8,
                ow=1.2)
        for k in (-5, 0, 5):
            c.line([(cx + k, top + 50), (cx + k, by - 36)], color=darker(color, 0.25), w=0.6, smooth=False)
    c.shape(rect_pts(x0 - 14, top + 24, x0 + w + 14, top + 46), color, smooth=False, shade=0.3, hi=0.3, depth=4,
            ow=1.2)
    c.shape([(x0 - 20, top + 24), (x0 + w / 2, top - h * 0.18), (x0 + w + 20, top + 24)], color, smooth=False,
            shade=0.45, hi=0.4, depth=10, ow=1.4)


def chest(c, x0, by, w=150, h=90, wood="#8a5a34", glow=True):
    """Rương báu mở nắp, có vàng bên trong."""
    if glow:
        c.glow(x0 + w / 2, by - h, w * 0.9, "#fff1b0", 0.6)
    c.shape([(x0, by - h), (x0 + w, by - h), (x0 + w - 6, by - h - h * 0.7), (x0 + 6, by - h - h * 0.7)], darker(wood, 0.2),
            smooth=False, shade=0.4, hi=0.3, depth=6, ow=1.4)
    for k in range(9):
        coin_x = x0 + 14 + k * (w - 28) / 8
        c.shape(ellipse_pts(coin_x, by - h + 4, 12, 7, 14), "#e0b63c", shade=0.4, hi=0.6, depth=3, ow=0.9)
    c.shape(rect_pts(x0, by - h + 6, x0 + w, by), wood, smooth=False, shade=0.5, hi=0.4, depth=12, ow=1.5)
    for t in (0.15, 0.85):
        c.shape(rect_pts(x0 + w * t - 5, by - h + 6, x0 + w * t + 5, by), "#c9a35a", smooth=False, shade=0.4, hi=0.4,
                depth=2, ow=1.0)
    c.shape(rect_pts(x0 + w / 2 - 9, by - h + 14, x0 + w / 2 + 9, by - h + 36), "#c9a35a", smooth=False, shade=0.4,
            hi=0.5, depth=2, ow=1.0)


def stage(c, floor_y=470, curtain="#9c2f2a", wall="#4a3a36"):
    """Sân khấu: nền tối, rèm hai bên + diềm trên, sàn gỗ."""
    c.shape(rect_pts(0, 0, 800, floor_y), wall, smooth=False, grad=darker(wall, 0.2), shade=0, hi=0, outline=False)
    c.glow(400, floor_y - 160, 260, "#fff1c8", 0.4)
    c.shape(rect_pts(0, floor_y, 800, 600), "#8a5a34", smooth=False, grad="#6b4428", shade=0, hi=0, ow=1.2)
    for k in range(-6, 8):
        c.line([(400 + k * 60, floor_y), (400 + k * 120, 600)], color="#5e3a21", w=0.8, smooth=False, wobble=0.1)
    for side in (-1, 1):
        x = 0 if side < 0 else 800
        c.shape([(x, 0), (x - side * 130, 0), (x - side * 86, floor_y * 0.55), (x - side * 110, floor_y + 20),
                 (x, floor_y + 20)], curtain, shade=0.5, hi=0.3, depth=24, ow=1.4)
    for x in range(0, 800, 60):
        c.shape([(x, 0), (x + 60, 0), (x + 56, 54), (x + 30, 68), (x + 4, 54)], curtain, shade=0.5, hi=0.3, depth=10,
                ow=1.2)


def lamp(c, x, by, h=120, shade_color="#d8b25a", on=True):
    """Đèn bàn chân đế + chao."""
    if on:
        c.glow(x, by - h + 10, h * 1.2, "#fff2c0", 0.5)
    c.shape([(x - 26, by), (x + 26, by), (x + 18, by - 10), (x - 18, by - 10)], "#4a3a2a", smooth=False, shade=0.4,
            hi=0.4, depth=3, ow=1.2)
    c.line([(x, by - 10), (x, by - h + 30)], color="#4a3a2a", w=3, smooth=False, taper=False)
    c.shape([(x - 44, by - h + 34), (x + 44, by - h + 34), (x + 24, by - h - 10), (x - 24, by - h - 10)], shade_color,
            smooth=False, shade=0.4, hi=0.5, depth=6, ow=1.3)


def crate(c, x0, y0, w, h, wood="#b98a52"):
    c.shape(rect_pts(x0, y0, x0 + w, y0 + h), wood, smooth=False, shade=0.5, hi=0.4, depth=10, ow=1.5)
    for k in range(1, 4):
        y = y0 + h * k / 4
        c.line([(x0, y), (x0 + w, y)], color=darker(wood, 0.45), w=1.0, smooth=False)
    c.line([(x0 + 6, y0 + 6), (x0 + w - 6, y0 + h - 6)], color=darker(wood, 0.4), w=3, smooth=False, taper=False)


def hat(c, x, y, s=30, color="#2f2a28", kind="top"):
    """Mũ trên đỉnh đầu (x, y): top = mũ chóp cao, chef = mũ đầu bếp, cap = mũ thuyền trưởng, beret."""
    if kind == "top":
        c.shape(ellipse_pts(x, y, s * 0.95, s * 0.2, 20), color, shade=0.3, hi=0.3, depth=2, ow=1.1)
        c.shape(rect_pts(x - s * 0.55, y - s * 1.0, x + s * 0.55, y), color, smooth=False, shade=0.4, hi=0.4, depth=4,
                ow=1.2)
        c.shape(rect_pts(x - s * 0.55, y - s * 0.3, x + s * 0.55, y - s * 0.12), "#8a3a2e", smooth=False, shade=0,
                hi=0, ow=0.8)
    elif kind == "chef":
        c.shape(rect_pts(x - s * 0.6, y - s * 0.4, x + s * 0.6, y + s * 0.05), "#fbf8f0", smooth=False, shade=0.3,
                hi=0.2, depth=3, ow=1.1)
        for dx, dy, r in ((-0.45, -0.7, 0.42), (0.45, -0.7, 0.42), (0, -0.95, 0.5)):
            c.shape(ellipse_pts(x + dx * s, y + dy * s, r * s, r * s * 0.85, 16), "#fbf8f0", shade=0.3, hi=0.2,
                    depth=3, ow=1.1)
    elif kind == "cap":
        c.shape([(x - s * 0.7, y + s * 0.05), (x + s * 0.7, y + s * 0.05), (x + s * 0.8, y - s * 0.35),
                 (x - s * 0.8, y - s * 0.35)], "#2f3a4e", shade=0.4, hi=0.4, depth=3, ow=1.2)
        c.shape(ellipse_pts(x, y + s * 0.08, s * 0.8, s * 0.14, 20, 0, 180), "#1f1a18", smooth=False, shade=0.2,
                depth=2, ow=1.0)
        c.spot(x, y - s * 0.15, s * 0.14, s * 0.12, "#d8b25a", 1, blur=0.2)
    else:  # beret
        c.shape(ellipse_pts(x - s * 0.1, y - s * 0.15, s * 0.8, s * 0.3, 20, rot=-8), color, shade=0.4, hi=0.4,
                depth=3, ow=1.1)
