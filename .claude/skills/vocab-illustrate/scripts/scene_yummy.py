"""Cảnh mẫu "yummy" (bản người dùng chọn): cô bé ngồi bàn ăn, tay chống má, giơ thìa bánh flan, khen "Yummy!".
Vẽ tay từng bộ phận (không dùng parts.person) nên chi tiết hơn; tham khảo khi cần cảnh người ngồi bàn cận cảnh."""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paint import Canvas, catmull, ellipse_pts, mix, darker, lighter

SKIN = "#f1c7a0"
HAIR = "#6b3f22"
DRESS = "#e3b23c"
WOOD = "#a8703f"
CUSTARD = "#f1c35a"
CARAMEL = "#8e3f17"


def background(c):
    # tường dán giấy kẻ sọc + hoa nhỏ
    c.shape([(0, 0), (800, 0), (800, 420), (0, 420)], "#ead8b2", smooth=False, shade=0.0, hi=0.0, outline=False)
    for x in range(0, 800, 44):
        c.shape([(x + 14, 0), (x + 26, 0), (x + 26, 420), (x + 14, 420)], "#e1c99c", smooth=False, shade=0, hi=0,
                 outline=False, texture=0.4)
    random.seed(7)
    for row, y in enumerate(range(28, 330, 52)):
        for x in range(0 if row % 2 else 22, 800, 44):
            if 535 < x < 790 and 30 < y < 320:
                continue
            for a in range(0, 360, 72):
                px, py = x + 4 * math.cos(math.radians(a)), y + 4 * math.sin(math.radians(a))
                c.spot(px, py, 2.4, 2.4, "#c98f6a", 0.55, blur=0.2)
            c.spot(x, y, 1.6, 1.6, "#8f9a5a", 0.7, blur=0.2)
    # ánh sáng từ cửa sổ hắt lên tường
    c.glow(640, 200, 260, "#fff6dc", 0.35)
    # gờ tường (chair rail) và ốp gỗ phía dưới
    c.shape([(0, 330), (800, 330), (800, 342), (0, 342)], "#9b6a40", smooth=False, shade=0.3, hi=0.3, depth=4, ow=1.0)
    c.shape([(0, 342), (800, 342), (800, 420), (0, 420)], "#c6a173", smooth=False, shade=0.15, hi=0, outline=False)
    for x in range(30, 800, 120):
        c.shape([(x, 354), (x + 90, 354), (x + 90, 412), (x, 412)], "#bf986a", smooth=False, shade=0.3, hi=0.25,
                 depth=3, ow=0.9)

    # cửa sổ bên phải: trời, cây, khung gỗ trắng
    c.shape([(568, 46), (762, 46), (762, 300), (568, 300)], "#f4efe2", smooth=False, shade=0.3, hi=0.2, depth=6, ow=1.4)
    c.shape([(582, 60), (748, 60), (748, 286), (582, 286)], "#b9d8e6", smooth=False, grad="#eef3e4", shade=0, hi=0,
            outline=False)
    c.shape([(582, 240), (640, 222), (700, 232), (748, 218), (748, 286), (582, 286)], "#9fbf86", shade=0.2, hi=0.2,
            outline=False)
    for cx, cy, r in ((618, 190, 34), (650, 170, 40), (690, 196, 30), (600, 214, 22)):
        c.shape(ellipse_pts(cx, cy, r, r * 0.9, 16), "#6f9a55", shade=0.5, hi=0.35, ow=0.8)
    c.shape([(645, 205), (655, 205), (657, 262), (643, 262)], "#7a5534", smooth=False, shade=0.4, ow=0.8)
    c.shape([(660, 60), (670, 60), (670, 286), (660, 286)], "#f4efe2", smooth=False, shade=0.2, hi=0.2, depth=3, ow=1)
    c.shape([(582, 168), (748, 168), (748, 177), (582, 177)], "#f4efe2", smooth=False, shade=0.2, hi=0.2, depth=3, ow=1)
    c.shape([(560, 300), (770, 300), (776, 314), (554, 314)], "#efe8d8", smooth=False, shade=0.4, hi=0.3, depth=4, ow=1.2)
    # rèm đỏ hai bên, có nếp gấp
    left = [(546, 30), (600, 30), (596, 120), (586, 200), (600, 300), (560, 318), (548, 210), (552, 120)]
    right = [(732, 30), (786, 30), (782, 120), (790, 210), (780, 318), (738, 300), (744, 200), (736, 120)]
    for pts in (left, right):
        c.shape(pts, "#b85445", shade=0.5, hi=0.3, depth=14, ow=1.4)
    for x0 in (562, 578, 752, 768):
        c.line([(x0, 34), (x0 - 2, 120), (x0 + 3, 200), (x0, 296)], color=darker("#b85445", 0.45), w=1.0)
    c.shape([(536, 22), (796, 22), (796, 34), (536, 34)], "#7d5534", smooth=False, shade=0.4, hi=0.4, depth=3, ow=1)

    # tranh treo tường bên trái: bát hoa quả
    c.shape([(70, 196), (176, 196), (176, 292), (70, 292)], "#b8873b", smooth=False, shade=0.45, hi=0.5, depth=6, ow=1.3)
    c.shape([(80, 206), (166, 206), (166, 282), (80, 282)], "#efe2c2", smooth=False, shade=0.2, hi=0, outline=False)
    c.shape(ellipse_pts(110, 250, 13, 13, 16), "#c9483a", shade=0.5, hi=0.4, ow=0.8)
    c.shape(ellipse_pts(134, 246, 14, 12, 16), "#e0a03a", shade=0.5, hi=0.4, ow=0.8)
    c.shape(ellipse_pts(122, 236, 10, 9, 16), "#8fae4a", shade=0.5, hi=0.4, ow=0.8)
    c.shape([(96, 256), (150, 256), (142, 274), (104, 274)], "#6d7fa8", shade=0.4, hi=0.3, ow=0.9)


def table(c):
    c.shape([(0, 418), (800, 418), (800, 548), (0, 548)], WOOD, smooth=False, grad="#946035", shade=0.0, hi=0.0, ow=1.2)
    c.shape([(0, 548), (800, 548), (800, 600), (0, 600)], "#7a4c2a", smooth=False, shade=0.0, hi=0.0, ow=1.2)
    random.seed(11)
    # vân gỗ và khe giữa các tấm ván
    for y in (450, 486, 520):
        c.line([(0, y), (800, y + 2)], color=darker(WOOD, 0.5), w=0.9, smooth=False, wobble=0.2)
    for k in range(26):
        y = random.uniform(424, 544)
        x = random.uniform(-40, 760)
        L = random.uniform(80, 220)
        pts = [(x + L * t / 6, y + 2.5 * math.sin(t + k)) for t in range(7)]
        c.line(pts, color=darker(WOOD, 0.3), w=0.6, wobble=0.1)
    c.glow(560, 460, 200, "#ffe9c0", 0.18)


def placemat(c):
    """Khăn kẻ ca rô đỏ trắng dưới đĩa (vẽ theo phối cảnh)."""
    tl, tr, br, bl = (176, 452), (488, 452), (526, 540), (136, 540)
    c.shadow([tl, tr, br, bl], 0.25, blur=4, dx=3, dy=4, smooth=False)
    c.shape([tl, tr, br, bl], "#f6efe0", smooth=False, shade=0.0, hi=0.0, outline=False)
    lerp = lambda a, b, t: (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    n = 12
    for i in range(0, n, 2):
        t0, t1 = i / n, (i + 1) / n
        c.shape([lerp(tl, tr, t0), lerp(tl, tr, t1), lerp(bl, br, t1), lerp(bl, br, t0)], "#d8a39a", smooth=False,
                shade=0, hi=0, outline=False, texture=0.3)
    for i in range(0, 8, 2):
        t0, t1 = i / 8, (i + 1) / 8
        a0, a1 = lerp(tl, bl, t0), lerp(tl, bl, t1)
        b0, b1 = lerp(tr, br, t0), lerp(tr, br, t1)
        c.shape([a0, b0, b1, a1], "#cf8b80", smooth=False, shade=0, hi=0, outline=False, texture=0.3)
    c.stroke([tl, tr, br, bl, tl], w=1.1, wobble=0.3, taper=False)


def girl(c):
    # tóc phía sau (bob)
    c.shape([(250, 232), (252, 160), (285, 110), (330, 96), (375, 110), (408, 160), (410, 232), (404, 274),
             (380, 284), (330, 250), (280, 284), (256, 274)], HAIR, shade=0.6, hi=0.35, depth=22, ow=1.6)
    # cổ, thân váy, cổ áo trắng
    c.shape([(312, 262), (348, 262), (350, 304), (310, 304)], darker(SKIN, 0.12), smooth=False, shade=0.5, depth=10, ow=1.2)
    c.shape([(244, 318), (290, 298), (330, 304), (370, 298), (416, 318), (432, 370), (436, 430), (224, 430),
             (228, 370)], DRESS, shade=0.55, hi=0.3, depth=26, ow=1.6)
    for y in (360, 392):  # đường may / nút áo
        c.spot(330, y, 4, 4, "#f7f0e0", 0.95, blur=0.15)
        c.stroke(ellipse_pts(330, y, 4, 4, 12), w=0.7, closed=True, taper=False)
    c.shape([(330, 302), (308, 296), (284, 304), (290, 326), (316, 326)], "#fbf6ea", shade=0.35, hi=0.2, depth=6, ow=1.2)
    c.shape([(330, 302), (352, 296), (376, 304), (370, 326), (344, 326)], "#fbf6ea", shade=0.35, hi=0.2, depth=6, ow=1.2)
    # tai
    for ex in (268, 392):
        c.shape(ellipse_pts(ex, 214, 9, 14, 16), SKIN, shade=0.5, hi=0.2, depth=5, ow=1.2)
    FACE = [(272, 196), (279, 152), (330, 130), (381, 152), (388, 196), (380, 244), (356, 272), (330, 279),
            (304, 272), (280, 244)]
    c.shadow(FACE, 0.35, blur=5, dx=0, dy=9)
    # mặt
    c.shape([(272, 196), (279, 152), (330, 130), (381, 152), (388, 196), (380, 244), (356, 272), (330, 279),
             (304, 272), (280, 244)], SKIN, shade=0.4, hi=0.35, depth=20, ow=1.6)
    c.spot(294, 236, 14, 9, "#ec8f86", 0.45)  # má hồng
    c.spot(366, 236, 14, 9, "#ec8f86", 0.45)
    BANGS = [(270, 196), (272, 150), (300, 120), (330, 112), (362, 120), (390, 150), (392, 196), (380, 172),
             (366, 182), (350, 164), (334, 178), (318, 162), (300, 178), (284, 166)]
    c.shadow(BANGS, 0.28, blur=4, dx=-2, dy=6)
    # tóc mái
    c.shape([(270, 196), (272, 150), (300, 120), (330, 112), (362, 120), (390, 150), (392, 196), (380, 172),
             (366, 182), (350, 164), (334, 178), (318, 162), (300, 178), (284, 166)], HAIR, shade=0.5, hi=0.45,
            depth=14, ow=1.5)
    for pts in ([(300, 124), (292, 150), (286, 166)], [(330, 116), (326, 146), (318, 160)],
                [(356, 122), (360, 150), (350, 162)], [(376, 136), (384, 160), (380, 170)]):
        c.line(pts, color=darker(HAIR, 0.5), w=0.9)
    # nơ đỏ
    c.shape([(372, 126), (352, 110), (350, 136)], "#c8433a", shade=0.4, hi=0.4, depth=5, ow=1.1)
    c.shape([(372, 126), (394, 108), (396, 136)], "#c8433a", shade=0.4, hi=0.4, depth=5, ow=1.1)
    c.shape(ellipse_pts(373, 125, 6, 7, 12), "#a83429", shade=0.3, ow=1)
    # mắt nhắm cười, lông mày, mũi, miệng
    for x0 in (296, 342):
        c.line([(x0, 207), (x0 + 10, 199), (x0 + 21, 207)], w=2.0)
        c.line([(x0 + 1, 206), (x0 - 4, 202)], w=1.0)
        c.line([(x0 + 20, 206), (x0 + 25, 202)], w=1.0)
        c.line([(x0 - 1, 186), (x0 + 10, 180), (x0 + 22, 185)], color=darker(HAIR, 0.3), w=1.6)
    c.line([(331, 214), (327, 228), (333, 231)], color=darker(SKIN, 0.45), w=1.1)
    c.shape([(312, 244), (330, 247), (349, 244), (343, 259), (330, 265), (317, 259)], "#93343a", shade=0.3, hi=0,
            depth=5, ow=1.3)
    c.shape([(320, 258), (330, 254), (341, 258), (330, 264)], "#e07f7f", shade=0.2, hi=0.2, depth=3, outline=False)
    c.shape([(316, 245), (344, 245), (340, 250), (320, 250)], "#fbf5ec", smooth=False, shade=0, hi=0, outline=False)


def sleeve(c, elbow, wrist, w0, w1, upper_to=None):
    """Tay áo dài từ khuỷu tới cổ tay (thon dần), có nếp gấp và cổ tay áo trắng."""
    (ex, ey), (wx, wy) = elbow, wrist
    L = math.hypot(wx - ex, wy - ey)
    dx, dy = (wx - ex) / L, (wy - ey) / L
    px, py = -dy, dx
    pts = [(ex + px * w0, ey + py * w0), (ex + dx * L * 0.5 + px * (w0 + w1) * 0.55, ey + dy * L * 0.5 + py * (w0 + w1) * 0.55),
           (wx + px * w1, wy + py * w1), (wx - px * w1, wy - py * w1),
           (ex + dx * L * 0.5 - px * (w0 + w1) * 0.52, ey + dy * L * 0.5 - py * (w0 + w1) * 0.52),
           (ex - px * w0, ey - py * w0), (ex - dx * 10, ey - dy * 10)]
    c.shape(pts, DRESS, shade=0.6, hi=0.35, depth=10, ow=1.4)
    for t, k in ((0.3, 0.5), (0.55, -0.4), (0.75, 0.3)):
        cx, cy = ex + dx * L * t, ey + dy * L * t
        ww = w0 + (w1 - w0) * t
        c.line([(cx + px * ww * 0.7, cy + py * ww * 0.7), (cx + dx * 6 * k + px * ww * 0.1, cy + dy * 6 * k + py * ww * 0.1),
                (cx - px * ww * 0.4, cy - py * ww * 0.4 + 3)], color=darker(DRESS, 0.5), w=0.9)
    cw, th = w1 + 2, 9
    c.shape([(wx + px * cw - dx * th, wy + py * cw - dy * th), (wx + px * cw, wy + py * cw), (wx - px * cw, wy - py * cw),
             (wx - px * cw - dx * th, wy - py * cw - dy * th)], "#fbf6ea", smooth=False, shade=0.35, hi=0.2, depth=4,
            ow=1.2)


def arms(c):
    # tay trái (phía người xem): khuỷu tay chống bàn, bàn tay áp má
    c.shape([(244, 316), (276, 324), (262, 362), (230, 360), (226, 336)], DRESS, shade=0.55, hi=0.3, depth=12, ow=1.4)
    c.shape([(232, 352), (262, 358), (252, 410), (240, 446), (210, 448), (216, 400)], DRESS, shade=0.6, hi=0.3,
            depth=10, ow=1.4)
    sleeve(c, (222, 446), (268, 296), 17, 13)
    c.shape([(262, 286), (256, 252), (262, 224), (274, 216), (284, 226), (290, 252), (288, 282), (278, 292)], SKIN,
            shade=0.45, hi=0.3, depth=8, ow=1.4)
    for y in (234, 248, 262):
        c.line([(266, y), (282, y + 3)], color=darker(SKIN, 0.4), w=0.9)
    # tay phải: khuỷu tay chống bàn, tay cầm thìa
    c.shape([(386, 316), (418, 318), (434, 338), (430, 362), (398, 358)], DRESS, shade=0.55, hi=0.3, depth=12, ow=1.4)
    c.shape([(402, 354), (430, 356), (444, 400), (456, 444), (428, 448), (418, 404)], DRESS, shade=0.6, hi=0.3,
            depth=10, ow=1.4)
    # thìa: cán bạc + một miếng flan
    c.shape([(380, 282), (386, 276), (424, 318), (418, 324)], "#c9ced3", smooth=False, shade=0.4, hi=0.6, depth=2, ow=1.0)
    c.shape(ellipse_pts(372, 270, 15, 9, 20), "#d4d8dc", shade=0.5, hi=0.7, depth=4, ow=1.1)
    c.shape([(362, 266), (382, 266), (380, 258), (364, 258)], CUSTARD, smooth=False, shade=0.3, hi=0.3, depth=3, ow=0.9)
    c.shape([(364, 258), (380, 258), (378, 254), (366, 254)], CARAMEL, smooth=False, shade=0.2, hi=0.3, depth=2, ow=0.7)
    sleeve(c, (442, 448), (412, 322), 17, 13)
    # nắm tay
    c.shape([(394, 300), (404, 288), (420, 290), (428, 304), (424, 320), (408, 326), (396, 318)], SKIN, shade=0.45,
            hi=0.3, depth=8, ow=1.4)
    for y in (300, 308, 316):
        c.line([(400, y), (414, y + 1)], color=darker(SKIN, 0.4), w=0.9)


def food(c):
    # đĩa sứ
    c.shadow(ellipse_pts(330, 506, 120, 30, 40), 0.35, blur=6, dx=6, dy=6)
    c.shape(ellipse_pts(330, 502, 120, 30, 48), "#f7f4ee", shade=0.35, hi=0.3, depth=10, ow=1.4)
    c.shape(ellipse_pts(330, 500, 86, 20, 40), "#ece6dc", shade=0.0, hi=0.4, depth=6, ow=0.8)
    c.stroke(ellipse_pts(330, 502, 108, 26, 48), color="#5d7fae", w=0.9, closed=True, taper=False)  # viền xanh
    # sốt caramel loang trên đĩa
    c.shape([(266, 500), (290, 488), (330, 486), (372, 488), (396, 500), (380, 512), (330, 516), (282, 512)],
            CARAMEL, shade=0.3, hi=0.5, depth=4, ow=0.9)
    # thân bánh flan
    body = ellipse_pts(330, 446, 44, 10, 20, 180, 360) + ellipse_pts(330, 496, 58, 13, 24, 0, 180)
    body = [p for p in body]
    c.shape(body[::-1], CUSTARD, smooth=False, grad="#e4a23a", shade=0.45, hi=0.45, depth=16, ow=1.4)
    # lớp caramel trên mặt chảy xuống thành dòng
    top = ellipse_pts(330, 446, 44, 10, 24, 180, 360)
    drips = [(374, 448), (370, 462), (364, 452), (352, 456), (346, 470), (338, 456), (324, 458), (316, 466),
             (308, 455), (296, 458), (290, 448), (286, 446)]
    c.shape(top + drips, CARAMEL, smooth=False, shade=0.35, hi=0.55, depth=6, ow=1.2)
    c.spot(316, 444, 12, 3, "#f3c79a", 0.6)  # ánh bóng caramel
    # quả anh đào
    c.line([(332, 430), (338, 414), (346, 408)], color="#5b6b2e", w=1.4)
    c.shape(ellipse_pts(330, 437, 9, 8.5, 16), "#c4202e", shade=0.55, hi=0.3, depth=5, ow=1.1)
    c.spot(326, 433, 2.6, 2, "#fff4ec", 0.95, blur=0.2)
    # ly sữa bên phải
    c.shadow([(498, 470), (546, 470), (556, 478), (500, 482)], 0.3, blur=5, dx=10, dy=2)
    c.shape([(494, 382), (546, 382), (540, 474), (500, 474)], "#f6f4ef", smooth=False, grad="#e2ded6", shade=0.35,
            hi=0.5, depth=10, ow=1.3)
    c.shape([(497, 396), (543, 396), (539, 472), (501, 472)], "#fdfbf3", smooth=False, grad="#e9e4d6", shade=0.5,
            hi=0.3, depth=12, outline=False)
    c.shape(ellipse_pts(520, 396, 23, 5, 24), "#fffef8", shade=0.1, hi=0.2, depth=2, ow=0.8)
    c.stroke(ellipse_pts(520, 382, 26, 6, 32), w=1.0, closed=True, taper=False)
    c.spot(505, 428, 2.5, 30, "#ffffff", 0.8, blur=0.3)
    c.spot(536, 430, 2, 24, "#bfc8cf", 0.35, blur=0.3)
    # thìa / dĩa bên trái
    c.shape([(150, 470), (156, 466), (232, 520), (226, 526)], "#c9ced3", smooth=False, shade=0.4, hi=0.6, depth=2, ow=1)
    c.shape(ellipse_pts(150, 464, 12, 7, 16), "#d4d8dc", shade=0.5, hi=0.6, depth=3, ow=1)


def bubble(c):
    pts = [(48, 92), (62, 56), (110, 38), (170, 36), (226, 52), (250, 88), (236, 124), (214, 134), (262, 168),
           (190, 140), (130, 146), (74, 132)]
    c.shadow(pts, 0.18, blur=5, dx=4, dy=5)
    c.shape(pts, "#fffaf0", shade=0.12, hi=0, depth=8, ow=1.8)
    c.text((150, 92), "Yummy!", 46, face="hand", color=(150, 52, 40), angle=4)
    # nét "sung sướng" quanh đầu
    for x, y, r in ((420, 150, 10), (440, 196, 7), (410, 104, 6)):
        star = [(x, y - r), (x + r * 0.28, y - r * 0.28), (x + r, y), (x + r * 0.28, y + r * 0.28), (x, y + r),
                (x - r * 0.28, y + r * 0.28), (x - r, y), (x - r * 0.28, y - r * 0.28)]
        c.shape(star, "#e9b83c", smooth=False, shade=0.2, hi=0.4, depth=2, ow=0.9)


def scene(c):
    background(c)
    girl(c)
    table(c)
    placemat(c)
    arms(c)
    food(c)
    bubble(c)


if __name__ == "__main__":
    # python3 scene_yummy.py <ảnh ra .webp> [engraving|watercolor|gouache] [thư mục xem trước]
    out = sys.argv[1]
    style = sys.argv[2] if len(sys.argv) > 2 else "engraving"
    c = Canvas(style)
    scene(c)
    c.finish(out, preview_dir=sys.argv[3] if len(sys.argv) > 3 else None)
    print("ok", out)
