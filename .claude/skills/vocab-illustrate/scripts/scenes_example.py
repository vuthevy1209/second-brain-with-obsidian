"""Cảnh mẫu kiểu tranh khắc tô màu (dùng cho note TOEIC Part 7 / 2022 - Test 5). Copy hàm gần giống rồi sửa.

    python3 scenes_example.py <thư mục assets> [<thư mục xem trước>] [slug ...]

Mỗi hàm `scene_<slug>(c)` vẽ lên Canvas; ảnh ra là `<assets>/vocabulary-<slug>.webp`.
"""
import math, os, random, sys
from multiprocessing import Pool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paint import Canvas, catmull, darker, ellipse_pts, lighter, mix, rect_pts
from parts import (INK_RED, SKIN, arrow, bubble, check, clock, coin, coin_stack, cross, desk, office,
                   paper, person, plant, question_marks, room, sparkles, stamp, table_top, tree, window)

NAVY, CREAM, RED, GREEN, GOLD = "#3f4f6e", "#f3efe4", "#b8433a", "#5f8f4a", "#d8b25a"


# ---------------------------------------------------------------- đồ vật riêng của các cảnh
def wheel(c, x, y, r):
    c.shape(ellipse_pts(x, y, r, r, 28), "#2f2a28", shade=0.4, hi=0.3, depth=r * 0.3, ow=1.3)
    c.shape(ellipse_pts(x, y, r * 0.5, r * 0.5, 20), "#c9ced3", shade=0.4, hi=0.5, depth=r * 0.15, ow=1.0)


def bus(c, x0, by, w, color="#3f7f5a"):
    h = w * 0.42
    y0 = by - h
    c.shadow(rect_pts(x0, by - 6, x0 + w, by + 6), 0.35, blur=6, dx=6, dy=2, smooth=False)
    c.shape([(x0, y0 + 14), (x0 + 14, y0), (x0 + w - 10, y0), (x0 + w, y0 + 16), (x0 + w, by - 12), (x0, by - 12)],
            color, smooth=False, shade=0.45, hi=0.35, depth=12, ow=1.6)
    c.shape(rect_pts(x0, by - 40, x0 + w, by - 30), "#f1e6c8", smooth=False, shade=0.2, hi=0.2, depth=2, ow=1.0)
    n = 5
    for i in range(n):
        a = x0 + 18 + i * (w - 36) / n
        c.shape(rect_pts(a + 4, y0 + 16, a + (w - 36) / n - 4, y0 + h * 0.45), "#cfe3ea", smooth=False,
                grad="#9fbccc", shade=0.2, hi=0.3, depth=3, ow=1.1)
    c.text((x0 + w / 2, by - 55), "CITY BUS", 15, face="serif", color=CREAM)
    for wx in (x0 + w * 0.2, x0 + w * 0.8):
        wheel(c, wx, by - 8, h * 0.17)


def car(c, x0, by, w, color="#e2b23a", sign="TAXI"):
    h = w * 0.38
    c.shadow(rect_pts(x0, by - 6, x0 + w, by + 6), 0.35, blur=6, dx=6, dy=2, smooth=False)
    c.shape([(x0, by - 14), (x0 + 6, by - h * 0.55), (x0 + w * 0.26, by - h * 0.6), (x0 + w * 0.36, by - h),
             (x0 + w * 0.7, by - h), (x0 + w * 0.82, by - h * 0.6), (x0 + w - 4, by - h * 0.52), (x0 + w, by - 14)],
            color, smooth=False, shade=0.45, hi=0.4, depth=10, ow=1.6)
    for a, b in ((0.38, 0.52), (0.55, 0.69)):
        c.shape([(x0 + w * a, by - h * 0.62), (x0 + w * a + 4, by - h * 0.92), (x0 + w * b, by - h * 0.92),
                 (x0 + w * b + 6, by - h * 0.62)], "#cfe3ea", smooth=False, grad="#9fbccc", shade=0.2, hi=0.3,
                depth=3, ow=1.1)
    if sign:
        c.shape(rect_pts(x0 + w * 0.45, by - h - 16, x0 + w * 0.62, by - h), "#f6efdc", smooth=False, shade=0.2,
                depth=2, ow=1.1)
        c.text((x0 + w * 0.535, by - h - 8), sign, 10, face="serif")
    for wx in (x0 + w * 0.2, x0 + w * 0.8):
        wheel(c, wx, by - 8, h * 0.26)


def price_tag(c, x, y, text, good=True):
    c.shape([(x - 44, y - 22), (x + 34, y - 22), (x + 50, y), (x + 34, y + 22), (x - 44, y + 22)], "#f6efdc",
            smooth=False, shade=0.25, hi=0.1, depth=5, ow=1.3)
    c.spot(x + 32, y, 4, 4, "#8a6a4a", 0.9, blur=0.2)
    c.text((x - 6, y), text, 26, face="georgia", color=GREEN if good else RED)


def house(c, x0, by, w, wall="#e9dcc0", roof="#9a4a32"):
    h = w * 0.62
    c.shape(rect_pts(x0, by - h, x0 + w, by), wall, smooth=False, shade=0.4, hi=0.2, depth=16, ow=1.5)
    c.shape([(x0 - 20, by - h + 4), (x0 + w / 2, by - h - w * 0.42), (x0 + w + 20, by - h + 4)], roof, smooth=False,
            shade=0.5, hi=0.4, depth=16, ow=1.6)
    for k in range(1, 6):
        y = by - h - w * 0.42 * (1 - k / 6)
        half = (w / 2 + 20) * k / 6
        c.line([(x0 + w / 2 - half, y), (x0 + w / 2 + half, y)], color=darker(roof, 0.4), w=0.7, smooth=False)
    c.shape(rect_pts(x0 + w * 0.42, by - h * 0.55, x0 + w * 0.58, by), "#7d5534", smooth=False, shade=0.5, hi=0.3,
            depth=6, ow=1.3)
    c.spot(x0 + w * 0.55, by - h * 0.28, 2.6, 2.6, GOLD, 1, blur=0.2)
    for wx in (x0 + w * 0.12, x0 + w * 0.68):
        c.shape(rect_pts(wx, by - h * 0.78, wx + w * 0.2, by - h * 0.38), "#cfe3ea", smooth=False, grad="#9fbccc",
                shade=0.3, hi=0.3, depth=4, ow=1.2)
        c.line([(wx + w * 0.1, by - h * 0.78), (wx + w * 0.1, by - h * 0.38)], w=1.0, smooth=False)
        c.line([(wx, by - h * 0.58), (wx + w * 0.2, by - h * 0.58)], w=1.0, smooth=False)
    c.shape(rect_pts(x0 + w * 0.72, by - h - w * 0.36, x0 + w * 0.82, by - h - w * 0.12), "#9a6a4a", smooth=False,
            shade=0.4, hi=0.3, depth=3, ow=1.2)


def blackboard(c, x0, y0, x1, y1):
    c.shape(rect_pts(x0, y0, x1, y1), "#8a5a34", smooth=False, shade=0.4, hi=0.4, depth=6, ow=1.4)
    c.shape(rect_pts(x0 + 12, y0 + 12, x1 - 12, y1 - 12), "#3b4a3e", smooth=False, shade=0.2, hi=0.1, depth=10, ow=1.1)


def folder_stack(c, x, by, w, n, colors=("#c9a35a", "#d8c8a0", "#8fa3b8", "#c98a6a")):
    random.seed(int(x + n))
    y = by
    for i in range(n):
        h = random.uniform(9, 14)
        dx = random.uniform(-7, 7)
        col = colors[i % len(colors)]
        c.shape(rect_pts(x + dx, y - h, x + dx + w, y), col, smooth=False, shade=0.35, hi=0.3, depth=3, ow=1.1)
        y -= h
    return y


def phone(c, x, by):
    """Điện thoại bàn quay số kiểu cũ."""
    c.shape([(x - 34, by), (x - 26, by - 30), (x + 26, by - 30), (x + 34, by)], "#2f2a28", smooth=False, shade=0.4,
            hi=0.5, depth=6, ow=1.3)
    c.shape(ellipse_pts(x, by - 16, 13, 9, 20), "#f1e6c8", shade=0.2, hi=0.2, depth=2, ow=1.0)


# ---------------------------------------------------------------- các cảnh
def scene_short_on_time(c):
    office(c, 440)
    clock(c, 600, 200, 104, hour=11, minute=55)
    paper(c, 70, 110, 220, 230, color="#f6ecc8", lines=0)
    c.text((145, 145), "DEADLINE", 24, face="serif", color=RED)
    c.text((145, 190), "12:00", 34, face="hand", color=RED)
    c.spot(145, 116, 6, 6, RED, 1, blur=0.2)
    desk(c, 30, 400, 250, 572)
    top = folder_stack(c, 60, 400, 120, 9)
    paper(c, 150, 360, 230, 400, lines=2)
    p = person(c, 380, 565, 330, jacket=NAVY, shirt=CREAM, tie=RED, face="worried", pose=("head", "hold"), look=1)
    hx, hy = p["hand_r"]
    paper(c, hx - 8, hy - 50, hx + 46, hy + 12, lines=3)
    c.text((610, 340), "only 5 minutes left!", 24, face="hand", color=RED, angle=3)


def scene_turn_off_proceed_onto(c):
    c.shape(rect_pts(0, 0, 800, 600), "#d6dcae", smooth=False, shade=0, hi=0, outline=False)
    road = "#d9cdb4"
    c.shape(rect_pts(0, 300, 800, 368), road, smooth=False, shade=0.0, hi=0, ow=1.5)
    c.shape(rect_pts(468, 0, 536, 300), road, smooth=False, shade=0.0, hi=0, ow=1.5)
    for x in range(10, 800, 46):
        if not 460 < x < 545:
            c.line([(x, 334), (x + 22, 334)], color=CREAM, w=2.4, smooth=False, wobble=0, taper=False)
    for y in range(14, 290, 46):
        c.line([(502, y), (502, y + 22)], color=CREAM, w=2.4, smooth=False, wobble=0, taper=False)
    # các khối nhà nhìn từ trên xuống
    random.seed(4)
    for x0, y0 in ((40, 420), (210, 420), (600, 410), (650, 150), (590, 60), (330, 430), (140, 190), (300, 130)):
        w, h = random.uniform(70, 100), random.uniform(50, 70)
        c.shadow(rect_pts(x0, y0, x0 + w, y0 + h), 0.3, blur=3, dx=5, dy=5, smooth=False)
        c.shape(rect_pts(x0, y0, x0 + w, y0 + h), random.choice(["#b65a3c", "#9a4a32", "#a86a44"]), smooth=False,
                shade=0.45, hi=0.4, depth=10, ow=1.3)
        c.line([(x0, y0 + h / 2), (x0 + w, y0 + h / 2)], w=1.0, smooth=False)
    for x, y, r in ((120, 520, 24), (270, 540, 20), (420, 520, 26), (720, 520, 24), (400, 230, 22), (230, 60, 26),
                    (700, 280, 18), (380, 60, 22)):
        c.shadow(ellipse_pts(x, y, r, r, 16), 0.3, blur=3, dx=4, dy=4)
        c.shape(ellipse_pts(x, y, r, r * 0.95, 18), "#6f9a55", shade=0.55, hi=0.35, depth=r * 0.5, ow=1.1)
    # la bàn
    for a in range(0, 360, 90):
        r1, r2 = 34, 9
        p = [(70 + r1 * math.sin(math.radians(a)), 90 - r1 * math.cos(math.radians(a))),
             (70 + r2 * math.sin(math.radians(a + 45)), 90 - r2 * math.cos(math.radians(a + 45))), (70, 90),
             (70 + r2 * math.sin(math.radians(a - 45)), 90 - r2 * math.cos(math.radians(a - 45)))]
        c.shape(p, RED if a == 0 else "#efe4c8", smooth=False, shade=0.3, hi=0.2, depth=3, ow=1.1)
    c.text((70, 44), "N", 18, face="serif")
    # lộ trình
    arrow(c, [(40, 334), (300, 334), (440, 334), (490, 320), (502, 270), (502, 60)], color=RED, w=7, head=22)
    # xe hơi nhìn từ trên
    c.shadow(rect_pts(210, 316, 270, 352), 0.35, blur=3, dx=4, dy=4, smooth=False)
    c.shape(rect_pts(210, 318, 270, 350), "#3f6fa8", shade=0.4, hi=0.5, depth=6, ow=1.4)
    c.shape(rect_pts(246, 322, 258, 346), "#cfe3ea", smooth=False, shade=0.2, hi=0.3, depth=2, ow=1.0)
    c.text((110, 356), "River Street", 20, face="serif")
    c.text((562, 220), "Elmont Avenue", 22, face="serif", angle=90)
    for x, y, t in ((380, 270, "turn off of"), (650, 60, "proceed onto")):
        paper(c, x - 80, y - 22, x + 80, y + 22, lines=0, shade=0.15)
        c.text((x, y), t, 22, face="hand", color=RED)
    c.line([(420, 292), (470, 318)], color=RED, w=1.4)
    c.line([(570, 62), (520, 80)], color=RED, w=1.4)


def scene_most_economical_way(c):
    c.shape(rect_pts(0, 0, 800, 380), "#cfe0e6", smooth=False, grad="#efeadb", shade=0, hi=0, outline=False)
    random.seed(8)
    x = 0
    while x < 800:  # dãy nhà phố phía sau
        w = random.uniform(80, 130)
        h = random.uniform(140, 230)
        col = random.choice(["#d9c3a0", "#c9a888", "#bfb39a", "#d8b8a0"])
        c.shape(rect_pts(x, 380 - h, x + w, 380), col, smooth=False, shade=0.35, hi=0.2, depth=10, ow=1.2)
        for wy in range(int(380 - h + 20), 350, 42):
            for wx in (x + 16, x + w - 36):
                c.shape(rect_pts(wx, wy, wx + 20, wy + 26), "#9fbccc", smooth=False, shade=0.3, hi=0.2, depth=3,
                        ow=0.9)
        x += w
    c.shape(rect_pts(0, 380, 800, 420), "#d8d0c0", smooth=False, shade=0, hi=0, ow=1.2)  # vỉa hè
    c.shape(rect_pts(0, 420, 800, 600), "#a9a196", smooth=False, grad="#8f887e", shade=0, hi=0, ow=1.2)
    for x in range(20, 800, 80):
        c.line([(x, 520), (x + 40, 520)], color=CREAM, w=3, smooth=False, wobble=0, taper=False)
    bus(c, 40, 500, 330)
    car(c, 500, 500, 250)
    price_tag(c, 205, 150, "$2", True)
    check(c, 280, 150, 30)
    price_tag(c, 625, 290, "$15", False)
    cross(c, 700, 290, 26)
    person(c, 430, 410, 170, shirt="#c9874a", face="smile", pose=("point", "down"), hair="black", look=-1)


def scene_get_the_most_out_of(c):
    room(c, floor_y=420, flowers=False)
    window(c, 600, 60, 760, 280, curtains="#7d8f5a")
    p = person(c, 330, 720, 520, shirt="#e8d8b0", jacket=None, face="happy", pose=((-5.6, 13), (-5.6, 13)),
               hair_style="bun", hair="brown", legs=False)
    table_top(c, 450, 560)
    # ly hứng nước cam
    c.shadow([(300, 530), (370, 530), (380, 540), (300, 545)], 0.3, blur=4, dx=8, dy=0)
    c.shape([(294, 440), (366, 440), (358, 540), (302, 540)], "#f6f4ef", smooth=False, shade=0.35, hi=0.5, depth=10,
            ow=1.3)
    c.shape([(298, 488), (362, 488), (358, 538), (302, 538)], "#f0a23a", smooth=False, grad="#e08a2a", shade=0.4,
            hi=0.3, depth=10, outline=False)
    c.stroke(ellipse_pts(330, 440, 36, 7, 32), w=1.0, closed=True, taper=False)
    paper(c, 296, 505, 364, 528, lines=0, shade=0.1)
    c.text((330, 516), "RESULTS", 13, face="serif")
    # quả cam đang được vắt bằng 2 tay
    (lx, ly), (rx, ry) = p["hand_l"], p["hand_r"]
    oy = (ly + ry) / 2 + 2
    c.shape(ellipse_pts(330, oy, 46, 40, 32), "#f09a2e", shade=0.55, hi=0.45, depth=16, ow=1.5)
    for k in range(18):
        a = random.uniform(0, 6.28)
        r = random.uniform(5, 36)
        c.spot(330 + math.cos(a) * r, oy + math.sin(a) * r * 0.85, 1.6, 1.6, "#c9741e", 0.6, blur=0.3)
    for sx in (-1, 1):
        for k in range(3):
            c.shape(ellipse_pts(330 + sx * (40 - k * 3), oy - 14 + k * 12, 9, 6, 14), SKIN[0], shade=0.4, hi=0.3,
                    depth=3, ow=1.1)
    paper(c, 296, oy - 12, 364, oy + 12, lines=0, shade=0.1)
    c.text((330, oy), "BUDGET", 13, face="serif")
    for k, y in enumerate((oy + 52, oy + 70, oy + 86)):
        c.shape([(330, y - 8), (335, y + 2), (330, y + 6), (325, y + 2)], "#f0a23a", shade=0.3, hi=0.4, depth=2,
                ow=0.9)
    sparkles(c, [(450, 200, 10), (210, 210, 8)])


def scene_prospective(c):
    c.shape(rect_pts(0, 0, 800, 440), "#cfe0e6", smooth=False, grad="#efeadb", shade=0, hi=0, outline=False)
    c.shape([(0, 380), (300, 360), (800, 376), (800, 600), (0, 600)], "#a9c08a", shade=0.2, hi=0, outline=False)
    house(c, 470, 420, 260)
    tree(c, 90, 430, 200)
    c.shape(rect_pts(0, 420, 800, 600), "#b9c79a", smooth=False, grad="#9db07c", shade=0, hi=0, ow=1.0)
    c.shape([(540, 420), (600, 420), (660, 600), (520, 600)], "#d8c8a8", smooth=False, shade=0.1, hi=0, ow=1.2)
    # biển "FOR SALE"
    c.shape(rect_pts(726, 380, 734, 520), "#7d5534", smooth=False, shade=0.4, hi=0.3, depth=3, ow=1.1)
    c.shape(rect_pts(668, 380, 792, 440), "#f6efdc", smooth=False, shade=0.25, hi=0.1, depth=5, ow=1.4)
    c.text((730, 410), "FOR SALE", 20, face="serif", color=RED)
    person(c, 260, 560, 300, jacket=NAVY, shirt=CREAM, tie=RED, face="smile", pose=("down", (25, 14)), look=1)
    person(c, 470, 565, 290, shirt="#c98a6a", skirt="#6d7fa8", hair_style="bob", hair="black", face="happy",
           pose=((25, 14), "down"), look=-1)


def scene_backed_up_with_a_big_job(c):
    office(c, 440)
    person(c, 420, 600, 330, jacket="#6d5a48", shirt=CREAM, tie=NAVY, face="worried", pose=("up", "head"),
           legs=False)
    desk(c, 110, 410, 690, 580)
    folder_stack(c, 130, 410, 130, 17)
    folder_stack(c, 270, 410, 90, 7)
    top = folder_stack(c, 530, 410, 130, 12)
    # hộp hồ sơ dự án trên đỉnh chồng bên phải
    c.shape(rect_pts(526, top - 62, 666, top), "#8fa3b8", smooth=False, shade=0.45, hi=0.3, depth=8, ow=1.4)
    c.shape(rect_pts(542, top - 50, 650, top - 12), CREAM, smooth=False, shade=0.2, hi=0.1, depth=3, ow=1.1)
    c.text((596, top - 38), "NOBLE", 15, face="serif")
    c.text((596, top - 22), "ARCHITECTS", 11, face="serif")
    for x in (372, 392):  # cuộn bản vẽ
        c.shape(limb_like(x, 316, x + 6, 404, 8), "#e8e0c8", shade=0.4, hi=0.3, depth=4, ow=1.1)
        c.shape(ellipse_pts(x, 316, 8, 8, 14), "#cfc6ac", shade=0.3, hi=0.2, depth=2, ow=1.0)
    phone(c, 640, 410)
    c.text((640, 150), "a big job!", 30, face="hand", color=RED, angle=-4)


def limb_like(x0, y0, x1, y1, r):
    from parts import limb_pts
    return limb_pts((x0, y0), (x1, y1), r, r)


def scene_first_thing_tomorrow(c):
    room(c, floor_y=440)
    window(c, 470, 70, 720, 300, sky=("#f3c9a0", "#f8e8c8"), sun=(560, 240, 30), tree=False)
    # bàn nhỏ: đồng hồ báo thức + lịch
    c.shape(rect_pts(470, 420, 740, 436), "#8f5b34", smooth=False, shade=0.3, hi=0.4, depth=4, ow=1.3)
    for x in (486, 720):
        c.shape(rect_pts(x, 436, x + 10, 580), "#7a4c2a", smooth=False, shade=0.4, hi=0.3, depth=3, ow=1.1)
    clock(c, 540, 372, 40, hour=8, minute=0, rim=RED, roman=False, legs=True, bells=True)
    paper(c, 610, 330, 720, 420, color="#fbf6e8", lines=0)
    c.shape(rect_pts(610, 330, 720, 352), RED, smooth=False, shade=0.2, hi=0.2, depth=3, ow=1.1)
    c.text((665, 341), "TOMORROW", 12, face="serif", color=CREAM)
    c.text((665, 388), "8:00", 30, face="hand")
    p = person(c, 230, 568, 330, shirt="#8a9cb5", face="smile", pose=("down", (-0.6, -12.4)), hair="black", look=1)
    hx, hy, r = p["head"]
    u = r / 8
    from parts import limb_pts
    c.shape(limb_pts((hx + 9 * u, hy - 1 * u), (hx + 5 * u, hy + 9 * u), 1.4 * u, 1.4 * u), "#2f2a28", shade=0.3,
            hi=0.5, depth=2, ow=1.2)
    for ex, ey in ((hx + 9.4 * u, hy - 1.4 * u), (hx + 5 * u, hy + 9.6 * u)):
        c.shape(ellipse_pts(ex, ey, 2.6 * u, 2 * u, 16), "#2f2a28", shade=0.3, hi=0.5, depth=1, ow=1.2)
    gx, gy = p["hand_r"]
    c.shape(ellipse_pts(gx, gy + 0.6 * u, 2.8 * u, 3.2 * u, 20), SKIN[0], shade=0.45, hi=0.3, depth=1.4 * u, ow=1.2)
    bubble(c, 200, 160, 150, 60, None, (240, 230), size=24)
    c.text((200, 142), "How about first thing", 22, face="hand", color=INK_RED)
    c.text((200, 176), "tomorrow?", 26, face="hand", color=INK_RED)


def scene_reportedly(c):
    office(c, 440, wall="#e4dcc4")
    p = person(c, 300, 565, 330, shirt=CREAM, jacket="#6d5a48", face="surprised", pose=((-2, 14), (-2, 14)),
               glasses=True, hair="grey", hair_style="bald")
    (lx, ly), (rx, ry) = p["hand_l"], p["hand_r"]
    x0, x1 = lx - 70, rx + 70
    y0, y1 = ly - 40, ly + 120
    c.shadow(rect_pts(x0, y0, x1, y1), 0.3, blur=5, dx=6, dy=6, smooth=False)
    c.shape(rect_pts(x0, y0, x1, y1), "#f1ead6", smooth=False, shade=0.25, hi=0.1, depth=10, ow=1.4)
    c.line([((x0 + x1) / 2, y0), ((x0 + x1) / 2, y1)], color=mix(c.ink, c.paper, 0.4), w=0.8, smooth=False)
    c.text(((x0 + x1) / 2, y0 + 18), "THE DAILY NEWS", 18, face="serif")
    c.line([(x0 + 10, y0 + 32), (x1 - 10, y0 + 32)], w=1.0, smooth=False, taper=False)
    c.text(((x0 + x1) / 2, y0 + 50), "Company reportedly", 15, face="georgia", color=RED)
    c.text(((x0 + x1) / 2, y0 + 68), "planning new product", 15, face="georgia", color=RED)
    paper(c, x0 + 12, y0 + 82, (x0 + x1) / 2 - 8, y1 - 8, color="#e8dfc8", lines=0, shade=0)
    c.shape(rect_pts(x0 + 22, y0 + 90, (x0 + x1) / 2 - 18, y1 - 16), "#b5c3cf", smooth=False, shade=0.4, hi=0.2,
            depth=6, ow=1.0)
    c.text(((x0 + x0 + (x1 - x0) / 2) / 2, (y0 + y1) / 2 + 40), "?", 22, face="georgia")
    paper(c, (x0 + x1) / 2 + 6, y0 + 82, x1 - 12, y1 - 8, color="#f1ead6", lines=4, shade=0)
    for hx, hy in ((lx, ly), (rx, ry)):
        c.shape(ellipse_pts(hx, hy, 9, 11, 16), SKIN[0], shade=0.4, hi=0.3, depth=3, ow=1.2)
    person(c, 620, 565, 300, shirt="#c98a6a", skirt="#7d8f5a", hair_style="bob", hair="red", face="smile",
           pose=("chin", "down"), look=-1)
    bubble(c, 650, 160, 90, 48, "I heard...", (630, 250), size=26)


def scene_that_said(c):
    c.shape(rect_pts(0, 0, 800, 600), "#ece2c8", smooth=False, shade=0, hi=0, outline=False)
    table_top(c, 470, 560, wood="#9c6a40")
    # cân đĩa bằng đồng
    brass = "#c9a24a"
    c.shape([(330, 480), (470, 480), (450, 456), (350, 456)], brass, smooth=False, shade=0.5, hi=0.5, depth=8, ow=1.4)
    c.shape(rect_pts(392, 170, 408, 460), brass, smooth=False, shade=0.5, hi=0.5, depth=5, ow=1.3)
    c.shape(ellipse_pts(400, 164, 14, 14, 18), brass, shade=0.5, hi=0.5, depth=4, ow=1.2)
    tilt = 16
    lx, ly, rx, ry = 190, 176 - tilt, 610, 176 + tilt
    c.shape([(lx, ly - 5), (rx, ry - 5), (rx, ry + 5), (lx, ly + 5)], brass, smooth=False, shade=0.5, hi=0.5, depth=3,
            ow=1.3)
    for px, py, drop in ((lx, ly, 150), (rx, ry, 150)):
        by = py + drop
        for dx in (-54, 54):
            c.line([(px, py), (px + dx, by)], color="#6d5a3a", w=1.2, smooth=False)
        c.shape(ellipse_pts(px, by, 70, 16, 32, 0, 180) + [(px - 70, by)], brass, smooth=False, shade=0.5, hi=0.5,
                depth=8, ow=1.4)
        c.shape(ellipse_pts(px, by, 70, 10, 32), lighter(brass, 0.2), shade=0.3, hi=0.4, depth=4, ow=1.2)
    # đĩa trái: ý thứ nhất (+), đĩa phải: "nhưng" (-)
    paper(c, lx - 40, ly + 82, lx + 40, ly + 146, color="#e6efd6", lines=0, shade=0.15)
    c.text((lx, ly + 104), "+", 34, face="georgia", color=GREEN)
    c.text((lx, ly + 132), "first point", 14, face="hand")
    paper(c, rx - 44, ry + 82, rx + 44, ry + 146, color="#f3dcd2", lines=0, shade=0.15)
    c.text((rx, ry + 104), "but...", 24, face="hand", color=RED)
    c.text((rx, ry + 132), "other hand", 14, face="hand")


def scene_sound_financial_strategy(c):
    office(c, 450, wall="#e2e4cc")
    # móng đá vững chắc
    for i, x in enumerate(range(170, 560, 78)):
        c.shape(rect_pts(x, 430, x + 76, 466), "#b5ab98", smooth=False, shade=0.45, hi=0.4, depth=6, ow=1.3)
    for x in range(208, 560, 78):
        c.shape(rect_pts(x, 466, x + 76, 502), "#a89e8a", smooth=False, shade=0.45, hi=0.4, depth=6, ow=1.3)
    c.text((370, 486), "SOLID FOUNDATION", 13, face="serif", color=CREAM)
    # giá vẽ + bảng biểu đồ
    for a, b in (((250, 430), (300, 160)), ((490, 430), (440, 160))):
        c.line([a, b], color="#7a4c2a", w=6, smooth=False, taper=False)
    c.shape(rect_pts(220, 110, 520, 360), "#f6efdc", smooth=False, shade=0.3, hi=0.1, depth=8, ow=1.6)
    c.text((370, 134), "FINANCIAL PLAN", 16, face="serif")
    for i, hgt in enumerate((50, 80, 110, 150, 190)):
        x = 250 + i * 52
        c.shape(rect_pts(x, 340 - hgt, x + 34, 340), ["#9fbf86", "#8fb478", "#7fa86a", "#6f9a55", "#5f8f4a"][i],
                smooth=False, shade=0.45, hi=0.3, depth=6, ow=1.2)
    arrow(c, [(250, 280), (340, 240), (420, 200), (490, 150)], color=RED, w=5, head=18)
    c.line([(236, 340), (506, 340)], w=1.4, smooth=False, taper=False)
    person(c, 640, 560, 320, jacket=NAVY, shirt=CREAM, tie=GOLD, face="smile", pose=("point", "hip"), look=-1)
    coin_stack(c, 120, 520, 6, 22)
    coin_stack(c, 170, 530, 4, 22)
    coin(c, 90, 470, 16)
    check(c, 600, 160, 40)


def scene_unparalleled(c):
    c.shape(rect_pts(0, 0, 800, 600), "#3d2f2e", smooth=False, grad="#5a4038", shade=0, hi=0, outline=False)
    c.glow(400, 260, 280, "#fff1c8", 0.45)
    # rèm sân khấu
    for x in range(0, 800, 60):
        c.shape([(x, 0), (x + 60, 0), (x + 56, 60), (x + 30, 76), (x + 4, 60)], "#9c2f2a", shade=0.5, hi=0.3, depth=12,
                ow=1.2)
    for side in (-1, 1):
        x = 0 if side < 0 else 800
        c.shape([(x, 0), (x - side * 140, 0), (x - side * 90, 300), (x - side * 120, 600), (x, 600)], "#9c2f2a",
                shade=0.5, hi=0.3, depth=26, ow=1.4)
    c.shape(rect_pts(0, 500, 800, 600), "#7a4c2a", smooth=False, grad="#5c3820", shade=0, hi=0, ow=1.2)
    stone = "#e8dcc0"
    for x0, x1, top, num in ((210, 340, 400, "2"), (340, 460, 300, "1"), (460, 590, 430, "3")):
        c.shape(rect_pts(x0, top, x1, 510), stone, smooth=False, shade=0.45, hi=0.3, depth=12, ow=1.5)
        c.text(((x0 + x1) / 2, top + 50), num, 44, face="serif", color=RED if num == "1" else c.ink)
    # cúp vàng + vòng nguyệt quế
    gold = "#e0b63c"
    c.shape([(370, 296), (430, 296), (420, 284), (380, 284)], gold, smooth=False, shade=0.5, hi=0.5, depth=4, ow=1.3)
    c.shape(rect_pts(394, 250, 406, 286), gold, smooth=False, shade=0.5, hi=0.5, depth=3, ow=1.2)
    c.shape([(360, 172), (440, 172), (434, 214), (414, 246), (386, 246), (366, 214)], gold, shade=0.55, hi=0.6,
            depth=14, ow=1.5)
    for sx in (-1, 1):
        c.stroke(ellipse_pts(400 + sx * 46, 200, 16, 20, 20, 90 - sx * 90 - 90, 90 - sx * 90 + 90), w=3.6, taper=False)
    for sx in (-1, 1):
        for k in range(6):
            a = math.radians(200 - k * 22) if sx < 0 else math.radians(-20 + k * 22)
            x, y = 400 + math.cos(a) * 80 * -1, 214 + math.sin(a) * 60
            x = 400 + sx * abs(math.cos(a)) * 82
            c.shape(ellipse_pts(x, 160 + k * 22, 12, 6, 14, rot=sx * 40), "#5f8f4a", shade=0.4, hi=0.4, depth=3, ow=1.0)
    sparkles(c, [(300, 200, 14), (500, 190, 12), (330, 140, 8), (480, 250, 9), (260, 300, 7), (540, 320, 8)])


def scene_knowing_nothing(c):
    office(c, 440, wall="#e6dcc0")
    blackboard(c, 470, 70, 760, 300)
    c.text((615, 185), "? ? ?", 52, face="hand", color="#eee8d8")
    person(c, 300, 565, 330, shirt="#8a9cb5", pants="#5a5048", face="confused", pose=("shrug", "shrug"), hair="blond")
    bubble(c, 150, 170, 76, 50, "", (240, 230), thought=True)
    question_marks(c, [(140, 172, 40, 8), (470, 360, 46, -10), (130, 330, 34, 12), (500, 450, 30, 6)])
    # sách đóng dưới sàn
    c.shape([(560, 520), (680, 506), (700, 528), (580, 546)], "#8a3a2e", shade=0.4, hi=0.4, depth=6, ow=1.3)
    c.shape([(580, 546), (700, 528), (700, 538), (580, 556)], "#f1e6c8", smooth=False, shade=0.2, hi=0.1, depth=2,
            ow=1.1)
    paper(c, 600, 380, 740, 420, lines=0, shade=0.1)
    c.text((670, 400), "No idea...", 22, face="hand", color=INK_RED)


def calendar(c, x0, y0, x1, y1, title, checks_col=0, rows=5, mark=None):
    c.shadow(rect_pts(x0, y0, x1, y1), 0.3, blur=5, dx=6, dy=6, smooth=False)
    c.shape(rect_pts(x0, y0, x1, y1), "#fbf6e8", smooth=False, shade=0.25, hi=0.1, depth=8, ow=1.5)
    c.shape(rect_pts(x0, y0, x1, y0 + 40), RED, smooth=False, shade=0.3, hi=0.3, depth=4, ow=1.3)
    c.text(((x0 + x1) / 2, y0 + 20), title, 18, face="serif", color=CREAM)
    for x in (x0 + 60, x1 - 60):
        c.spot(x, y0 + 4, 5, 5, "#555", 1, blur=0.2)
    days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    cw = (x1 - x0) / 7
    rh = (y1 - y0 - 66) / rows
    for i, d in enumerate(days):
        c.text((x0 + cw * (i + 0.5), y0 + 54), d, 11, face="serif", color=RED if i == checks_col else c.ink)
    for r in range(rows + 1):
        c.line([(x0, y0 + 66 + r * rh), (x1, y0 + 66 + r * rh)], color=mix(c.ink, c.paper, 0.4), w=0.7, smooth=False,
               taper=False, wobble=0)
    for i in range(1, 7):
        c.line([(x0 + cw * i, y0 + 66), (x0 + cw * i, y1)], color=mix(c.ink, c.paper, 0.4), w=0.7, smooth=False,
               taper=False, wobble=0)
    n = 1
    for r in range(rows):
        for i in range(7):
            c.text((x0 + cw * i + 10, y0 + 66 + r * rh + 10), str(n), 9, face="serif")
            if checks_col is not None and i == checks_col:
                check(c, x0 + cw * (i + 0.55), y0 + 66 + (r + 0.6) * rh, min(cw, rh) * 0.5)
            n = n + 1 if n < 31 else 1
    return cw, rh


def scene_on_a_regular_basis(c):
    room(c, floor_y=450, flowers=False)
    calendar(c, 80, 90, 380, 400, "EVERY MONDAY", checks_col=0)
    # người tưới cây mỗi tuần
    p = person(c, 560, 575, 300, shirt="#7d8f5a", pants="#5a5048", face="smile", pose=("hold", "forward"),
               hair="brown", look=1)
    hx, hy = p["hand_r"]
    can = "#8fa3b8"
    c.shape([(hx - 10, hy + 4), (hx + 40, hy + 4), (hx + 36, hy + 50), (hx - 6, hy + 50)], can, smooth=False,
            shade=0.5, hi=0.5, depth=8, ow=1.3)
    c.shape([(hx + 36, hy + 20), (hx + 76, hy + 2), (hx + 80, hy + 8), (hx + 38, hy + 32)], can, smooth=False,
            shade=0.4, hi=0.5, depth=3, ow=1.2)
    px = hx + 96  # chậu cây ngay dưới vòi bình tưới
    plant(c, px, 575, 120)
    for k in range(4):  # dòng nước rơi xuống cây
        sx, sy = hx + 80 + k * 3, hy + 8 + k * 2
        c.line([(sx, sy), (sx + 12, sy + 30), (px - 6 + k * 5, 478)], color="#5f9cc4", w=1.6, wobble=0.2)
    for x, y, t in ((430, 470, "repeat"),):
        c.text((x, y), t, 22, face="hand", color=INK_RED)
    arrow(c, [(390, 520), (440, 540), (490, 520), (500, 490)], color=INK_RED, w=3, head=12)


def pencil(c, x0, y0, x1, y1):
    from parts import limb_pts
    L = math.hypot(x1 - x0, y1 - y0)
    dx, dy = (x1 - x0) / L, (y1 - y0) / L
    tip0 = (x1 - dx * 26, y1 - dy * 26)
    c.shape(limb_pts((x0, y0), tip0, 7, 7), "#e0b63c", shade=0.45, hi=0.5, depth=3, ow=1.3)
    c.shape([(tip0[0] - dy * 7, tip0[1] + dx * 7), (x1, y1), (tip0[0] + dy * 7, tip0[1] - dx * 7)], "#e8c8a0",
            smooth=False, shade=0.4, hi=0.3, depth=2, ow=1.2)
    c.shape(limb_pts((x0 - dx * 12, y0 - dy * 12), (x0, y0), 7, 7), "#e08a8a", shade=0.4, hi=0.3, depth=2, ow=1.2)


def scene_tentative(c):
    c.shape(rect_pts(0, 0, 800, 600), "#a8703f", smooth=False, grad="#8a5a34", shade=0, hi=0, outline=False)
    for k in range(28):
        y = 20 + k * 21
        c.line([(0, y), (800, y + 4)], color=darker("#a8703f", 0.3), w=0.6, wobble=0.15)
    paper(c, 180, 100, 560, 540, color="#fbf6e8", lines=0, ruled=True, start=150)
    c.text((370, 135), "MEETING DATE", 22, face="serif")
    c.text((370, 230), "Friday?", 56, face="hand", color=(110, 104, 98))
    c.line([(250, 270), (500, 266)], color=(130, 124, 118), w=1.4, wobble=0.6)
    c.text((370, 320), "not confirmed yet", 24, face="hand", color=(120, 110, 100))
    c.text((370, 380), "(may change)", 22, face="hand", color=(120, 110, 100))
    stamp(c, 370, 470, "TENTATIVE", size=26)
    pencil(c, 640, 380, 520, 250)
    c.shape([(600, 470), (680, 450), (696, 490), (616, 510)], "#e8a0a0", shade=0.4, hi=0.4, depth=6, ow=1.3)  # tẩy
    c.shape([(600, 470), (630, 462), (646, 502), (616, 510)], "#8fa3b8", smooth=False, shade=0.4, hi=0.3, depth=4,
            ow=1.1)


def scene_tentative_itinerary(c):
    c.shape(rect_pts(0, 0, 800, 600), "#a8703f", smooth=False, grad="#8a5a34", shade=0, hi=0, outline=False)
    for k in range(28):
        y = 20 + k * 21
        c.line([(0, y), (800, y + 4)], color=darker("#a8703f", 0.3), w=0.6, wobble=0.15)
    # bản đồ gấp phía sau
    c.shape([(470, 120), (760, 100), (770, 330), (480, 350)], "#e9dcb4", smooth=False, shade=0.35, hi=0.1, depth=8,
            ow=1.3)
    for x in (566, 662):
        c.line([(x, 112), (x + 6, 340)], color=darker("#e9dcb4", 0.4), w=1.0, smooth=False)
    c.line([(500, 300), (560, 240), (640, 260), (720, 160)], color=RED, w=2.2, wobble=0.5)
    for x, y in ((500, 300), (640, 260), (720, 160)):
        c.spot(x, y, 5, 5, RED, 1, blur=0.2)
    paper(c, 120, 100, 450, 550, color="#fbf6e8", lines=0)
    c.text((285, 136), "ITINERARY", 26, face="serif")
    c.text((285, 166), "(draft)", 20, face="hand", color=(120, 110, 100))
    for i, t in enumerate(("Arrive - Hotel", "City tour", "Meetings?", "Fly home")):
        y = 222 + i * 62
        c.text((150, y), f"Day {i + 1}", 22, face="serif", anchor="lm", color=RED)
        c.text((250, y), t, 24, face="hand", anchor="lm", color=(110, 104, 98))
        c.line([(150, y + 22), (420, y + 22)], color=mix(c.ink, c.paper, 0.5), w=0.6, smooth=False, wobble=0)
    stamp(c, 300, 500, "TENTATIVE", size=22, angle=-10)
    pencil(c, 560, 520, 440, 400)
    # va li
    c.shape(rect_pts(560, 380, 740, 560), "#8a3a2e", smooth=False, shade=0.5, hi=0.4, depth=16, ow=1.5)
    c.shape(rect_pts(620, 350, 680, 384), "#5a2e24", smooth=False, shade=0.3, hi=0.3, depth=3, ow=1.3)
    c.shape(rect_pts(628, 358, 672, 380), "#a8703f", smooth=False, shade=0, hi=0, outline=False)
    for x in (600, 700):
        c.shape(rect_pts(x - 6, 380, x + 6, 560), "#c9a35a", smooth=False, shade=0.4, hi=0.4, depth=3, ow=1.1)
    c.text((650, 470), "may change", 20, face="hand", color=CREAM, angle=-6)


SCENES = {name[6:].replace("_", "-"): fn for name, fn in globals().items() if name.startswith("scene_")}


def render(args):
    slug, assets, preview = args
    try:
        c = Canvas("engraving", seed=sum(map(ord, slug)) % 1000)
        SCENES[slug](c)
        c.finish(os.path.join(assets, f"vocabulary-{slug}.webp"), preview_dir=preview)
        return "ok " + slug
    except Exception as e:  # một cảnh lỗi không làm hỏng các cảnh khác
        import traceback
        return f"LỖI {slug}: {e}\n{traceback.format_exc()}"


if __name__ == "__main__":
    assets = sys.argv[1]
    preview = sys.argv[2] if len(sys.argv) > 2 else None
    slugs = sys.argv[3:] or list(SCENES)
    with Pool() as pool:
        for s in pool.imap_unordered(render, [(s, assets, preview) for s in slugs]):
            print(s)
