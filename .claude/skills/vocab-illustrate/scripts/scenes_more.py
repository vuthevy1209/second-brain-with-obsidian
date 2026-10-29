"""Thêm ~60 cảnh mẫu kiểu tranh khắc (note TOEIC Part 7 / 2022 - Test 1..4). Copy hàm gần giống rồi sửa.

    python3 scenes_more.py <thư mục ra> <thư mục xem trước> [slug ...]

Mỗi hàm `s_<slug>(c)` vẽ ra `vocabulary-<slug>.webp`. Gồm cả cảnh người ngồi sau bàn (đặt chân người ở
`mặt bàn + h/2` để vai cao hơn mặt bàn), sân khấu, ngoài trời, cảnh chia đôi so sánh, đồng hồ đo...
"""
import math, os, random, sys
from multiprocessing import Pool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paint import Canvas, catmull, darker, ellipse_pts, lighter, mix, rect_pts
from parts import *
from parts import limb_pts
from scenes_example import NAVY, CREAM, RED, GREEN, GOLD, folder_stack, house, phone, pencil, calendar, blackboard

SKY = ("#cfe0e6", "#f3efe2")


def head_top(p):
    hx, hy, r = p["head"]
    return hx, hy - r * 1.3, r / 8


def outdoor(c, ground="#b9c79a", horizon=420):
    c.shape(rect_pts(0, 0, 800, horizon), SKY[0], smooth=False, grad=SKY[1], shade=0, hi=0, outline=False)
    c.shape([(0, horizon - 40), (260, horizon - 70), (520, horizon - 50), (800, horizon - 80), (800, horizon),
             (0, horizon)], "#a9c08a", shade=0.2, hi=0, outline=False)
    c.shape(rect_pts(0, horizon, 800, 600), ground, smooth=False, grad=darker(ground, 0.12), shade=0, hi=0, ow=1.0)


def name_tag(c, x, y, s=1.0):
    c.shape(rect_pts(x - 14 * s, y - 9 * s, x + 14 * s, y + 9 * s), "#fbf6e8", smooth=False, shade=0.1, hi=0, ow=1.0)
    c.shape(rect_pts(x - 14 * s, y - 9 * s, x + 14 * s, y - 3 * s), RED, smooth=False, shade=0, hi=0, ow=0.8)


# ================================================================ Test 1
def s_detailoriented(c):
    office(c, 440)
    desk(c, 140, 400, 660, 580)
    p = person(c, 330, 570, 340, jacket=NAVY, shirt=CREAM, tie=RED, face="think", pose=("hold", (12, 4)), glasses=True,
               legs=False, look=1)
    paper(c, 400, 330, 560, 404, lines=4, shade=0.15)
    hx, hy = p["hand_r"]
    magnifier(c, 470, 350, 36, angle=200)
    for y in (346, 362, 378):
        check(c, 548, y, 10)
    paper(c, 170, 360, 290, 404, lines=3, shade=0.15)


def s_slated(c):
    office(c, 440)
    calendar(c, 120, 80, 460, 400, "MAY", checks_col=None)
    # khoanh tròn ngày sự kiện
    c.stroke(ellipse_pts(334, 246, 30, 22, 36), color=RED, w=2.6, closed=True, taper=False, wobble=0.6)
    c.text((334, 296), "Grand opening", 18, face="hand", color=RED)
    p = person(c, 600, 565, 320, shirt=CREAM, jacket="#6d5a48", tie=NAVY, face="smile", pose=("point", "hold"), look=-1)
    hx, hy = p["hand_r"]
    c.shape(rect_pts(hx - 6, hy - 50, hx + 46, hy + 14), "#c9a35a", smooth=False, shade=0.3, hi=0.3, depth=4, ow=1.2)
    paper(c, hx - 2, hy - 44, hx + 40, hy + 8, lines=3, shade=0.1)


def s_disturbance(c):
    room(c, floor_y=440)
    window(c, 520, 70, 740, 290, sky=("#2f3a5a", "#5a6a8a"), tree=False)
    c.spot(690, 120, 16, 16, "#f6efcf", 1, blur=0.2)
    p = person(c, 280, 565, 330, shirt="#8a9cb5", face="worried", pose=((-4, -15), (-4, -15)), hair="brown")
    # tiếng ồn từ tường bên trái
    for k, (x, y) in enumerate(((60, 160), (90, 220), (60, 280))):
        for r in (14, 26, 38):
            c.stroke(ellipse_pts(x, y, r, r, 16, -50, 50), color=RED, w=2.2, taper=False)
    c.text((110, 120), "BANG!", 34, face="georgia", color=RED, angle=10)
    c.text((140, 340), "DRRR!", 28, face="georgia", color=RED, angle=-8)
    clock(c, 430, 160, 44, hour=2, minute=0, roman=False)


def s_discipline(c):
    room(c, floor_y=440, flowers=False)
    clock(c, 620, 140, 60, hour=6, minute=0)
    paper(c, 80, 90, 280, 300, title="SCHEDULE", title_size=18, lines=0)
    for i, t in enumerate(("6:00  run", "7:00  study", "12:00 lunch", "13:00 study", "22:00 sleep")):
        c.text((100, 160 + i * 28), t, 18, face="hand", anchor="lm")
        check(c, 256, 160 + i * 28, 10)
    desk(c, 360, 420, 760, 580)
    book_stack(c, 640, 420, 4, 100)
    p = person(c, 500, 590, 340, shirt="#e8d8b0", face="neutral", pose=("hold", "hold"), legs=False, hair="black")
    book(c, 440, 380, 120, 40, open_=True)


def s_sophisticated(c):
    c.shape(rect_pts(0, 0, 800, 600), "#ece2c8", smooth=False, shade=0, hi=0, outline=False)
    table_top(c, 480, 560, wood="#8f5b34")
    # bộ máy đồng hồ nhiều bánh răng
    c.shape(rect_pts(170, 90, 630, 490), "#6d4a2e", smooth=False, shade=0.4, hi=0.3, depth=12, ow=1.6)
    c.shape(rect_pts(190, 110, 610, 470), "#efe6cf", smooth=False, shade=0.3, hi=0.1, depth=14, ow=1.2)
    for x, y, r, t, col, rot in ((320, 240, 80, 16, "#c9a24a", 0), (440, 330, 58, 12, "#b8873b", 12),
                                 (250, 380, 46, 10, "#d8b25a", 5), (500, 200, 44, 10, "#c9a24a", 8),
                                 (540, 400, 36, 9, "#b8873b", 3), (390, 420, 28, 8, "#d8b25a", 0),
                                 (230, 170, 30, 8, "#b8873b", 10)):
        gear(c, x, y, r, t, col, rot)
    c.shape(rect_pts(570, 140, 580, 300), "#9a948c", smooth=False, shade=0.4, hi=0.5, depth=3, ow=1.0)
    c.shape(ellipse_pts(575, 310, 16, 16, 20), "#c9a24a", shade=0.5, hi=0.5, depth=4, ow=1.2)
    for x in (210, 590):
        for y in (130, 450):
            c.spot(x, y, 5, 5, "#8a6a4a", 1, blur=0.2)


def s_institutional(c):
    outdoor(c, ground="#cfc6ac", horizon=460)
    column_building(c, 170, 480, 460, 300)
    for x in (80, 720):
        tree(c, x, 480, 180)
    c.shape([(330, 480), (470, 480), (520, 600), (280, 600)], "#d8cdb4", smooth=False, shade=0.1, hi=0, ow=1.2)
    for x, sh in ((360, "#6d5a48"), (440, NAVY)):
        person(c, x, 590, 120, jacket=sh, shirt=CREAM, face="smile", pose=("down", "down"))


def s_faculty(c):
    outdoor(c, ground="#b9c79a", horizon=440)
    column_building(c, 230, 440, 340, 200)
    gowns = ("#2f2a28", "#3a2f3e", "#2f3a4e")
    for i, x in enumerate((220, 400, 580)):
        p = person(c, x, 575, 300, shirt=gowns[i], pants="#2f2a28", face="smile", pose=("hold", "down"),
                   hair=("grey", "brown", "black")[i], hair_style=("bald", "bob", "short")[i], glasses=i == 0)
        hx, ty, u = head_top(p)
        mortarboard(c, hx, ty + 2 * u, 12 * u)
        book(c, p["hand_l"][0] - 10, p["hand_l"][1] - 30, 26, 36, color=("#8a3a2e", "#3f5f7e", "#5f7f4a")[i])


def s_board(c):
    office(c, 440, wall="#e4dcc4")
    c.shape(rect_pts(250, 70, 550, 220), "#b8873b", smooth=False, shade=0.4, hi=0.5, depth=6, ow=1.3)
    c.shape(rect_pts(264, 84, 536, 206), "#f1e6c8", smooth=False, shade=0.2, hi=0, ow=1.0)
    column_building(c, 330, 196, 140, 90, n=4)
    for i, x in enumerate((140, 300, 500, 660)):
        person(c, x, 590, 300, jacket=(NAVY, "#6d5a48", "#3f4f3e", "#4a4a58")[i], shirt=CREAM,
               tie=(RED, GOLD, NAVY, RED)[i], face="smile" if i % 2 else "neutral", pose=("hold", "hold"),
               legs=False, hair=("grey", "black", "brown", "grey")[i], hair_style=("bald", "short", "bob", "short")[i])
    c.shape(rect_pts(40, 440, 760, 460), "#7a4c2a", smooth=False, shade=0.3, hi=0.4, depth=4, ow=1.4)
    c.shape(rect_pts(60, 460, 740, 590), "#8f5b34", smooth=False, grad="#6b4428", shade=0.3, hi=0.2, depth=10, ow=1.3)
    for x in (140, 300, 500, 660):
        c.shape([(x - 40, 440), (x + 40, 440), (x + 34, 420), (x - 34, 420)], "#f1e6c8", smooth=False, shade=0.2,
                hi=0.1, depth=2, ow=1.0)
        paper(c, x - 50, 446, x + 10, 458, lines=0, shade=0)


def s_senate(c):
    office(c, 430, wall="#e4dcc4")
    blackboard(c, 260, 50, 540, 200)
    c.text((400, 125), "VOTE", 34, face="hand", color="#eee8d8")
    for row, (y, xs) in enumerate(((560, (130, 300, 500, 670)), (680, (210, 400, 590)))):
        for i, x in enumerate(xs):
            p = person(c, x, y + 60, 280 if row == 0 else 320, jacket=("#2f2a28", "#3a2f3e", "#2f3a4e", "#4a4a58")[i % 4],
                       shirt=CREAM, face="smile", pose=("down", "up") if (i + row) % 2 == 0 else ("down", "down"),
                       legs=False, hair=("grey", "brown", "black", "grey")[i % 4],
                       hair_style=("bald", "bob", "short", "short")[(i + row) % 4], glasses=(i + row) % 3 == 0)
        c.shape(rect_pts(0, y - 30 + (0 if row == 0 else 40), 800, y + (0 if row == 0 else 40)), "#8f5b34",
                smooth=False, shade=0.3, hi=0.3, depth=6, ow=1.3)


def s_wellrounded(c):
    room(c, floor_y=460, flowers=False)
    c.stroke(ellipse_pts(400, 270, 250, 190, 60), color=mix(c.ink, c.paper, 0.4), w=1.6, closed=True, taper=False)
    p = person(c, 400, 560, 320, shirt="#c98a6a", pants="#4a4a58", face="happy", pose=("wave", "hip"), hair="brown")
    book_stack(c, 110, 210, 3, 80)
    # bảng màu vẽ
    c.shape([(560, 120), (660, 100), (700, 150), (650, 196), (590, 190), (556, 160)], "#d8b88a", shade=0.4, hi=0.4,
            depth=8, ow=1.3)
    for x, y, col in ((600, 130, RED), (632, 122, "#3f5f7e"), (662, 140, GREEN), (640, 168, GOLD)):
        c.spot(x, y, 9, 8, col, 1, blur=0.2)
    # bóng
    c.shape(ellipse_pts(150, 420, 34, 34, 28), "#e8dcc0", shade=0.5, hi=0.4, depth=10, ow=1.4)
    c.stroke(ellipse_pts(150, 420, 34, 12, 20), w=1.0, closed=True, taper=False)
    c.line([(150, 386), (150, 454)], w=1.0, smooth=False)
    music_note(c, 650, 400, 40, double=True)
    gear(c, 400, 80, 30, 9, "#b8873b")


def s_staleair(c):
    room(c, floor_y=440, wall="#d8ccae")
    window(c, 500, 70, 720, 290, curtains="#8a7a5a", tree=False)
    c.line([(540, 190), (680, 190)], color=RED, w=3, smooth=False)  # cửa sổ đóng chặt
    c.shape(rect_pts(596, 176, 624, 204), "#c9a35a", smooth=False, shade=0.4, hi=0.4, depth=2, ow=1.1)
    # không khí mờ đục
    for k in range(16):
        random.seed(k)
        x, y = random.uniform(30, 780), random.uniform(60, 420)
        c.spot(x, y, random.uniform(30, 70), random.uniform(12, 24), "#a8a088", 0.25, blur=0.4)
    for y in (140, 220, 300):
        c.line([(60 + t * 50, y + 8 * math.sin(t)) for t in range(7)], color="#8a8470", w=1.4, wobble=0.6)
    p = person(c, 300, 565, 320, shirt="#c9874a", face="worried", pose=("down", (2, -16)), hair="black")
    hx, hy = p["hand_r"]
    c.shape([(hx, hy), (hx - 20, hy - 46), (hx + 10, hy - 56), (hx + 30, hy - 40)], "#f1e6c8", smooth=False,
            shade=0.3, hi=0.2, depth=3, ow=1.2)  # quạt tay
    for k in range(3):
        c.line([(hx - 40 - k * 12, hy - 30 + k * 8), (hx - 60 - k * 12, hy - 20 + k * 8)], w=1.4)


def s_respite(c):
    outdoor(c, horizon=420)
    c.glow(640, 90, 120, "#fff1b0", 0.7)
    c.shape(ellipse_pts(640, 90, 38, 38, 24), "#f2b63c", shade=0.2, hi=0.4, depth=4, ow=1.2)
    tree(c, 130, 470, 300)
    p = person(c, 380, 560, 310, shirt="#e8d8b0", face="happy", pose=("up", "up"), hair="brown")
    c.shape(rect_pts(520, 470, 640, 482), "#8f5b34", smooth=False, shade=0.3, hi=0.4, depth=3, ow=1.2)
    for x in (530, 630):
        c.line([(x, 482), (x, 560)], color="#7a4c2a", w=4, smooth=False, taper=False)
    c.shape([(560, 440), (594, 440), (590, 470), (564, 470)], "#f6f4ef", smooth=False, shade=0.3, hi=0.4, depth=4,
            ow=1.2)
    for k in range(3):
        c.line([(568 + k * 10, 432), (572 + k * 10, 410), (566 + k * 10, 392)], color="#9a948c", w=1.2)
    # văn phòng nhỏ phía xa, đã bỏ lại sau lưng
    c.shape(rect_pts(660, 300, 760, 420), "#bfb39a", smooth=False, shade=0.3, hi=0.2, depth=6, ow=1.1)
    for x in (676, 716):
        for y in (318, 360):
            c.shape(rect_pts(x, y, x + 24, y + 26), "#9fbccc", smooth=False, shade=0.2, depth=2, ow=0.8)


def s_lovedones(c):
    room(c, floor_y=450)
    window(c, 560, 70, 740, 280)
    person(c, 240, 565, 320, shirt="#3f5f7e", face="happy", pose=("down", (26, 4)), hair="brown")
    person(c, 520, 565, 300, shirt="#c98a6a", skirt="#7d8f5a", hair_style="bob", hair="red", face="happy",
           pose=((26, 4), "down"))
    person(c, 380, 565, 190, shirt=GOLD, face="laugh", pose=("up", "up"), hair="brown")
    for x, y, s in ((380, 160, 26), (300, 110, 16), (460, 110, 18)):
        heart(c, x, y, s)


def s_dull(c):
    office(c, 470, wall="#e6dcc0")
    for cx, vivid in ((220, True), (580, False)):
        x0, y0, x1, y1 = easel(c, cx, 560, 240, 180)
        sky, sun, hill = ("#8fc4e0", "#f2b63c", "#6f9a55") if vivid else ("#bdbab2", "#c8c0a8", "#a8a898")
        c.shape(rect_pts(x0 + 8, y0 + 8, x1 - 8, y1 - 8), sky, smooth=False, shade=0, hi=0, outline=vivid)
        c.shape(ellipse_pts(x0 + 170, y0 + 50, 22, 22, 20), sun, shade=0.2 if vivid else 0, hi=0.4 if vivid else 0,
                outline=vivid)
        c.shape([(x0 + 8, y1 - 60), (x0 + 90, y1 - 110), (x0 + 170, y1 - 70), (x1 - 8, y1 - 90), (x1 - 8, y1 - 8),
                 (x0 + 8, y1 - 8)], hill, shade=0.4 if vivid else 0, hi=0.3 if vivid else 0, outline=vivid)
        if not vivid:
            c.spot((x0 + x1) / 2, (y0 + y1) / 2, 110, 80, "#d8d2c4", 0.6, blur=0.5)
    check(c, 220, 520, 24)
    cross(c, 580, 520, 22)


def s_onthemove(c):
    c.shape(rect_pts(0, 0, 800, 440), "#e4dcc4", smooth=False, shade=0, hi=0, outline=False)
    # sân ga: bảng giờ tàu + tàu
    c.shape(rect_pts(480, 60, 760, 200), "#2f2a28", smooth=False, shade=0.2, hi=0.2, depth=4, ow=1.4)
    for i, t in enumerate(("08:10  PARIS", "09:25  BERLIN", "11:40  ROME")):
        c.text((500, 92 + i * 36), t, 18, face="type", color="#f2d27a", anchor="lm")
    c.shape(rect_pts(0, 260, 460, 420), "#3f6f5a", smooth=False, shade=0.4, hi=0.3, depth=10, ow=1.4)
    for x in range(20, 440, 80):
        c.shape(rect_pts(x, 290, x + 56, 340), "#cfe3ea", smooth=False, shade=0.2, hi=0.3, depth=3, ow=1.0)
    c.shape(rect_pts(0, 440, 800, 600), "#b5ab98", smooth=False, grad="#9a907e", shade=0, hi=0, ow=1.2)
    c.shape(rect_pts(0, 420, 800, 440), "#e0c04a", smooth=False, shade=0, hi=0, ow=1.0)
    p = person(c, 560, 575, 320, jacket="#6d5a48", shirt=CREAM, tie=NAVY, face="smile", pose=("hold", "down"), look=1)
    hx, hy = p["hand_r"]
    suitcase(c, hx - 40, hy + 4, 90, 70)
    lx, ly = p["hand_l"]
    briefcase(c, lx - 50, ly + 4, 60, 40)
    for k in range(3):
        c.line([(400 - k * 6, 300 + k * 50), (450 - k * 6, 300 + k * 50)], w=2.2)
    sparkles(c, [(700, 260, 8)])


def s_onmyown(c):
    outdoor(c, horizon=400)
    c.shape([(380, 400), (420, 400), (560, 600), (240, 600)], "#d8c8a8", smooth=False, shade=0.1, hi=0, ow=1.2)
    c.shape([(420, 470), (800, 440), (800, 470), (450, 510)], "#d8c8a8", smooth=False, shade=0.1, hi=0, ow=1.2)
    c.shape(rect_pts(600, 250, 610, 420), "#7a4c2a", smooth=False, shade=0.4, hi=0.3, depth=3, ow=1.1)
    for y, t, d in ((270, "TOWN 3 km", 1), (310, "LAKE 5 km", -1)):
        c.shape([(605, y - 16), (605 + d * 110, y - 16), (605 + d * 126, y), (605 + d * 110, y + 16), (605, y + 16)],
                "#e8dcc0", smooth=False, shade=0.3, hi=0.2, depth=4, ow=1.2)
        c.text((605 + d * 58, y), t, 13, face="serif")
    tree(c, 120, 420, 220)
    p = person(c, 360, 560, 300, shirt="#7d8f5a", pants="#5a5048", face="smile", pose=("hold", "hold"), hair="brown")
    (lx, ly), (rx, ry) = p["hand_l"], p["hand_r"]
    c.shape([(lx - 10, ly - 40), (rx + 10, ry - 40), (rx + 10, ry + 6), (lx - 10, ly + 6)], "#e9dcb4", smooth=False,
            shade=0.25, hi=0.1, depth=5, ow=1.3)
    c.line([(lx + 4, ly - 20), (lx + 40, ly - 30), (rx - 10, ry - 10)], color=RED, w=1.6)


def s_discover(c):
    c.shape(rect_pts(0, 0, 800, 600), "#5a4a3e", smooth=False, grad="#3a2f28", shade=0, hi=0, outline=False)
    for k in range(12):  # vách hang đá
        random.seed(k + 40)
        x, y, r = random.uniform(0, 800), random.uniform(0, 420), random.uniform(40, 90)
        c.shape(ellipse_pts(x, y, r, r * 0.7, 14), "#6d5a4a", shade=0.5, hi=0.3, depth=r * 0.3, ow=1.0)
    c.shape(rect_pts(0, 470, 800, 600), "#8a7458", smooth=False, grad="#6b5a44", shade=0, hi=0, ow=1.2)
    chest(c, 470, 520, 190, 100)
    p = person(c, 260, 575, 320, shirt="#b98a52", pants="#5a5048", face="surprised", pose=("down", (22, 4)),
               hair="brown", look=1)
    hx, ty, u = head_top(p)
    c.shape([(hx - 14 * u, ty + 3 * u), (hx + 14 * u, ty + 3 * u), (hx + 9 * u, ty - 2 * u), (hx - 9 * u, ty - 2 * u)],
            "#c9a35a", smooth=False, shade=0.4, hi=0.4, depth=3, ow=1.2)  # mũ thám hiểm
    c.shape(ellipse_pts(hx, ty - 2 * u, 9 * u, 5 * u, 16, 180, 360), "#c9a35a", smooth=False, shade=0.4, hi=0.4,
            depth=3, ow=1.2)
    rx, ry = p["hand_r"]
    c.shape(limb_pts((rx, ry), (rx + 30, ry - 20), 6, 8), "#6d4a2e", shade=0.3, hi=0.3, depth=2, ow=1.1)
    c.glow(rx + 40, ry - 30, 60, "#ffe9a0", 0.7)
    sparkles(c, [(560, 360, 14), (640, 380, 10), (520, 400, 8)])


def s_avid(c):
    room(c, floor_y=450)
    # giá sách đầy
    c.shape(rect_pts(480, 60, 760, 450), "#7a4c2a", smooth=False, shade=0.4, hi=0.3, depth=8, ow=1.4)
    random.seed(3)
    for y in (90, 180, 270, 360):
        c.shape(rect_pts(492, y + 78, 748, y + 88), "#5e3a21", smooth=False, shade=0, hi=0, ow=0.8)
        x = 496
        while x < 740:
            w = random.uniform(14, 24)
            hgt = random.uniform(56, 76)
            c.shape(rect_pts(x, y + 78 - hgt, x + w, y + 78), random.choice(["#8a3a2e", "#3f5f7e", "#5f7f4a", "#a8703f",
                                                                             "#6d4a6e", "#c9a35a"]),
                    smooth=False, shade=0.3, hi=0.3, depth=3, ow=0.9)
            x += w + 2
    book_stack(c, 60, 560, 6, 110)
    p = person(c, 300, 565, 320, shirt="#c98a6a", skirt="#3f5f7e", hair_style="bun", hair="black", face="happy",
               pose=((-3, 16), (-3, 16)), glasses=True)
    (lx, ly) = p["hand_l"]
    book(c, lx - 14, ly - 50, (p["hand_r"][0] - lx) + 28, 56, open_=True)
    sparkles(c, [(220, 170, 10), (390, 160, 8), (410, 230, 7)])
    heart(c, 300, 120, 14)


def s_getknow(c):
    office(c, 440)
    paper(c, 280, 60, 520, 120, lines=0, color="#f6ecc8")
    c.text((400, 90), "Welcome, everyone!", 22, face="hand", color=RED)
    person(c, 160, 565, 300, shirt="#7d8f5a", face="smile", pose=("down", "hold"), hair="black")
    a = person(c, 330, 565, 310, jacket=NAVY, shirt=CREAM, tie=RED, face="smile", pose=("down", (25, 14)), look=1)
    b = person(c, 520, 565, 300, shirt="#c98a6a", skirt="#6d7fa8", hair_style="bob", hair="red", face="happy",
               pose=((25, 14), "down"), look=-1)
    person(c, 680, 565, 290, shirt="#e8d8b0", face="smile", pose=("hold", "down"), hair="grey", glasses=True)
    for p in (a, b):
        hx, hy, r = p["head"]
        name_tag(c, hx - r * 0.45, hy + r * 2.5, 1.0)
    bubble(c, 330, 180, 80, 40, "Hi! I'm Tom.", (330, 250), size=20)
    bubble(c, 560, 170, 86, 40, "Nice to meet you!", (530, 240), size=17)


def s_contentious(c):
    office(c, 440)
    a = person(c, 230, 565, 320, jacket=NAVY, shirt=CREAM, tie=RED, face="worried", pose=("down", "point"), look=1)
    b = person(c, 570, 565, 310, jacket="#6d5a48", shirt=CREAM, tie=GOLD, face="worried", pose=("point", "fist"),
               look=-1)
    c.shape([(380, 120), (430, 120), (404, 190), (440, 190), (370, 300), (392, 210), (356, 210)], GOLD, smooth=False,
            shade=0.4, hi=0.5, depth=4, ow=1.4)  # tia sét
    bubble(c, 170, 130, 90, 44, "No way!", (220, 220), size=26)
    bubble(c, 640, 130, 90, 44, "You're wrong!", (580, 220), size=22)


def s_somewhat(c):
    c.shape(rect_pts(0, 0, 800, 600), "#ece2c8", smooth=False, shade=0, hi=0, outline=False)
    table_top(c, 470, 560)
    # đồng hồ đo: kim chỉ hơi nhích lên
    cx, cy, r = 400, 330, 200
    c.shape(ellipse_pts(cx, cy, r, r, 48, 180, 360) + [(cx + r, cy)], "#8a5a34", smooth=False, shade=0.4, hi=0.4,
            depth=12, ow=1.6)
    c.shape(ellipse_pts(cx, cy, r * 0.88, r * 0.88, 48, 180, 360) + [(cx + r * 0.88, cy)], "#f6efdc", smooth=False,
            shade=0.2, hi=0.1, depth=8, ow=1.2)
    for i, (a0, a1, col) in enumerate(((180, 240, "#9fbf86"), (240, 300, "#e0c04a"), (300, 360, "#d88a6a"))):
        c.shape(ellipse_pts(cx, cy, r * 0.84, r * 0.84, 16, a0, a1) + ellipse_pts(cx, cy, r * 0.66, r * 0.66, 16, a1, a0),
                col, smooth=False, shade=0.2, hi=0.2, depth=3, ow=1.0)
    for lbl, a in (("none", 190), ("a bit", 232), ("half", 270), ("a lot", 350)):
        ra = math.radians(a)
        c.text((cx + math.cos(ra) * r * 0.52, cy + math.sin(ra) * r * 0.52), lbl, 18, face="hand")
    ang = math.radians(228)
    c.line([(cx, cy), (cx + math.cos(ang) * r * 0.78, cy + math.sin(ang) * r * 0.78)], color=RED, w=5, smooth=False,
           taper=False)
    c.shape(ellipse_pts(cx, cy, 14, 14, 16), "#4a3a2a", shade=0.4, hi=0.5, depth=3, ow=1.2)
    c.shape(rect_pts(cx - 140, cy, cx + 140, cy + 40), "#6d4a2e", smooth=False, shade=0.4, hi=0.3, depth=6, ow=1.3)


def s_advocate(c):
    outdoor(c, ground="#cfc6ac", horizon=430)
    house(c, 560, 430, 200, wall="#d8c8b0")
    c.shape(rect_pts(250, 430, 410, 470), "#8f5b34", smooth=False, shade=0.4, hi=0.4, depth=6, ow=1.4)  # bục
    c.shape(rect_pts(260, 470, 400, 520), "#7a4c2a", smooth=False, shade=0.4, hi=0.3, depth=6, ow=1.3)
    p = person(c, 330, 440, 260, jacket=NAVY, shirt=CREAM, tie=RED, face="laugh", pose=("fist", "hold"))
    rx, ry = p["hand_r"]
    c.line([(rx, ry + 10), (rx, ry - 150)], color="#7a4c2a", w=4, smooth=False, taper=False)
    c.shape(rect_pts(rx - 60, ry - 210, rx + 60, ry - 140), "#fbf6e8", smooth=False, shade=0.2, hi=0.1, depth=5,
            ow=1.4)
    c.text((rx, ry - 186), "SAVE THE", 15, face="serif", color=RED)
    c.text((rx, ry - 162), "PARK!", 22, face="serif", color=RED)
    for i, x in enumerate((90, 160, 580, 680)):
        person(c, x, 590, 200, shirt=("#c98a6a", "#7d8f5a", "#8a9cb5", "#e8d8b0")[i], face="happy",
               pose=("up", "down") if i % 2 else ("down", "up"), hair=("black", "brown", "red", "grey")[i],
               hair_style=("short", "bob", "bun", "short")[i])


def s_longway(c):
    outdoor(c, horizon=440)
    # một hạt giống nhỏ -> cây lớn
    c.shape([(70, 560), (150, 560), (140, 600), (80, 600)], "#b5643c", smooth=False, shade=0.4, hi=0.3, depth=4, ow=1.2)
    c.shape(ellipse_pts(110, 548, 10, 6, 14), "#7a5534", shade=0.3, hi=0.3, depth=2, ow=1.0)
    c.line([(110, 544), (112, 520)], color=GREEN, w=2.4)
    c.shape([(112, 524), (128, 512), (118, 528)], GREEN, smooth=False, shade=0.2, hi=0.3, depth=2, ow=0.9)
    c.shape([(112, 524), (98, 512), (106, 528)], GREEN, smooth=False, shade=0.2, hi=0.3, depth=2, ow=0.9)
    arrow(c, [(170, 520), (300, 470), (420, 450)], color=RED, w=5, head=18)
    tree(c, 600, 560, 440)
    for x, y in ((540, 260), (640, 230), (600, 320), (680, 300)):
        c.shape(ellipse_pts(x, y, 9, 9, 12), "#c9483a", shade=0.4, hi=0.5, depth=3, ow=1.0)
    p = person(c, 330, 590, 170, shirt="#c9874a", face="happy", pose=("down", "point"), hair="brown")


def s_incidentally(c):
    office(c, 440)
    plant(c, 720, 440, 140)
    person(c, 230, 565, 310, jacket="#6d5a48", shirt=CREAM, tie=NAVY, face="neutral", pose=("down", "down"), look=1)
    p = person(c, 500, 565, 300, shirt="#c98a6a", skirt="#6d7fa8", hair_style="bob", hair="black", face="smile",
               pose=("down", "up"), look=-1)
    bubble(c, 300, 140, 150, 50, None, (430, 220))
    c.text((300, 128), "Oh, by the way...", 24, face="hand", color=INK_RED)
    c.text((300, 158), "(a small side note)", 16, face="hand", color=(120, 110, 100))
    lx, ly = p["hand_r"]
    c.glow(lx, ly - 40, 40, "#fff1b0", 0.7)
    c.shape(ellipse_pts(lx, ly - 46, 16, 18, 20), "#f6e7a0", shade=0.3, hi=0.5, depth=4, ow=1.2)
    c.shape(rect_pts(lx - 8, ly - 30, lx + 8, ly - 20), "#9a948c", smooth=False, shade=0.3, hi=0.4, depth=2, ow=1.0)


# ================================================================ Test 2
def s_planning(c):
    office(c, 470, wall="#e2e4cc")
    for x0, y0 in ((60, 80), (600, 70)):
        paper(c, x0, y0, x0 + 150, y0 + 110, color="#dde8ef", lines=0)
        for k in range(4):
            c.line([(x0 + 16, y0 + 20 + k * 22), (x0 + 134, y0 + 20 + k * 22)], color="#5f7fae", w=0.8, smooth=False)
            c.line([(x0 + 20 + k * 34, y0 + 12), (x0 + 20 + k * 34, y0 + 100)], color="#5f7fae", w=0.8, smooth=False)
    person(c, 240, 640, 330, jacket=NAVY, shirt=CREAM, tie=RED, face="think", pose=("hold", (18, 8)), legs=False,
           glasses=True, hair="grey", hair_style="bald")
    person(c, 560, 640, 320, shirt="#c98a6a", skirt="#6d7fa8", hair_style="bun", hair="brown", face="smile",
           pose=((18, 8), "hold"), legs=False)
    # bàn có sa bàn quy hoạch thành phố
    c.shape([(120, 430), (680, 430), (760, 560), (40, 560)], "#8f5b34", smooth=False, shade=0.3, hi=0.3, depth=8,
            ow=1.4)
    c.shape([(170, 440), (630, 440), (690, 540), (110, 540)], "#cfe0c0", smooth=False, shade=0.1, hi=0, ow=1.2)
    c.line([(400, 440), (400, 540)], color="#9a948c", w=6, smooth=False, taper=False)
    c.line([(140, 490), (660, 490)], color="#9a948c", w=6, smooth=False, taper=False)
    random.seed(2)
    for x, y, h in ((200, 470, 40), (260, 466, 60), (320, 472, 30), (460, 468, 70), (530, 470, 44), (590, 474, 30),
                    (220, 520, 34), (300, 524, 50), (470, 522, 40), (560, 520, 56)):
        c.shape(rect_pts(x, y - h, x + 34, y), random.choice(["#e8dcc0", "#d8b8a0", "#c9a888"]), smooth=False,
                shade=0.5, hi=0.4, depth=6, ow=1.1)
    for x, y in ((360, 520), (640, 522), (160, 470)):
        c.shape(ellipse_pts(x, y - 10, 12, 12, 12), "#6f9a55", shade=0.5, hi=0.3, depth=4, ow=1.0)


def s_clock(c):
    c.shape(rect_pts(0, 0, 400, 600), "#cfe0e6", smooth=False, grad="#f3efe2", shade=0, hi=0, outline=False)
    c.shape(rect_pts(400, 0, 800, 600), "#2f3a5a", smooth=False, grad="#4a5a7a", shade=0, hi=0, outline=False)
    c.glow(130, 110, 80, "#fff1b0", 0.7)
    c.shape(ellipse_pts(130, 110, 40, 40, 24), "#f2b63c", shade=0.2, hi=0.4, depth=4, ow=1.2)
    c.shape(ellipse_pts(680, 110, 40, 40, 24), "#f6efcf", shade=0.3, hi=0.2, depth=6, ow=1.2)
    c.shape(ellipse_pts(700, 98, 34, 34, 24), "#2f3a5a", shade=0, hi=0, outline=False)
    for x, y in ((560, 60), (620, 170), (760, 200), (520, 140)):
        sparkles(c, [(x, y, 6)], color="#f6efcf")
    # nhà máy sáng đèn cả ngày lẫn đêm
    c.shape(rect_pts(80, 330, 720, 520), "#b5ab98", smooth=False, shade=0.4, hi=0.3, depth=12, ow=1.5)
    for x in (140, 600):
        c.shape(rect_pts(x, 230, x + 50, 330), "#9a8a78", smooth=False, shade=0.4, hi=0.3, depth=6, ow=1.3)
    for x in range(110, 700, 70):
        c.shape(rect_pts(x, 370, x + 44, 420), "#f6d77a", smooth=False, shade=0.2, hi=0.4, depth=3, ow=1.1)
        c.shape(rect_pts(x, 450, x + 44, 500), "#f6d77a", smooth=False, shade=0.2, hi=0.4, depth=3, ow=1.1)
    c.shape(rect_pts(0, 520, 800, 600), "#8a8470", smooth=False, shade=0, hi=0, ow=1.2)
    clock(c, 400, 210, 90, hour=12, minute=0, roman=False)
    c.text((400, 560), "24 / 7", 34, face="georgia", color=CREAM)


def s_joinforces(c):
    outdoor(c, ground="#cfc6ac", horizon=430)
    a = person(c, 230, 565, 320, shirt="#c9874a", face="happy", pose=("down", (22, -2)), hair="black", look=1)
    b = person(c, 570, 565, 320, shirt="#7d8f5a", face="happy", pose=((22, -2), "down"), hair="brown", look=-1)
    # hai người cùng nâng một khúc gỗ lớn (thêm 2 tay còn lại)
    (ax, ay), (bx, by) = a["hand_r"], b["hand_l"]
    c.shape(limb_pts((ax - 20, ay + 2), (bx + 20, by + 2), 22, 22), "#a8703f", shade=0.5, hi=0.4, depth=10, ow=1.5)
    c.shape(ellipse_pts(bx + 22, by + 2, 12, 22, 16), "#d8b88a", shade=0.3, hi=0.3, depth=3, ow=1.2)
    for k in range(3):
        c.stroke(ellipse_pts(bx + 22, by + 2, 4 + k * 4, 8 + k * 6, 14), color="#a8703f", w=0.7, closed=True,
                 taper=False)
    for p in (a, b):
        for key in ("hand_r", "hand_l"):
            hx, hy = p[key]
    c.shape(ellipse_pts(ax, ay + 2, 9, 11, 14), SKIN[0], shade=0.4, hi=0.3, depth=3, ow=1.2)
    c.shape(ellipse_pts(bx, by + 2, 9, 11, 14), SKIN[0], shade=0.4, hi=0.3, depth=3, ow=1.2)
    c.text((400, 150), "1 + 1 > 2", 40, face="georgia", color=RED)
    sparkles(c, [(320, 120, 10), (480, 110, 9)])


def s_formally(c):
    office(c, 440, wall="#e4dcc4")
    c.shape(rect_pts(300, 60, 500, 200), "#b8873b", smooth=False, shade=0.4, hi=0.5, depth=6, ow=1.3)
    c.shape(rect_pts(314, 74, 486, 186), "#f1e6c8", smooth=False, shade=0.2, hi=0, ow=1.0)
    c.shape(ellipse_pts(400, 130, 30, 30, 24), "#c9a24a", shade=0.4, hi=0.5, depth=4, ow=1.2)
    for side, x in ((-1, 120), (1, 680)):
        c.shape(rect_pts(x - 20, 60, x + 20, 300), RED, smooth=False, shade=0.5, hi=0.3, depth=8, ow=1.3)
    person(c, 260, 585, 330, jacket="#2f2a28", shirt=CREAM, tie="#2f2a28", face="neutral", pose=("hold", (14, 10)),
           legs=False, hair="grey")
    person(c, 540, 580, 320, jacket="#2f2a28", shirt=CREAM, tie=RED, face="neutral", pose=((14, 10), "hold"),
           legs=False, hair="black")
    desk(c, 120, 420, 680, 590)
    paper(c, 330, 360, 470, 420, lines=3, shade=0.1)
    c.shape(ellipse_pts(450, 400, 14, 14, 18), RED, shade=0.4, hi=0.4, depth=3, ow=1.2)  # dấu sáp
    c.line([(340, 405), (380, 398), (410, 406)], color=NAVY, w=1.6, wobble=0.8)
    c.shape(limb_pts((300, 380), (346, 404), 3, 2), "#2f2a28", shade=0.3, hi=0.5, depth=1, ow=1.0)


def s_assume(c):
    office(c, 440)
    p = person(c, 330, 565, 320, jacket=NAVY, shirt=CREAM, tie=RED, face="happy", pose=("down", "head"), look=0)
    hx, ty, u = head_top(p)
    hat(c, hx, ty + 2 * u, 12 * u, kind="cap")
    person(c, 580, 565, 300, shirt="#6d5a48", jacket="#4a4a58", face="smile", pose=((24, 0), "down"), hair="grey",
           hair_style="bald", look=-1)
    c.shape(rect_pts(600, 120, 760, 230), "#fbf6e8", smooth=False, shade=0.25, hi=0.1, depth=5, ow=1.3)
    c.text((680, 150), "NEW ROLE", 18, face="serif", color=RED)
    c.text((680, 190), "Captain", 24, face="hand")
    sparkles(c, [(400, 140, 10), (260, 160, 8)])


def s_enterprising(c):
    outdoor(c, ground="#cfc6ac", horizon=420)
    house(c, 560, 420, 200, wall="#d8c8b0")
    # quầy nước chanh tự dựng
    c.shape(rect_pts(150, 270, 450, 290), "#f6efdc", smooth=False, shade=0.3, hi=0.2, depth=4, ow=1.3)
    for i in range(6):
        c.shape([(150 + i * 50, 240), (200 + i * 50, 240), (200 + i * 50, 270), (150 + i * 50, 270)],
                RED if i % 2 == 0 else "#fbf6e8", smooth=False, shade=0.2, hi=0.2, depth=3, ow=1.1)
    for x in (156, 438):
        c.line([(x, 290), (x, 560)], color="#7a4c2a", w=5, smooth=False, taper=False)
    p = person(c, 300, 580, 300, shirt=GOLD, face="laugh", pose=("wave", "hold"), hair="brown", legs=False)
    c.shape(rect_pts(150, 430, 450, 560), "#b98a52", smooth=False, shade=0.5, hi=0.4, depth=10, ow=1.5)
    for y in (462, 528):
        c.line([(150, y), (450, y)], color=darker("#b98a52", 0.45), w=1.0, smooth=False)
    c.text((300, 495), "LEMONADE 5c", 22, face="serif", color=RED)
    for x in (190, 240):
        c.shape([(x, 400), (x + 30, 400), (x + 26, 430), (x + 4, 430)], "#f6e7a0", smooth=False, shade=0.3, hi=0.4,
                depth=3, ow=1.1)
    coin_stack(c, 410, 430, 4, 14)
    c.shape(rect_pts(480, 380, 560, 430), "#fbf6e8", smooth=False, shade=0.2, hi=0.1, depth=4, ow=1.2)
    c.text((520, 405), "OPEN", 18, face="serif", color=GREEN)


def s_excess(c):
    c.shape(rect_pts(0, 0, 800, 600), "#ece2c8", smooth=False, shade=0, hi=0, outline=False)
    table_top(c, 430, 560)
    c.shadow([(300, 470), (420, 470), (430, 480), (300, 485)], 0.3, blur=5, dx=8, dy=0)
    c.shape([(290, 290), (430, 290), (418, 470), (302, 470)], "#f6f4ef", smooth=False, shade=0.35, hi=0.5, depth=10,
            ow=1.4)
    c.shape([(294, 296), (426, 296), (416, 468), (304, 468)], "#9fc6dd", smooth=False, grad="#7fb0d0", shade=0.3,
            hi=0.3, depth=10, outline=False)
    c.stroke(ellipse_pts(360, 290, 70, 12, 32), w=1.2, closed=True, taper=False)
    # bình rót tiếp + nước tràn
    c.shape([(440, 140), (560, 120), (590, 220), (500, 250), (470, 230)], "#c9d4da", shade=0.5, hi=0.6, depth=12,
            ow=1.5)
    c.shape([(450, 150), (400, 170), (408, 180), (458, 166)], "#c9d4da", smooth=False, shade=0.3, hi=0.5, depth=3,
            ow=1.2)
    c.line([(404, 176), (390, 230), (380, 286)], color="#7fb0d0", w=5)
    for side in (-1, 1):
        x = 360 + side * 70
        c.shape([(x, 292), (x + side * 16, 320), (x + side * 12, 400), (x + side * 24, 470), (x + side * 4, 470),
                 (x + side * 2, 320)], "#9fc6dd", shade=0.2, hi=0.4, depth=3, ow=1.0)
    c.shape([(220, 470), (500, 470), (540, 500), (190, 500)], "#9fc6dd", shade=0.2, hi=0.5, depth=4, ow=1.1)
    c.text((640, 400), "too much!", 30, face="hand", color=RED, angle=-6)


def s_involve(c):
    office(c, 440)
    for i, x in enumerate((420, 560, 690)):
        person(c, x, 565, 290, shirt=("#c98a6a", "#7d8f5a", "#8a9cb5")[i], face="happy",
               pose=("down", "down") if i else ("wave", "down"), hair=("black", "brown", "red")[i],
               hair_style=("short", "short", "bob")[i], look=-1)
    person(c, 170, 565, 280, shirt="#e8d8b0", face="surprised", pose=("down", "point"), hair="blond", look=1)
    arrow(c, [(250, 300), (310, 260), (370, 270)], color=RED, w=4, head=14)
    bubble(c, 520, 140, 130, 46, "Come join us!", (440, 230), size=26)


def s_assuch(c):
    room(c, floor_y=450, flowers=False)
    p = person(c, 220, 565, 320, shirt="#fbf8f0", pants="#4a4a58", face="smile", pose=("down", "hold"), hair="brown")
    hx, ty, u = head_top(p)
    hat(c, hx, ty + 2 * u, 12 * u, kind="chef")
    paper(c, 60, 90, 200, 150, lines=0)
    c.text((130, 120), "CHEF", 24, face="serif", color=RED)
    arrow(c, [(330, 250), (420, 230), (500, 250)], color=RED, w=5, head=18)
    # bếp: nồi đang nấu
    c.shape(rect_pts(480, 400, 740, 560), "#4a4a58", smooth=False, shade=0.4, hi=0.3, depth=10, ow=1.4)
    c.shape(rect_pts(470, 380, 750, 400), "#6d6d78", smooth=False, shade=0.3, hi=0.4, depth=3, ow=1.2)
    c.shape([(540, 300), (680, 300), (670, 380), (550, 380)], "#9a948c", smooth=False, shade=0.5, hi=0.5, depth=12,
            ow=1.4)
    c.stroke(ellipse_pts(610, 300, 70, 12, 28), w=1.2, closed=True, taper=False)
    for k in range(3):
        c.line([(580 + k * 30, 290), (590 + k * 30, 250), (578 + k * 30, 210)], color="#9a948c", w=1.6)
    c.glow(610, 400, 50, "#f6a64a", 0.6)


def s_undertaking(c):
    outdoor(c, ground="#cfc6ac", horizon=470)
    # công trình tháp lớn đang xây + giàn giáo + cần cẩu
    c.shape(rect_pts(380, 160, 560, 470), "#c9b89a", smooth=False, shade=0.45, hi=0.3, depth=14, ow=1.5)
    for y in range(180, 470, 36):
        c.line([(380, y), (560, y)], color=darker("#c9b89a", 0.4), w=0.8, smooth=False)
    for x in (360, 580):
        c.line([(x, 120), (x, 470)], color="#7a5534", w=3, smooth=False, taper=False)
    for y in range(140, 470, 60):
        c.line([(360, y), (580, y)], color="#7a5534", w=2.4, smooth=False, taper=False)
    c.line([(680, 470), (680, 60)], color="#c9a24a", w=8, smooth=False, taper=False)
    c.line([(470, 70), (760, 70)], color="#c9a24a", w=7, smooth=False, taper=False)
    for x in range(480, 760, 24):
        c.line([(x, 64), (x + 12, 76)], color="#8a6a2a", w=1.2, smooth=False)
    c.line([(500, 70), (500, 120)], w=1.4, smooth=False)
    c.shape(rect_pts(440, 120, 560, 136), "#8a5a34", smooth=False, shade=0.3, hi=0.4, depth=3, ow=1.2)
    p = person(c, 200, 575, 300, shirt="#e8d8b0", jacket="#6d5a48", face="think", pose=("hold", "point"), look=1)
    hx, ty, u = head_top(p)
    c.shape(ellipse_pts(hx, ty + 2 * u, 9 * u, 5 * u, 16, 180, 360), "#e0c04a", smooth=False, shade=0.4, hi=0.5,
            depth=3, ow=1.2)
    lx, ly = p["hand_l"]
    c.shape(rect_pts(lx - 50, ly - 30, lx + 20, ly + 20), "#cfe0ef", smooth=False, shade=0.2, hi=0.1, depth=4, ow=1.2)


def s_entail(c):
    outdoor(c, horizon=430)
    house(c, 300, 460, 200)
    for (x, y), lbl in (((600, 120), "repairs"), ((640, 270), "bills"), ((600, 420), "lawn")):
        arrow(c, [(520, 300), ((520 + x) / 2, (300 + y) / 2), (x - 60, y)], color=RED, w=4, head=14)
        paper(c, x - 50, y - 40, x + 110, y + 40, lines=0, shade=0.15)
        c.text((x + 30, y + 20), lbl, 22, face="hand")
    c.shape(limb_pts((600, 100), (650, 126), 5, 5), "#9a948c", shade=0.4, hi=0.5, depth=2, ow=1.1)  # cờ lê
    c.shape(ellipse_pts(596, 98, 10, 10, 12), "#9a948c", shade=0.4, hi=0.5, depth=2, ow=1.1)
    coin(c, 600, 250, 14)
    coin(c, 630, 248, 14)
    for k in range(4):
        c.line([(580 + k * 12, 412), (584 + k * 12, 394)], color=GREEN, w=2)
    c.text((300, 520), "a new house", 24, face="hand", color=RED)


# ================================================================ Test 3
def s_pilotprogram(c):
    outdoor(c, ground="#b9a882", horizon=400)
    # một luống thử nghiệm nhỏ giữa cánh đồng lớn còn trống
    for k in range(6):
        y = 430 + k * 28
        c.line([(0, y), (800, y + 6)], color=darker("#b9a882", 0.3), w=1.0, smooth=False)
    c.shape(rect_pts(140, 440, 360, 560), "#8a7458", smooth=False, shade=0.2, hi=0, ow=1.3)
    for x in range(160, 350, 32):
        for y in (466, 506, 546):
            c.line([(x, y), (x, y - 18)], color=GREEN, w=2)
            c.shape([(x, y - 14), (x + 10, y - 22), (x + 2, y - 10)], GREEN, smooth=False, shade=0.2, hi=0.3, depth=2,
                    ow=0.8)
    c.line([(150, 440), (150, 380)], color="#7a4c2a", w=3, smooth=False, taper=False)
    c.shape([(150, 380), (210, 392), (150, 404)], RED, smooth=False, shade=0.2, hi=0.3, depth=2, ow=1.1)
    c.text((270, 420), "trial plot", 20, face="hand", color=RED)
    p = person(c, 520, 560, 300, shirt="#fbf8f0", pants="#4a4a58", face="think", pose=("hold", "chin"), glasses=True,
               look=-1)
    lx, ly = p["hand_l"]
    c.shape(rect_pts(lx - 34, ly - 40, lx + 20, ly + 20), "#c9a35a", smooth=False, shade=0.3, hi=0.3, depth=3, ow=1.2)
    paper(c, lx - 28, ly - 34, lx + 14, ly + 14, lines=3, shade=0.1)


def s_pilottested(c):
    office(c, 450)
    desk(c, 100, 420, 700, 590)
    # nguyên mẫu máy pha cà phê đang được thử
    c.shape(rect_pts(170, 250, 330, 420), "#8a3a2e", smooth=False, shade=0.5, hi=0.4, depth=12, ow=1.5)
    c.shape(rect_pts(190, 340, 310, 400), "#2f2a28", smooth=False, shade=0.3, hi=0.2, depth=6, ow=1.2)
    c.shape([(232, 360), (268, 360), (264, 396), (236, 396)], "#f6f4ef", smooth=False, shade=0.3, hi=0.4, depth=3,
            ow=1.1)
    for x in (200, 240, 280):
        c.spot(x, 280, 7, 7, ("#9fbf86", GOLD, RED)[(x - 200) // 40], 1, blur=0.2)
    paper(c, 420, 230, 640, 410, title="TEST LIST", title_size=16, lines=0)
    for i, t in enumerate(("heats water", "safe to use", "users happy")):
        y = 300 + i * 34
        c.text((440, y), t, 18, face="hand", anchor="lm")
        check(c, 610, y, 12)
    person(c, 680, 570, 300, shirt="#fbf8f0", face="happy", pose=("point", "down"), glasses=True, legs=False,
           hair="grey", look=-1)


def s_closedeal(c):
    office(c, 440, wall="#e4dcc4")
    c.shape(rect_pts(300, 60, 500, 190), "#b8873b", smooth=False, shade=0.4, hi=0.5, depth=6, ow=1.3)
    c.shape(rect_pts(314, 74, 486, 176), "#cfe0e6", smooth=False, shade=0.2, hi=0, ow=1.0)
    person(c, 260, 605, 330, jacket=NAVY, shirt=CREAM, tie=RED, face="happy", pose=("down", (25, 10)), legs=False,
           look=1)
    person(c, 540, 605, 330, jacket="#6d5a48", shirt=CREAM, tie=GOLD, face="happy", pose=((25, 10), "down"),
           legs=False, hair="grey", look=-1)
    desk(c, 120, 440, 680, 590)
    paper(c, 330, 386, 470, 440, lines=3, shade=0.1)
    c.line([(350, 428), (390, 420), (420, 430)], color=NAVY, w=1.6, wobble=0.8)
    c.line([(430, 428), (450, 420), (462, 428)], color=NAVY, w=1.6, wobble=0.8)
    pencil(c, 520, 420, 470, 432)
    c.text((400, 250), "DEAL!", 30, face="georgia", color=RED)
    sparkles(c, [(340, 230, 10), (460, 230, 10)])


def s_housewarming(c):
    room(c, floor_y=450)
    c.shape(rect_pts(80, 120, 230, 450), "#8a5a34", smooth=False, shade=0.5, hi=0.4, depth=10, ow=1.5)  # cửa
    c.spot(210, 300, 5, 5, GOLD, 1, blur=0.2)
    for i, x in enumerate(range(260, 780, 60)):  # dây cờ trang trí
        c.shape([(x, 40 + (i % 2) * 6), (x + 50, 40 + ((i + 1) % 2) * 6), (x + 25, 90)],
                (RED, GOLD, GREEN, "#3f5f7e")[i % 4], smooth=False, shade=0.2, hi=0.3, depth=3, ow=1.0)
    c.line([(250, 40), (790, 44)], w=1.2)
    person(c, 330, 565, 310, shirt="#c98a6a", skirt="#6d7fa8", hair_style="bob", hair="brown", face="laugh",
           pose=("wave", "down"))
    g = person(c, 520, 565, 300, jacket="#6d5a48", shirt=CREAM, face="happy", pose=("hold", "down"), look=-1)
    lx, ly = g["hand_l"]
    c.shape(rect_pts(lx - 30, ly - 46, lx + 30, ly + 4), "#3f5f7e", smooth=False, shade=0.4, hi=0.4, depth=6, ow=1.3)
    c.shape(rect_pts(lx - 5, ly - 46, lx + 5, ly + 4), GOLD, smooth=False, shade=0.2, hi=0.3, depth=2, ow=1.0)
    plant(c, 690, 565, 120)
    c.shape(rect_pts(80, 470, 230, 486), "#c9a35a", smooth=False, shade=0.2, hi=0.3, depth=2, ow=1.0)
    c.text((155, 512), "WELCOME", 18, face="serif", color=RED)
    heart(c, 420, 150, 16)


# ================================================================ Test 4
def s_intermission(c):
    stage(c, 470)
    c.shape(rect_pts(130, 60, 670, 470), "#9c2f2a", smooth=False, shade=0.3, hi=0.2, depth=20, ow=1.4)
    for x in range(150, 670, 40):
        c.line([(x, 70), (x + 4, 460)], color=darker("#9c2f2a", 0.4), w=1.0)
    c.shape(rect_pts(290, 200, 510, 310), "#f6efdc", smooth=False, shade=0.25, hi=0.1, depth=5, ow=1.4)
    c.text((400, 236), "BREAK", 30, face="serif", color=RED)
    c.text((400, 280), "back in 15 min", 22, face="hand")
    clock(c, 400, 110, 34, hour=8, minute=15, roman=False)
    for i, x in enumerate((110, 240, 560, 690)):
        person(c, x, 640, 240, shirt=("#c98a6a", "#7d8f5a", "#8a9cb5", "#e8d8b0")[i], face="smile",
               pose=("hold", "down") if i % 2 else ("down", "hold"), legs=False,
               hair=("black", "brown", "red", "grey")[i], hair_style=("short", "bob", "bun", "short")[i])
    for x in (130, 670):
        c.shape([(x - 12, 500), (x + 12, 500), (x + 9, 530), (x - 9, 530)], "#f6f4ef", smooth=False, shade=0.3,
                hi=0.4, depth=3, ow=1.1)


def s_artistresidence(c):
    room(c, floor_y=450)
    window(c, 520, 60, 740, 280)
    x0, y0, x1, y1 = easel(c, 520, 570, 220, 160)
    c.shape(rect_pts(x0 + 8, y0 + 8, x1 - 8, y1 - 8), "#cfe0e6", smooth=False, grad="#f3efe2", shade=0, hi=0,
            outline=False)
    c.shape([(x0 + 8, y1 - 50), (x0 + 90, y1 - 90), (x1 - 8, y1 - 60), (x1 - 8, y1 - 8), (x0 + 8, y1 - 8)], "#6f9a55",
            shade=0.4, hi=0.3, outline=False)
    c.shape(ellipse_pts(x1 - 50, y0 + 40, 16, 16, 16), "#f2b63c", shade=0.2, hi=0.4, depth=3, outline=False)
    p = person(c, 260, 565, 320, shirt="#e8d8b0", pants="#5a5048", face="smile", pose=("hold", (20, -12)), look=1)
    hx, ty, u = head_top(p)
    hat(c, hx, ty + 3 * u, 12 * u, color="#8a3a2e", kind="beret")
    rx, ry = p["hand_r"]
    c.line([(rx, ry), (rx + 40, ry - 20)], color="#7a4c2a", w=3, smooth=False, taper=False)
    c.spot(rx + 42, ry - 21, 4, 4, RED, 1, blur=0.2)
    lx, ly = p["hand_l"]
    c.shape([(lx - 40, ly - 10), (lx + 20, ly - 20), (lx + 30, ly + 10), (lx - 30, ly + 24)], "#d8b88a", shade=0.4,
            hi=0.4, depth=4, ow=1.2)
    for dx, col in ((-20, RED), (-4, "#3f5f7e"), (12, GREEN)):
        c.spot(lx + dx, ly + 2, 5, 4, col, 1, blur=0.2)
    # giường nhỏ: nghệ sĩ ở lại sống tại đây
    c.shape(rect_pts(40, 470, 200, 510), "#8a5a34", smooth=False, shade=0.4, hi=0.3, depth=4, ow=1.3)
    c.shape(rect_pts(40, 452, 200, 472), "#f1e6c8", smooth=False, shade=0.3, hi=0.2, depth=3, ow=1.1)
    c.shape(rect_pts(46, 438, 96, 456), "#fbf8f0", shade=0.3, hi=0.2, depth=3, ow=1.0)


def s_medley(c):
    room(c, floor_y=450, flowers=False)
    # máy hát + nhiều bản nhạc trộn vào một dòng
    c.shape(rect_pts(320, 400, 520, 470), "#8a5a34", smooth=False, shade=0.5, hi=0.4, depth=10, ow=1.5)
    c.shape(ellipse_pts(420, 400, 90, 18, 32), "#2f2a28", shade=0.3, hi=0.4, depth=4, ow=1.2)
    c.line([(500, 396), (470, 360), (480, 300)], color="#c9a24a", w=5, smooth=True, taper=False)
    c.shape([(480, 300), (420, 180), (560, 160), (600, 230)], "#c9a24a", shade=0.5, hi=0.6, depth=16, ow=1.5)
    for k, (x, y, col) in enumerate(((80, 120, RED), (90, 260, "#3f5f7e"), (100, 380, GREEN))):
        paper(c, x, y - 40, x + 130, y + 40, lines=0, shade=0.1)
        for j in range(5):
            c.line([(x + 8, y - 20 + j * 8), (x + 122, y - 20 + j * 8)], color=mix(c.ink, c.paper, 0.5), w=0.5,
                   smooth=False, taper=False)
        music_note(c, x + 40, y + 6, 22, color=col)
        music_note(c, x + 80, y - 2, 22, color=col, double=True)
        arrow(c, [(x + 140, y), (x + 220, (y + 230) / 2 + 20), (610, 200)], color=col, w=3, head=12)
    for x, y, col in ((640, 140, RED), (690, 190, "#3f5f7e"), (650, 250, GREEN), (720, 120, GOLD)):
        music_note(c, x, y, 26, color=col)


def s_oncebustling(c):
    outdoor(c, ground="#b5ab98", horizon=420)
    random.seed(9)
    x = 0
    while x < 800:
        w = random.uniform(110, 160)
        h = random.uniform(170, 250)
        c.shape(rect_pts(x, 420 - h, x + w, 420), random.choice(["#b8a890", "#a89a84", "#c0b098"]), smooth=False,
                shade=0.4, hi=0.2, depth=10, ow=1.3)
        for wy in (420 - h + 30, 420 - h + 90):
            for wx in (x + 16, x + w - 46):
                c.shape(rect_pts(wx, wy, wx + 30, wy + 36), "#6d6a62", smooth=False, shade=0.2, depth=2, ow=1.0)
                c.line([(wx, wy), (wx + 30, wy + 36)], w=1.0, smooth=False)
                c.line([(wx + 30, wy), (wx, wy + 36)], w=1.0, smooth=False)
        c.shape(rect_pts(x + 20, 360, x + w - 20, 420), "#7a6a58", smooth=False, shade=0.3, depth=4, ow=1.1)
        x += w
    c.shape(rect_pts(0, 420, 800, 600), "#a8a090", smooth=False, grad="#8f887e", shade=0, hi=0, ow=1.2)
    for k in range(8):  # rác bay, cỏ mọc
        random.seed(k + 90)
        c.line([(random.uniform(0, 800), 600), (random.uniform(0, 800), 560)], color="#7a8a4a", w=1.4)
    c.shape(rect_pts(300, 330, 500, 372), "#d8cdb4", smooth=False, shade=0.3, hi=0.1, depth=4, ow=1.2)
    c.text((400, 351), "CLOSED", 22, face="serif", color=RED)
    # ảnh cũ: ngày xưa đông đúc
    c.shape(rect_pts(560, 450, 760, 580), "#f1e6c8", smooth=False, shade=0.3, hi=0.1, depth=5, ow=1.4)
    for i, x in enumerate(range(580, 750, 30)):
        person(c, x, 570, 80, shirt=("#c98a6a", "#7d8f5a", "#8a9cb5")[i % 3], face="smile",
               hair=("black", "brown", "red")[i % 3])
    c.text((660, 600 - 120 - 6 + 4), "1950", 14, face="hand")


def s_treasured(c):
    c.shape(rect_pts(0, 0, 800, 600), "#ece2c8", smooth=False, shade=0, hi=0, outline=False)
    table_top(c, 400, 560, wood="#8f5b34")
    c.glow(400, 330, 230, "#fff1c8", 0.5)
    # hộp kỷ niệm mở nắp: ảnh cũ, dây chuyền, thư
    c.shape([(250, 300), (550, 300), (560, 150), (240, 150)], "#6d3a2a", smooth=False, shade=0.4, hi=0.4, depth=8,
            ow=1.5)
    c.shape([(256, 296), (544, 296), (552, 160), (248, 160)], "#b84a4a", smooth=False, shade=0.3, hi=0.2, depth=6,
            ow=1.0)
    c.shape(rect_pts(240, 300, 560, 460), "#6d3a2a", smooth=False, shade=0.5, hi=0.4, depth=12, ow=1.6)
    c.shape(rect_pts(256, 310, 544, 370), "#b84a4a", smooth=False, shade=0.3, hi=0.1, depth=6, ow=1.0)
    c.shape(rect_pts(290, 200, 380, 290), "#f1e6c8", smooth=False, shade=0.3, hi=0.1, depth=4, ow=1.3)
    c.shape(ellipse_pts(335, 236, 16, 18, 16), "#c9a888", shade=0.3, hi=0.2, depth=3, ow=1.0)
    c.shape([(310, 280), (360, 280), (352, 254), (318, 254)], "#9a8a78", shade=0.3, hi=0.2, depth=3, ow=1.0)
    c.stroke(ellipse_pts(450, 300, 50, 30, 28, 180, 360), color="#c9a24a", w=2.0, taper=False)
    heart(c, 450, 330, 16, color="#d8b25a")
    paper(c, 400, 180, 500, 250, lines=3, shade=0.1)
    sparkles(c, [(220, 140, 10), (590, 170, 12), (600, 300, 8)])
    for x in (330, 470):
        c.shape(rect_pts(x - 8, 380, x + 8, 410), "#c9a35a", smooth=False, shade=0.3, hi=0.5, depth=2, ow=1.0)


def s_endure(c):
    c.shape(rect_pts(0, 0, 800, 600), "#8a96a0", smooth=False, grad="#b8c0c4", shade=0, hi=0, outline=False)
    for k in range(5):
        random.seed(k + 3)
        c.shape(ellipse_pts(random.uniform(0, 800), random.uniform(40, 140), random.uniform(90, 160), 40, 20),
                "#6d7680", shade=0.4, hi=0.3, depth=10, ow=1.1)
    c.shape(rect_pts(0, 470, 800, 600), "#7a8a6a", smooth=False, grad="#5f6f50", shade=0, hi=0, ow=1.2)
    random.seed(1)
    for k in range(90):  # mưa xiên
        x, y = random.uniform(0, 840), random.uniform(0, 600)
        c.line([(x, y), (x - 14, y + 30)], color="#dfe7ec", w=1.0, smooth=False, wobble=0)
    for y in (220, 300, 380):  # gió
        c.line([(560 + t * 30, y + 10 * math.sin(t)) for t in range(8)], color="#eef3f5", w=2, wobble=0.3)
    tree(c, 650, 500, 200, leaf="#5f7f4a")
    p = person(c, 330, 575, 330, jacket="#6d5a48", shirt=CREAM, face="neutral", pose=("down", (2, -14)), hair="black")
    hx, hy = p["hand_r"]
    umbrella(c, hx - 10, hy - 140, 110, color="#3f5f7e")


def s_awaybusiness(c):
    c.shape(rect_pts(0, 0, 800, 440), "#e4dcc4", smooth=False, shade=0, hi=0, outline=False)
    # cửa kính sân bay + máy bay
    c.shape(rect_pts(380, 50, 780, 330), "#cfe0e6", smooth=False, grad="#eef3e4", shade=0, hi=0, ow=1.5)
    for x in (513, 646):
        c.line([(x, 50), (x, 330)], w=2, smooth=False, taper=False)
    c.shape([(450, 200), (700, 170), (730, 180), (700, 196), (460, 216)], "#f6f4ef", shade=0.3, hi=0.4, depth=6,
            ow=1.3)
    c.shape([(580, 186), (620, 130), (640, 132), (620, 190)], "#f6f4ef", smooth=False, shade=0.3, hi=0.3, depth=3,
            ow=1.2)
    c.shape([(470, 206), (460, 180), (478, 180), (490, 204)], RED, smooth=False, shade=0.2, hi=0.3, depth=2, ow=1.0)
    c.shape(rect_pts(0, 440, 800, 600), "#b5ab98", smooth=False, grad="#9a907e", shade=0, hi=0, ow=1.2)
    c.shape(rect_pts(80, 80, 300, 160), "#2f2a28", smooth=False, shade=0.2, hi=0.2, depth=4, ow=1.4)
    c.text((190, 106), "GATE 12", 20, face="type", color="#f2d27a")
    c.text((190, 138), "NEW YORK", 18, face="type", color="#f2d27a")
    p = person(c, 260, 575, 330, jacket=NAVY, shirt=CREAM, tie=RED, face="smile", pose=("down", "hold"), look=1)
    rx, ry = p["hand_r"]
    briefcase(c, rx - 30, ry + 6, 70, 48)
    suitcase(c, 380, 450, 90, 110, color="#3f5f7e")


def s_shame(c):
    office(c, 440)
    p = person(c, 330, 565, 330, shirt="#8a9cb5", face="sad", pose=("cheek", "cheek"), hair="brown")
    hx, hy, r = p["head"]
    c.spot(hx - 4 * r / 8 * 1.1, hy + 3, r * 0.3, r * 0.2, "#e8706a", 0.8)
    c.spot(hx + 4 * r / 8 * 1.1, hy + 3, r * 0.3, r * 0.2, "#e8706a", 0.8)
    for i, x in enumerate((570, 690)):
        person(c, x, 565, 280, shirt=("#c98a6a", "#7d8f5a")[i], face="surprised", pose=("point", "down"),
               hair=("black", "red")[i], hair_style=("short", "bob")[i], look=-1)
    # cốc cà phê đổ lên giấy tờ dưới sàn
    paper(c, 120, 520, 240, 560, lines=2, shade=0.1)
    c.shape(ellipse_pts(180, 540, 46, 14, 20), "#7a4c2a", shade=0.2, hi=0.4, depth=3, ow=1.0)
    c.shape([(200, 520), (230, 516), (236, 540), (206, 546)], "#f6f4ef", shade=0.3, hi=0.4, depth=3, ow=1.1)
    for x, y in ((250, 160), (420, 150)):
        c.line([(x, y), (x + 10, y - 20)], w=1.6)


def s_aspiring(c):
    c.shape(rect_pts(0, 0, 800, 600), "#2f3a5a", smooth=False, grad="#5a6a8a", shade=0, hi=0, outline=False)
    c.glow(660, 110, 120, "#fff1b0", 0.6)
    sparkles(c, [(660, 110, 40)], color="#f2d27a")
    random.seed(5)
    for _ in range(14):
        sparkles(c, [(random.uniform(20, 780), random.uniform(20, 300), random.uniform(3, 6))], color="#f6efcf")
    # cầu thang đi lên ngôi sao
    for i in range(7):
        x0 = 220 + i * 70
        y0 = 520 - i * 50
        c.shape(rect_pts(x0, y0, x0 + 70, 600), "#c9b89a", smooth=False, shade=0.4, hi=0.3, depth=6, ow=1.3)
    c.shape(rect_pts(0, 520, 220, 600), "#8a8a6a", smooth=False, shade=0, hi=0, ow=1.2)
    p = person(c, 260, 525, 230, shirt=GOLD, face="happy", pose=("down", "up"), hair="brown", look=1)
    book_stack(c, 60, 520, 3, 90)


def s_blockbuster(c):
    c.shape(rect_pts(0, 0, 800, 600), "#2f2a28", smooth=False, shade=0, hi=0, outline=False)
    c.shape(rect_pts(80, 40, 720, 330), "#e8e4d8", smooth=False, shade=0.2, hi=0.1, depth=8, ow=1.5)
    c.glow(400, 180, 260, "#fff6d8", 0.35)
    # cảnh phim hành động trên màn ảnh: thành phố, vụ nổ lớn, trực thăng
    random.seed(12)
    x = 96
    while x < 704:
        w, h = random.uniform(40, 70), random.uniform(70, 170)
        c.shape(rect_pts(x, 314 - h, x + w, 314), random.choice(["#7a7a84", "#6d6d78", "#8a8a94"]), smooth=False,
                shade=0.4, hi=0.2, depth=5, ow=1.1)
        x += w + 4
    burst = []
    for i in range(24):
        a = math.radians(i * 15)
        r = 110 if i % 2 == 0 else 60
        burst.append((470 + r * math.cos(a), 180 + r * 0.75 * math.sin(a)))
    c.glow(470, 180, 140, "#ffd27a", 0.6)
    c.shape(burst, "#f0a23a", smooth=False, shade=0.3, hi=0.5, depth=10, ow=1.3)
    c.shape(ellipse_pts(470, 180, 44, 34, 20), "#f6e7a0", shade=0.1, hi=0.5, depth=4, ow=1.0)
    c.shape([(200, 110), (280, 104), (292, 120), (210, 128)], "#4a4a58", shade=0.4, hi=0.4, depth=4, ow=1.2)
    c.line([(170, 98), (300, 94)], w=2, smooth=False)
    c.line([(276, 112), (320, 100)], w=2, smooth=False)
    for row, y in enumerate((520, 620)):  # khán giả kín ghế (nhìn từ phía sau)
        for k in range(8 if row == 0 else 6):
            x = 60 + k * 96 + (0 if row == 0 else 48)
            col = ("#3a2f2a", "#4a3a2e", "#2f2a28")[(k + row) % 3]
            c.shape(ellipse_pts(x, y - 120, 30, 34, 20), col, shade=0.3, hi=0.2, depth=6, ow=1.1)
            c.shape(ellipse_pts(x, y - 40, 52, 50, 20, 180, 360) + [(x + 52, y - 40)], "#5a2f2a", smooth=False,
                    shade=0.3, hi=0.2, depth=6, ow=1.1)
        c.shape(rect_pts(0, y - 40, 800, y), "#7a2a26", smooth=False, shade=0.3, hi=0.3, depth=6, ow=1.3)
    c.shape([(700, 380), (740, 380), (730, 440), (710, 440)], "#f6efdc", smooth=False, shade=0.3, hi=0.3, depth=3,
            ow=1.1)
    for k in range(3):
        c.spot(712 + k * 9, 376, 6, 5, "#f6e7a0", 1, blur=0.2)


def s_stagedreading(c):
    stage(c, 470)
    for i, x in enumerate((220, 400, 580)):
        p = person(c, x, 575, 300, shirt=("#c98a6a", "#2f2a28", "#7d8f5a")[i], face="smile" if i != 1 else "laugh",
                   pose=((-3, 14), (-3, 14)), hair=("black", "grey", "red")[i], hair_style=("short", "bald", "bob")[i],
                   look=(1, 0, -1)[i])
        (lx, ly), (rx, ry) = p["hand_l"], p["hand_r"]
        c.shape(rect_pts(lx - 6, ly - 44, rx + 6, ly + 8), "#fbf6e8", smooth=False, shade=0.2, hi=0.1, depth=3,
                ow=1.2)
        c.line([((lx + rx) / 2, ly - 44), ((lx + rx) / 2, ly + 8)], w=0.8, smooth=False)
        c.shape(ellipse_pts(lx, ly, 6, 7, 12), SKIN[0], shade=0.3, hi=0.3, depth=2, ow=1.0)
        c.shape(ellipse_pts(rx, ry, 6, 7, 12), SKIN[0], shade=0.3, hi=0.3, depth=2, ow=1.0)


def s_financialaid(c):
    office(c, 440)
    p = person(c, 260, 565, 320, jacket="#2f2a28", shirt=CREAM, tie=RED, face="smile", pose=("down", (24, 6)),
               hair="grey", hair_style="bald", glasses=True, look=1)
    s = person(c, 540, 565, 300, shirt="#c98a6a", skirt="#3f5f7e", hair_style="bob", hair="black", face="laugh",
               pose=((24, 6), "hold"), look=-1)
    hx, ty, u = head_top(s)
    mortarboard(c, hx, ty + 2 * u, 12 * u)
    rx, ry = p["hand_r"]
    c.shape([(rx + 2, ry - 30), (rx + 70, ry - 30), (rx + 74, ry + 10), (rx - 2, ry + 10)], "#e8f0d8", smooth=False,
            shade=0.2, hi=0.1, depth=4, ow=1.3)
    c.text((rx + 36, ry - 16), "$1000", 15, face="georgia", color=GREEN)
    c.line([(rx + 8, ry + 2), (rx + 60, ry + 2)], color=mix(c.ink, c.paper, 0.4), w=0.8, smooth=False)
    lx, ly = s["hand_r"]
    book_stack(c, lx - 30, ly + 30, 3, 60)
    paper(c, 560, 90, 740, 190, lines=0, color="#f6ecc8")
    c.text((650, 122), "SCHOLARSHIP", 15, face="serif", color=RED)
    c.text((650, 160), "for students", 18, face="hand")
    coin_stack(c, 120, 560, 5, 18)


def s_diligently(c):
    room(c, floor_y=450, wall="#d8ccae")
    window(c, 540, 60, 740, 260, sky=("#2f3a5a", "#5a6a8a"), tree=False, curtains="#6d5a48")
    clock(c, 160, 130, 54, hour=11, minute=30, roman=False)
    person(c, 400, 600, 340, shirt="#e8d8b0", face="neutral", pose=((-1, 18), (-6, 20)), glasses=True, hair="black",
           legs=False)
    desk(c, 120, 430, 680, 590)
    lamp(c, 600, 430, 130)
    folder_stack(c, 140, 430, 110, 10)
    paper(c, 330, 386, 470, 432, lines=3, shade=0.1)
    pencil(c, 470, 400, 420, 420)
    for i, y in enumerate((420, 404, 388)):
        check(c, 300, y - 50, 9)
    c.spot(450, 270, 4, 6, "#9fc6dd", 0.9, blur=0.2)


def s_conversely(c):
    # nửa trái: mùa hè; nửa phải: mùa đông
    c.shape(rect_pts(0, 0, 400, 600), "#cfe0e6", smooth=False, grad="#f3efe2", shade=0, hi=0, outline=False)
    c.shape(rect_pts(400, 0, 800, 600), "#b8c0c8", smooth=False, grad="#e4e8ea", shade=0, hi=0, outline=False)
    c.glow(110, 100, 80, "#fff1b0", 0.7)
    c.shape(ellipse_pts(110, 100, 36, 36, 24), "#f2b63c", shade=0.2, hi=0.4, depth=4, ow=1.2)
    c.shape(rect_pts(0, 460, 400, 600), "#9fbf86", smooth=False, shade=0, hi=0, ow=1.2)
    c.shape(rect_pts(400, 460, 800, 600), "#f6f6f2", smooth=False, shade=0, hi=0, ow=1.2)
    random.seed(4)
    for _ in range(40):
        c.spot(random.uniform(410, 790), random.uniform(10, 450), 3, 3, "#ffffff", 1, blur=0.2)
    person(c, 200, 570, 300, shirt="#f0a23a", pants="#c9a35a", face="happy", pose=("wave", "down"), hair="brown",
           sleeves="short")
    p = person(c, 600, 570, 300, jacket="#3f5f7e", shirt="#3f5f7e", pants="#4a4a58", face="worried",
               pose=((-6, 12), (-6, 12)), hair="brown")
    hx, hy, r = p["head"]
    c.shape(limb_pts((hx - r * 1.1, hy + r * 1.2), (hx + r * 1.1, hy + r * 1.2), r * 0.3, r * 0.3), RED, shade=0.4,
            hi=0.3, depth=3, ow=1.2)  # khăn quàng
    c.line([(400, 0), (400, 600)], w=2.4, smooth=False, taper=False)
    arrow(c, [(330, 300), (400, 270), (470, 300)], color=RED, w=4, head=14)
    arrow(c, [(470, 360), (400, 390), (330, 360)], color=RED, w=4, head=14)


def s_condense(c):
    c.shape(rect_pts(0, 0, 800, 600), "#ece2c8", smooth=False, shade=0, hi=0, outline=False)
    table_top(c, 450, 560)
    folder_stack(c, 80, 460, 170, 22, colors=("#fbf6e8", "#f1ead6", "#e8dfc8"))
    # máy ép
    c.shape(rect_pts(330, 160, 470, 190), "#6d6d78", smooth=False, shade=0.4, hi=0.5, depth=4, ow=1.4)
    c.line([(400, 80), (400, 160)], color="#4a4a58", w=6, smooth=False, taper=False)
    c.line([(350, 80), (450, 80)], color="#4a4a58", w=6, smooth=False, taper=False)
    for x in (338, 462):
        c.line([(x, 190), (x, 450)], color="#4a4a58", w=5, smooth=False, taper=False)
    folder_stack(c, 345, 450, 110, 4, colors=("#fbf6e8", "#f1ead6"))
    arrow(c, [(270, 300), (300, 300), (330, 300)], color=RED, w=5, head=16)
    arrow(c, [(480, 380), (540, 380), (580, 380)], color=RED, w=5, head=16)
    paper(c, 600, 330, 740, 440, title="SUMMARY", title_size=14, lines=3)
    c.text((170, 120), "200 pages", 24, face="hand", color=RED)
    c.text((670, 290), "1 page", 24, face="hand", color=RED)


# ================================================================ bổ sung (Commons không có ảnh hợp)
def s_shipbuilder(c):
    c.shape(rect_pts(0, 0, 800, 600), "#cfd8dc", smooth=False, grad="#eef0e6", shade=0, hi=0, outline=False)
    c.line([(80, 600), (80, 40)], color="#c9a24a", w=8, smooth=False, taper=False)  # cần cẩu
    c.line([(60, 50), (520, 50)], color="#c9a24a", w=7, smooth=False, taper=False)
    c.line([(420, 50), (420, 120)], w=1.4, smooth=False)
    c.shape(rect_pts(380, 120, 470, 140), "#8a5a34", smooth=False, shade=0.3, hi=0.4, depth=3, ow=1.2)
    # thân tàu đang đóng
    c.shape([(160, 220), (780, 220), (760, 420), (220, 440)], "#7a3a2e", smooth=False, shade=0.5, hi=0.3, depth=20,
            ow=1.6)
    c.shape([(160, 220), (780, 220), (778, 250), (164, 250)], "#c9c2b0", smooth=False, shade=0.2, hi=0.3, depth=3,
            ow=1.2)
    for x in range(220, 770, 60):
        c.line([(x, 250), (x + 6, 430)], color=darker("#7a3a2e", 0.4), w=0.9, smooth=False)
    for y in (300, 360):
        c.line([(180, y), (770, y - 10)], color=darker("#7a3a2e", 0.4), w=0.9, smooth=False)
    c.shape(rect_pts(0, 470, 800, 600), "#9a948c", smooth=False, grad="#7a766e", shade=0, hi=0, ow=1.2)
    for x in (300, 500, 680):  # giàn chống
        c.line([(x, 440), (x - 30, 470)], color="#5a4a3a", w=4, smooth=False, taper=False)
    p = person(c, 330, 590, 260, shirt="#3f5f7e", pants="#3f5f7e", face="neutral", pose=("down", (14, -10)), look=1)
    hx, ty, u = head_top(p)
    c.shape(ellipse_pts(hx, ty + 2 * u, 9 * u, 5 * u, 16, 180, 360), "#e0c04a", smooth=False, shade=0.4, hi=0.5,
            depth=3, ow=1.2)
    rx, ry = p["hand_r"]
    c.shape(limb_pts((rx, ry), (rx + 34, ry - 26), 4, 3), "#4a4a58", shade=0.3, hi=0.5, depth=2, ow=1.1)
    c.glow(rx + 40, ry - 30, 40, "#fff1a0", 0.9)
    random.seed(6)
    for _ in range(14):  # tia lửa hàn
        a = random.uniform(0, 6.28)
        L = random.uniform(10, 34)
        c.line([(rx + 40, ry - 30), (rx + 40 + math.cos(a) * L, ry - 30 + math.sin(a) * L)], color="#f2b63c", w=1.4,
               smooth=False)


def s_tabletop(c):
    room(c, floor_y=450)
    # bàn gỗ nhìn chéo từ trên: mặt bàn được tô sáng
    top = [(170, 330), (630, 330), (720, 440), (80, 440)]
    c.shape(top, "#c98a52", smooth=False, grad="#a8703f", shade=0.2, hi=0.6, depth=10, ow=1.6)
    c.shape([(80, 440), (720, 440), (720, 460), (80, 460)], "#8a5a34", smooth=False, shade=0.3, hi=0.3, depth=3,
            ow=1.3)
    for x in (100, 690):
        c.shape(rect_pts(x, 460, x + 22, 580), "#7a4c2a", smooth=False, shade=0.4, hi=0.3, depth=4, ow=1.2)
    for k in range(5):
        c.line([(180 + k * 18, 340 + k * 20), (620 + k * 20, 340 + k * 20)], color="#8a5a34", w=0.7, smooth=False)
    # đồ trên mặt bàn
    c.shape([(220, 370), (330, 362), (346, 408), (226, 418)], "#f1e6c8", smooth=False, shade=0.2, hi=0.1, depth=4,
            ow=1.2)
    c.shape([(470, 360), (504, 360), (500, 400), (474, 400)], "#f6f4ef", smooth=False, shade=0.3, hi=0.4, depth=4,
            ow=1.2)
    c.stroke(ellipse_pts(487, 360, 17, 4, 20), w=1.0, closed=True, taper=False)
    plant(c, 590, 400, 90)
    for x, y in ((150, 300), (650, 300)):
        arrow(c, [(x, y - 80), (x + (400 - x) * 0.15, y - 40), (x + (400 - x) * 0.3, y + 30)], color=RED, w=4,
              head=14)


def s_vocational(c):
    room(c, floor_y=450, wall="#e2d6b8", flowers=False)
    # tường dụng cụ
    c.shape(rect_pts(80, 70, 720, 250), "#c9a888", smooth=False, shade=0.2, hi=0, ow=1.3)
    for x in range(110, 700, 30):
        for y in range(90, 240, 30):
            c.spot(x, y, 2, 2, "#8a6a4a", 0.8, blur=0.2)
    for i, x in enumerate((140, 220, 300, 520, 600, 680)):
        if i % 3 == 0:  # búa
            c.line([(x, 100), (x, 200)], color="#8a5a34", w=5, smooth=False, taper=False)
            c.shape(rect_pts(x - 18, 96, x + 18, 114), "#6d6d78", smooth=False, shade=0.4, hi=0.5, depth=3, ow=1.1)
        elif i % 3 == 1:  # cưa
            c.shape([(x - 14, 100), (x + 14, 100), (x + 20, 220), (x - 4, 220)], "#c9ced3", smooth=False, shade=0.3,
                    hi=0.5, depth=2, ow=1.1)
            c.shape(rect_pts(x - 18, 90, x + 18, 112), "#8a5a34", smooth=False, shade=0.3, hi=0.4, depth=2, ow=1.1)
        else:  # cờ lê
            c.shape(limb_pts((x, 100), (x, 210), 5, 5), "#9a948c", shade=0.3, hi=0.5, depth=2, ow=1.1)
    person(c, 220, 560, 320, shirt="#e8d8b0", jacket="#6d5a48", face="smile", pose=("down", "point"), glasses=True,
           hair="grey", look=1)
    p = person(c, 520, 560, 280, shirt="#7d8f5a", face="think", pose=("hold", "hold"), hair="black", look=-1)
    # bàn mộc + tấm gỗ đang bào
    c.shape(rect_pts(340, 420, 720, 440), "#b98a52", smooth=False, shade=0.3, hi=0.4, depth=4, ow=1.4)
    for x in (360, 690):
        c.shape(rect_pts(x, 440, x + 16, 560), "#8a5a34", smooth=False, shade=0.4, hi=0.3, depth=3, ow=1.2)
    c.shape(rect_pts(400, 396, 660, 420), "#e8c898", smooth=False, shade=0.3, hi=0.4, depth=3, ow=1.2)
    random.seed(2)
    for _ in range(8):  # phoi bào
        x = random.uniform(420, 640)
        c.stroke(ellipse_pts(x, 392, 8, 5, 12, 180, 360), color="#c98a52", w=1.4, taper=False)
    book(c, 120, 400, 70, 50, open_=True)


def s_ware(c):
    room(c, floor_y=460, flowers=False)
    c.shape(rect_pts(120, 60, 680, 450), "#7a4c2a", smooth=False, shade=0.4, hi=0.3, depth=10, ow=1.5)
    c.shape(rect_pts(140, 80, 660, 430), "#e8dcc0", smooth=False, shade=0.3, hi=0.1, depth=12, ow=1.1)
    for y in (190, 310, 430):
        c.shape(rect_pts(140, y - 10, 660, y), "#8a5a34", smooth=False, shade=0.3, hi=0.4, depth=3, ow=1.1)
    # tầng 1: ly thuỷ tinh
    for x in range(170, 640, 56):
        c.shape([(x, 110), (x + 34, 110), (x + 30, 178), (x + 4, 178)], "#dcebef", smooth=False, grad="#b8d0d8",
                shade=0.3, hi=0.6, depth=5, ow=1.2)
        c.spot(x + 9, 140, 2, 18, "#ffffff", 0.8, blur=0.3)
    # tầng 2: bát đĩa sứ
    for x in range(170, 640, 80):
        c.shape(ellipse_pts(x + 30, 262, 34, 34, 28), "#f7f4ee", shade=0.35, hi=0.3, depth=8, ow=1.3)
        c.stroke(ellipse_pts(x + 30, 262, 26, 26, 28), color="#5d7fae", w=1.0, closed=True, taper=False)
    # tầng 3: nồi chảo, dao dĩa
    for x, w, h in ((170, 110, 70), (310, 90, 60)):
        c.shape(rect_pts(x, 410 - h, x + w, 410), "#9a948c", smooth=False, shade=0.5, hi=0.5, depth=8, ow=1.3)
        c.stroke(ellipse_pts(x + w / 2, 410 - h, w / 2, 6, 24), w=1.0, closed=True, taper=False)
    for k in range(5):
        x = 450 + k * 36
        c.shape(limb_pts((x, 340), (x, 410), 3, 3), "#c9ced3", shade=0.3, hi=0.6, depth=2, ow=1.0)
        c.shape(ellipse_pts(x, 344, 7, 10, 12), "#c9ced3", shade=0.3, hi=0.6, depth=2, ow=1.0)


def s_sleep(c):
    room(c, floor_y=460)
    window(c, 520, 60, 740, 260, sky=("#2f3a5a", "#5a6a8a"), tree=False)
    c.shape(ellipse_pts(690, 110, 18, 18, 20), "#f6efcf", shade=0.2, hi=0.3, depth=4, ow=1.1)
    # giường
    c.shape(rect_pts(80, 300, 120, 520), "#8a5a34", smooth=False, shade=0.4, hi=0.4, depth=6, ow=1.4)
    c.shape(rect_pts(100, 400, 600, 470), "#8a5a34", smooth=False, shade=0.4, hi=0.3, depth=6, ow=1.4)
    c.shape([(120, 380), (590, 370), (600, 420), (120, 430)], "#fbf8f0", shade=0.3, hi=0.2, depth=6, ow=1.2)
    c.shape(ellipse_pts(180, 370, 60, 26, 24), "#fbf8f0", shade=0.35, hi=0.3, depth=8, ow=1.2)
    c.shape(ellipse_pts(186, 350, 30, 32, 24), SKIN[0], shade=0.4, hi=0.3, depth=6, ow=1.3)
    c.shape(ellipse_pts(180, 334, 32, 22, 20, 180, 360), "#6b3f22", smooth=False, shade=0.4, hi=0.4, depth=4, ow=1.2)
    for x0 in (172, 196):
        c.line([(x0, 352), (x0 + 6, 356), (x0 + 12, 352)], w=1.4)
    c.line([(182, 368), (188, 370), (194, 368)], w=1.2)
    c.shape([(230, 360), (590, 350), (600, 420), (220, 430)], "#6d7fa8", shade=0.5, hi=0.3, depth=14, ow=1.4)
    for k in range(4):
        c.line([(280 + k * 80, 360), (290 + k * 80, 420)], color=darker("#6d7fa8", 0.4), w=0.9)
    c.shape(rect_pts(580, 300, 620, 520), "#8a5a34", smooth=False, shade=0.4, hi=0.4, depth=6, ow=1.4)
    for i, (x, y, s) in enumerate(((240, 290, 22), (280, 250, 28), (330, 200, 36))):
        c.text((x, y), "z", s, face="georgia", color="#5d7fae")
    lamp(c, 690, 440, 110, on=False)
    c.shape(rect_pts(640, 440, 740, 460), "#7a4c2a", smooth=False, shade=0.3, hi=0.4, depth=3, ow=1.2)


def s_doubleglazed(c):
    # trái: ngoài trời lạnh có tuyết; phải: trong nhà ấm; giữa: mặt cắt cửa kính 2 lớp
    c.shape(rect_pts(0, 0, 330, 600), "#b8c8d8", smooth=False, grad="#e4ecf0", shade=0, hi=0, outline=False)
    c.shape(rect_pts(470, 0, 800, 600), "#ead8b2", smooth=False, shade=0, hi=0, outline=False)
    c.glow(640, 300, 200, "#ffd9a0", 0.5)
    random.seed(8)
    for _ in range(40):
        c.spot(random.uniform(10, 320), random.uniform(10, 590), 3, 3, "#ffffff", 1, blur=0.2)
    c.shape(rect_pts(330, 40, 470, 560), "#e8dcc0", smooth=False, shade=0.3, hi=0.3, depth=6, ow=1.5)  # khung
    for x in (356, 424):  # 2 lớp kính
        c.shape(rect_pts(x, 70, x + 20, 530), "#cfe3ea", smooth=False, grad="#9fbccc", shade=0.3, hi=0.6, depth=4,
                ow=1.3)
        c.spot(x + 6, 200, 2, 80, "#ffffff", 0.9, blur=0.3)
    c.shape(rect_pts(376, 70, 424, 530), "#eef6f8", smooth=False, shade=0, hi=0, ow=0.8)  # lớp khí ở giữa
    c.text((400, 300), "air", 18, face="hand", color="#5d7fae", angle=90)
    c.text((165, 80), "-5°C", 34, face="georgia", color="#3f5f7e")
    c.text((640, 80), "22°C", 34, face="georgia", color=RED)
    arrow(c, [(120, 300), (220, 300), (320, 300)], color="#3f5f7e", w=5, head=18)
    cross(c, 300, 360, 22)
    # trong nhà: ghế bành + lò sưởi ấm
    c.shape(rect_pts(580, 300, 740, 400), "#b85445", smooth=False, shade=0.5, hi=0.3, depth=10, ow=1.4)
    c.shape(rect_pts(560, 390, 760, 520), "#b85445", smooth=False, shade=0.5, hi=0.3, depth=14, ow=1.5)
    for x in (560, 730):
        c.shape(rect_pts(x, 360, x + 30, 520), "#a84a3c", smooth=False, shade=0.4, hi=0.3, depth=6, ow=1.3)
    c.shape(rect_pts(480, 520, 800, 600), "#a8794c", smooth=False, shade=0, hi=0, ow=1.2)


def s_kickoff(c):
    c.shape(rect_pts(0, 0, 800, 300), "#cfe0e6", smooth=False, grad="#f3efe2", shade=0, hi=0, outline=False)
    for x in range(0, 800, 26):  # khán đài
        for y in (200, 230, 260):
            c.spot(x + (y % 2) * 13, y, 8, 10, random.choice(["#c98a6a", "#3f5f7e", "#e0c04a", "#7d8f5a", RED]), 0.9,
                   blur=0.2)
    c.shape(rect_pts(0, 290, 800, 600), "#7fa86a", smooth=False, grad="#6f9a55", shade=0, hi=0, ow=1.2)
    for k in range(0, 800, 100):
        c.shape(rect_pts(k, 290, k + 50, 600), "#88b072", smooth=False, shade=0, hi=0, outline=False)
    c.line([(400, 290), (400, 600)], color=CREAM, w=3, smooth=False, taper=False)
    c.stroke(ellipse_pts(400, 470, 150, 60, 48), color=CREAM, w=3, closed=True, taper=False)
    c.spot(400, 470, 5, 3, CREAM, 1, blur=0.2)
    p = person(c, 330, 520, 230, shirt=RED, pants="#f6efdc", face="happy", pose=("wave", "down"), hair="black",
               sleeves="short", look=1)
    c.shape(ellipse_pts(400, 500, 14, 14, 20), "#fbf8f0", shade=0.4, hi=0.4, depth=4, ow=1.2)
    for a in range(0, 360, 72):
        c.spot(400 + 6 * math.cos(math.radians(a)), 500 + 6 * math.sin(math.radians(a)), 3, 3, "#2f2a28", 1, blur=0.2)
    for k in range(3):
        c.line([(386 - k * 4, 486 + k * 8), (372 - k * 4, 486 + k * 8)], w=1.6)
    person(c, 560, 500, 200, shirt="#2f2a28", pants="#2f2a28", face="smile", pose=("down", "up"), hair="grey",
           hair_style="bald")
    clock(c, 680, 100, 44, hour=3, minute=0, roman=False)


SCENES = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}


def render(args):
    slug, out, pv = args
    try:
        c = Canvas("engraving", seed=sum(map(ord, slug)) % 1000)
        SCENES[slug](c)
        c.finish(os.path.join(out, f"vocabulary-{slug}.webp"), preview_dir=pv)
        return "ok " + slug
    except Exception as e:
        import traceback
        return f"LỖI {slug}: {e}\n{traceback.format_exc()}"


if __name__ == "__main__":
    out, pv = sys.argv[1], sys.argv[2]
    slugs = sys.argv[3:] or list(SCENES)
    with Pool() as pool:
        for r in pool.imap_unordered(render, [(s, out, pv) for s in slugs]):
            if not r.startswith("ok"):
                print(r)
    print(len(slugs), "scenes")
