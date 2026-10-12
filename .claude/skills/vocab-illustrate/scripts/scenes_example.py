"""Example scenes drawn with illustrate.py (templates to copy/adapt). Run: python3 scenes_example.py OUTDIR [scene ...]"""
import sys, math
from illustrate import *
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else "."

# ---------------------------------------------------------------- scenes

def planning():
    c = C("#dcecff", "#f4f9ff")
    c.rect(0, 430, W, H, "#e9dfcf")
    c.rect(70, 60, 330, 240, "#ffffff", r=10, outline="#9aa5b1", w=3)
    for i, col in enumerate(["#9bd7a3", "#ffd68a", "#9cc9ff", "#ffb3a7"]):
        c.rect(90 + (i % 2) * 115, 80 + (i // 2) * 75, 195 + (i % 2) * 115, 140 + (i // 2) * 75, col, r=6)
    c.text((150, 262), "ZONING MAP", 20, "#4a5568")
    c.rect(470, 60, 740, 140, "#2f5d8a", r=10)
    c.text((605, 100), "DEPT. OF PLANNING", 26, "#ffffff")
    # people behind table
    c.person(260, 470, 250, "#e76f51", armL=(-4, 32), armR=(30, 30), skin=SKIN[1], hair="#2b2118")
    c.person(540, 470, 250, "#2a9d8f", armL=(-30, 30), armR=(4, 32), skin=SKIN[0], hair="#7a4b2a", tie="#264653")
    # table
    c.poly([(130, 420), (670, 420), (740, 490), (60, 490)], "#7aa6d8")
    c.poly([(200, 425), (600, 425), (655, 480), (145, 480)], "#ffffff", "#6b7a8f")
    for bx, bw, bh, col in [(240, 34, 46, "#ff9f68"), (295, 28, 62, "#6fcf97"), (350, 40, 38, "#56a8f5"), (415, 30, 70, "#f2c94c"), (470, 38, 50, "#bb86fc"), (525, 30, 40, "#ff6b6b")]:
        c.rect(bx, 465 - bh, bx + bw, 465, col, r=3)
        c.rect(bx, 465 - bh, bx + bw, 465 - bh + 6, "#ffffff")
    c.rect(60, 490, 740, 505, "#5d86b8")
    c.rect(90, 505, 710, 580, "#6a95c9")
    c.save(OUTDIR + "/vocabulary-planning.webp")


def clock():
    c = C("#eaf3ff")
    cx, cy, R = 400, 300, 165
    c.circ(cx, cy, R + 16, "#2b2d42")
    # day half (right? left=day)
    c.circ(cx, cy, R, "#8fd3ff")
    c.d.pieslice([(cx - R) * S, (cy - R) * S, (cx + R) * S, (cy + R) * S], 270, 450, fill="#14213d")
    # sun
    sx, sy = cx - 85, cy - 35
    for k in range(12):
        a = k * math.pi / 6
        c.line([(sx + 42 * math.cos(a), sy + 42 * math.sin(a)), (sx + 62 * math.cos(a), sy + 62 * math.sin(a))], "#ffb703", 6)
    c.circ(sx, sy, 34, "#ffd23f")
    # moon + stars
    mx, my = cx + 85, cy - 35
    c.circ(mx, my, 38, "#fff3b0")
    c.circ(mx + 16, my - 8, 34, "#14213d")
    for (x, y, r) in [(cx + 60, cy + 70, 5), (cx + 150, cy + 30, 4), (cx + 90, cy - 120, 5), (cx + 150, cy - 80, 3), (cx + 40, cy - 40, 3)]:
        c.circ(x, y, r, "#fff3b0")
    # ticks (24)
    for k in range(24):
        a = k * math.pi / 12 - math.pi / 2
        l = 22 if k % 6 == 0 else 12
        c.line([(cx + (R - 6) * math.cos(a), cy + (R - 6) * math.sin(a)), (cx + (R - 6 - l) * math.cos(a), cy + (R - 6 - l) * math.sin(a))], "#ffffff", 4 if k % 6 == 0 else 2.5, False)
    c.rect(cx - 2, cy - R, cx + 2, cy + R, "#ffffff55") if False else None
    # hands
    c.line([(cx, cy), (cx + 75, cy - 65)], "#ffffff", 9)
    c.line([(cx, cy), (cx - 25, cy + 100)], "#ffffff", 6)
    c.circ(cx, cy, 14, "#e63946")
    c.text((90, 60), "24 / 7", 44, "#2b2d42", "lm")
    # circular arrows
    c.arc([cx - R - 40, cy - R - 40, cx + R + 40, cy + R + 40], 200, 340, "#e63946", 9)
    a = math.radians(340)
    px, py = cx + (R + 40) * math.cos(a), cy + (R + 40) * math.sin(a)
    c.poly([(px + 4, py + 26), (px + 24, py - 12), (px - 22, py - 6)], "#e63946")
    c.arc([cx - R - 40, cy - R - 40, cx + R + 40, cy + R + 40], 20, 160, "#e63946", 9)
    a = math.radians(160)
    px, py = cx + (R + 40) * math.cos(a), cy + (R + 40) * math.sin(a)
    c.poly([(px - 4, py - 26), (px - 24, py + 12), (px + 22, py + 6)], "#e63946")
    c.save(OUTDIR + "/vocabulary-clock.webp")


def joinforces():
    c = C("#fff1dd", "#ffe1c4")
    ground(c, 470, "#f6cf9d")
    # gears
    def gear(x, y, r, col):
        for k in range(10):
            a = k * math.pi / 5
            c.circ(x + (r + 6) * math.cos(a), y + (r + 6) * math.sin(a), 9, col)
        c.circ(x, y, r, col)
        c.circ(x, y, r * 0.38, "#fff1dd")
    gear(150, 140, 46, "#f4a261")
    gear(110, 265, 30, "#e9c46a")
    gear(650, 150, 52, "#2a9d8f")
    gear(700, 270, 28, "#e76f51")
    # two people
    c.person(255, 520, 330, "#264653", pants="#2b2d42", skin=SKIN[1], hair="#1d1d1d", armR=(33, 3), armL=(-5, 36), tie="#e9c46a")
    c.person(545, 520, 330, "#e76f51", pants="#6d597a", skin=SKIN[0], hair="#7a4b2a", flip=True, armL=(-33, 3), armR=(5, 36))
    # clasp
    c.circ(400, 324, 22, "#f4c9a3")
    for k in range(12):
        a = k * math.pi / 6
        c.line([(400 + 38 * math.cos(a), 324 + 38 * math.sin(a)), (400 + 56 * math.cos(a), 324 + 56 * math.sin(a))], "#ffb703", 5)
    c.text((400, 110), "JOIN FORCES", 44, "#264653")
    c.save(OUTDIR + "/vocabulary-joinforces.webp")


def formally():
    c = C("#f1ecff", "#e3dcff")
    c.rect(0, 440, W, H, "#cdbfa6")
    # flag
    c.rect(100, 90, 108, 440, "#8d99ae")
    c.poly([(108, 100), (240, 100), (240, 200), (108, 200)], "#d62828")
    c.circ(174, 150, 26, "#ffd23f")
    # person seated behind desk
    c.person(400, 540, 330, "#1d3557", pants="#1d3557", skin=SKIN[2], hair="#1b1b1b", armL=(-8, 36), armR=(14, 40), tie="#e63946", head_dx=0)
    # desk
    c.rect(180, 400, 680, 440, "#8b5e3c", r=6)
    c.rect(200, 440, 660, 560, "#6f4a2e")
    c.rect(220, 460, 450, 540, "#7d5436", r=4)
    # paper + pen
    c.poly([(300, 395), (520, 395), (545, 420), (275, 420)], "#ffffff", "#888")
    for y in (402, 409, 415):
        c.line([(330, y), (500, y)], "#b9c0cc", 2, False)
    c.line([(460, 414), (500, 410), (520, 405)], "#1d3557", 2.5, False)
    c.line([(505, 330), (480, 408)], "#2a2a2a", 7)
    c.poly([(476, 400), (484, 400), (480, 414)], "#f4c9a3")
    # seal
    c.circ(630, 170, 70, "#e63946")
    c.circ(630, 170, 56, "#ffffff", "#e63946", 3)
    c.text((630, 170), "OFFICIAL", 17, "#e63946")
    c.poly([(595, 225), (620, 225), (605, 285), (585, 262)], "#c1121f")
    c.poly([(640, 225), (665, 225), (675, 262), (655, 285)], "#c1121f")
    c.circ(630, 170, 80, None, "#c1121f", 3)
    c.save(OUTDIR + "/vocabulary-formally.webp")


def assume():
    c = C("#e5f6ee", "#cfeedd")
    ground(c, 470, "#b7dfc7")
    c.person(250, 510, 330, "#8d99ae", pants="#4a4e69", skin=SKIN[0], hair="#555", armR=(32, 4), armL=(-5, 34))
    c.person(550, 510, 330, "#e76f51", pants="#3d405b", skin=SKIN[2], hair="#1a1a1a", flip=True, armL=(-32, 4), armR=(5, 34), tie="#264653")
    # handed badge/card between
    c.rect(335, 275, 465, 325, "#ffffff", r=8, outline="#264653", w=4)
    c.text((400, 300), "MANAGER", 22, "#264653")
    c.arrow((300, 250), (350, 250), "#e63946", 5, 16) if False else None
    # arrow showing transfer
    c.arc([300, 180, 500, 300], 200, 340, "#e63946", 6)
    c.poly([(487, 230), (512, 232), (496, 256)], "#e63946")
    c.text((400, 110), "ASSUME THE ROLE", 40, "#264653")
    # crown/helmet cue above receiver
    c.save(OUTDIR + "/vocabulary-assume.webp")


def enterprising():
    c = C("#fff7d6", "#ffe9a8")
    # sky + ground
    ground(c, 480, "#9ad3a6")
    # rocket
    rx, ry = 570, 150
    c.poly([(rx, ry - 90), (rx + 36, ry), (rx + 36, ry + 90), (rx - 36, ry + 90), (rx - 36, ry)], "#f1f5f9", "#9aa5b1")
    c.poly([(rx, ry - 90), (rx + 36, ry), (rx - 36, ry)], "#e63946")
    c.circ(rx, ry + 30, 18, "#56a8f5", "#2b2d42", 4)
    c.poly([(rx - 36, ry + 50), (rx - 66, ry + 110), (rx - 36, ry + 90)], "#e63946")
    c.poly([(rx + 36, ry + 50), (rx + 66, ry + 110), (rx + 36, ry + 90)], "#e63946")
    c.poly([(rx - 24, ry + 90), (rx + 24, ry + 90), (rx + 4, ry + 190), (rx - 4, ry + 190)], "#ffb703")
    c.poly([(rx - 12, ry + 90), (rx + 12, ry + 90), (rx, ry + 150)], "#ff6b35")
    for x, y, r in [(500, 340, 14), (640, 330, 18), (600, 380, 10)]:
        c.circ(x, y, r, "#ffffff")
    # growth bars
    for i, hh in enumerate([60, 110, 170, 240]):
        c.rect(100 + i * 56, 480 - hh, 142 + i * 56, 480, ["#9bd7a3", "#6fcf97", "#34b36b", "#1e9e5a"][i], r=4)
    # person
    c.person(380, 540, 330, "#3a86ff", pants="#264653", skin=SKIN[1], hair="#2b1d12", armR=(28, -30), armL=(-6, 34))
    # idea bulb above head
    bx, by = 380, 110
    c.circ(bx, by, 34, "#ffe66d", "#f4a261", 4)
    c.rect(bx - 14, by + 30, bx + 14, by + 52, "#b8bcc6", r=4)
    for k in range(8):
        a = k * math.pi / 4 + 0.4
        c.line([(bx + 48 * math.cos(a), by + 48 * math.sin(a)), (bx + 66 * math.cos(a), by + 66 * math.sin(a))], "#f4a261", 5)
    c.save(OUTDIR + "/vocabulary-enterprising.webp")


def excess():
    c = C("#e0f2ff", "#f5fbff")
    c.rect(0, 470, W, H, "#d9c5a0")
    # puddle
    c.ell(170, 480, 630, 560, "#9fd4ff")
    # glass
    c.poly([(290, 220), (510, 220), (480, 480), (320, 480)], "#cfe9ff", "#6aa9d8")
    c.poly([(298, 240), (502, 240), (479, 478), (321, 478)], "#4aa3ff")
    # overflow dome
    c.ell(282, 200, 518, 260, "#7ec0ff")
    # drips down
    for x0, x1 in [(285, 255), (515, 548)]:
        c.line([(x0, 232), (x0 + (x1 - x0) * 0.5, 300), (x1, 470)], "#7ec0ff", 14)
    for x, y in [(262, 400), (540, 380), (250, 450), (560, 440)]:
        c.circ(x, y, 7, "#7ec0ff")
    # pitcher pouring from above
    c.poly([(560, 40), (700, 40), (690, 150), (570, 150)], "#ff9f68", "#c96a2e")
    c.poly([(560, 40), (528, 66), (560, 80)], "#ff9f68")
    c.line([(528, 70), (505, 140), (500, 215)], "#4aa3ff", 12, False)
    c.rect(690, 60, 735, 120, None, r=22, outline="#c96a2e", w=10) if False else None
    c.arc([675, 55, 745, 125], 270, 90, "#c96a2e", 10)
    # text
    c.text((400, 560), "EXCESS", 38, "#2b2d42")
    c.save(OUTDIR + "/vocabulary-excess.webp")


def as_such():
    c = C("#eef2ff", "#dfe6ff")
    c.rect(0, 470, W, H, "#cfd8f0")
    c.person(250, 520, 340, "#4361ee", pants="#2b2d42", skin=SKIN[1], hair="#1d1d1d", armL=(-6, 34), armR=(20, 18), tie="#ffffff")
    # badge on chest
    c.rect(208, 322, 292, 352, "#ffffff", r=5, outline="#2b2d42", w=2)
    c.text((250, 337), "MANAGER", 13, "#2b2d42")
    # speech bubble
    c.rect(400, 90, 740, 240, "#ffffff", r=24, outline="#4361ee", w=5)
    c.poly([(420, 230), (360, 300), (470, 232)], "#ffffff", "#4361ee")
    c.rect(412, 220, 468, 236, "#ffffff")
    c.text((570, 140), "As such,", 34, "#4361ee")
    c.text((570, 192), "I approve it.", 34, "#2b2d42")
    # approved doc
    c.rect(480, 330, 680, 480, "#ffffff", r=8, outline="#9aa5b1", w=3)
    for y in (360, 385, 410):
        c.line([(505, y), (655, y)], "#c8d0e0", 4, False)
    c.circ(600, 450, 38, None, "#2a9d8f", 6)
    c.line([(582, 450), (596, 465), (622, 436)], "#2a9d8f", 7)
    c.save(OUTDIR + "/vocabulary-assuch.webp")


def undertaking():
    c = C("#cfe9ff", "#f1f9ff")
    ground(c, 500, "#d9c9a8")
    c.circ(110, 100, 46, "#ffd23f")
    # building frame
    for fl in range(5):
        y = 500 - fl * 66
        c.rect(300, y - 8, 560, y, "#7b8794")
    for col in range(5):
        x = 300 + col * 65
        c.rect(x - 4, 170, x + 4, 500, "#9aa5b1")
    for fl in range(3):
        for col in range(4):
            c.rect(305 + col * 65, 500 - fl * 66 - 60, 360 + col * 65, 500 - fl * 66 - 10, "#8fd0ff")
    # crane
    c.rect(600, 80, 616, 500, "#f2994a")
    for y in range(100, 500, 40):
        c.line([(600, y), (616, y + 40)], "#c96a2e", 3, False)
        c.line([(616, y), (600, y + 40)], "#c96a2e", 3, False)
    c.rect(300, 80, 760, 100, "#f2994a")
    c.rect(750, 100, 770, 160, "#555")
    c.poly([(608, 60), (608, 80), (300, 80)], "#c96a2e")
    c.line([(380, 100), (380, 190)], "#333", 3)
    c.rect(340, 190, 420, 204, "#e63946")
    c.line([(380, 190), (340, 204)], "#333", 3, False)
    c.line([(380, 190), (420, 204)], "#333", 3, False)
    # workers
    c.person(200, 500, 140, "#ff9f1c", pants="#3d405b", skin=SKIN[1], hat="#ffd23f", armL=(-3, 32), armR=(3, 32))
    c.person(255, 500, 140, "#2ec4b6", pants="#3d405b", skin=SKIN[0], hat="#ffffff", armR=(26, -12), armL=(-3, 32))
    c.person(680, 500, 140, "#e63946", pants="#3d405b", skin=SKIN[2], hat="#ffd23f", armL=(-26, -12), armR=(3, 32))
    c.text((400, 560), "A HUGE UNDERTAKING", 34, "#2b2d42")
    c.save(OUTDIR + "/vocabulary-undertaking.webp")


def entail():
    c = C("#f3f0ff", "#e6e0ff")
    # job doc
    c.rect(50, 190, 270, 410, "#ffffff", r=14, outline="#6c5ce7", w=6)
    c.rect(50, 190, 270, 250, "#6c5ce7", r=14)
    c.rect(50, 230, 270, 250, "#6c5ce7")
    c.text((160, 220), "THE JOB", 30, "#ffffff")
    for y in (290, 325, 360):
        c.line([(85, y), (235, y)], "#c8c3ee", 7, False)
    # arrows
    c.arrow((290, 255), (405, 185), "#6c5ce7", 7, 22)
    c.arrow((290, 300), (405, 300), "#6c5ce7", 7, 22)
    c.arrow((290, 345), (405, 405), "#6c5ce7", 7, 22)
    # clock
    c.circ(480, 175, 62, "#ffffff", "#e76f51", 8)
    c.line([(480, 175), (480, 130)], "#2b2d42", 7)
    c.line([(480, 175), (515, 192)], "#2b2d42", 7)
    c.text((565, 175), "long hours", 27, "#2b2d42", "lm")
    # plane
    px, py = 480, 300
    c.circ(px, py, 62, "#ffffff", "#2a9d8f", 8)
    c.poly([(px - 42, py + 8), (px + 44, py - 8), (px - 38, py - 14)], "#2a9d8f")
    c.poly([(px - 6, py), (px - 30, py + 40), (px - 14, py + 40), (px + 20, py - 2)], "#2a9d8f")
    c.poly([(px - 6, py - 4), (px - 30, py - 42), (px - 14, py - 42), (px + 20, py - 6)], "#2a9d8f")
    c.text((565, 300), "frequent travel", 27, "#2b2d42", "lm")
    # briefcase
    c.rect(425, 385, 535, 465, "#8b5e3c", r=12)
    c.rect(458, 368, 502, 388, None, r=8, outline="#5a3b22", w=7)
    c.rect(425, 416, 535, 426, "#5a3b22")
    c.rect(471, 408, 489, 434, "#ffd23f", r=3)
    c.text((565, 425), "business trips", 27, "#2b2d42", "lm")
    c.text((400, 80), "ENTAIL = involve / require", 36, "#6c5ce7")
    c.save(OUTDIR + "/vocabulary-entail.webp")


def involve():
    c = C("#e6fbf4", "#cdf4e6")
    ground(c, 470, "#a7e3c8")
    # group circle (right)
    ppl = [(520, 430, "#ef476f", SKIN[0]), (690, 430, "#ffd166", SKIN[1]), (560, 500, "#06d6a0", SKIN[2]), (650, 500, "#118ab2", SKIN[3])]
    c.ell(430, 400, 780, 560, None, "#ffffff", 6)
    c.person(520, 480, 230, "#ef476f", skin=SKIN[0], hair="#3b2a20", armL=(-30, 12), armR=(4, 32), flip=True)
    c.person(700, 480, 230, "#ffd166", skin=SKIN[1], hair="#1b1b1b", flip=True, armR=(4, 32), armL=(-4, 32))
    c.person(610, 560, 230, "#06d6a0", skin=SKIN[2], hair="#1b1b1b", armL=(-24, 22), armR=(24, 22))
    # outsider (left) being pulled in
    c.person(330, 560, 270, "#7b2cbf", skin=SKIN[1], hair="#2a1a10", armR=(30, 10), armL=(-4, 32))
    c.arrow((60, 440), (190, 440), "#e63946", 8, 24)
    c.text((125, 405), "IN", 34, "#e63946")
    c.text((400, 80), "INVOLVE someone IN", 40, "#2b2d42")
    c.save(OUTDIR + "/vocabulary-involve.webp")


def residue():
    c = C("#f2f8e8", "#e3f0cf")
    c.rect(0, 470, W, H, "#cdb892")
    # apple
    ax, ay = 330, 320
    c.circ(ax - 40, ay, 105, "#e63946")
    c.circ(ax + 40, ay, 105, "#e63946")
    c.circ(ax, ay + 30, 112, "#e63946")
    c.poly([(ax, ay - 90), (ax - 8, ay - 90), (ax + 10, ay - 135), (ax + 20, ay - 135)], "#6b4226")
    c.ell(ax + 20, ay - 150, ax + 100, ay - 105, "#52b788")
    c.ell(ax - 80, ay - 80, ax - 40, ay - 20, "#ff7b86")
    # residue specks
    for x, y in [(300, 280), (350, 250), (400, 300), (280, 350), (360, 350), (430, 360), (320, 400), (390, 410), (260, 300), (440, 290)]:
        c.circ(x, y, 5, "#fffaf0")
    # magnifier
    mx, my, mr = 560, 330, 110
    c.line([(mx + 80, my + 80), (mx + 175, my + 175)], "#6b4226", 22)
    c.circ(mx, my, mr, "#fff9e6")
    c.circ(mx, my, mr, None, "#2b2d42", 14)
    for x, y, r in [(520, 300, 18), (590, 270, 14), (610, 350, 20), (540, 380, 13), (570, 320, 9), (500, 340, 8)]:
        c.circ(x, y, r, "#e9edf5", "#9aa5b1", 3)
    # spray bottle
    c.rect(90, 380, 170, 480, "#56a8f5", r=14)
    c.rect(110, 340, 150, 385, "#2b6cb0", r=6)
    c.poly([(110, 340), (110, 320), (60, 320), (60, 335), (90, 340)], "#2b6cb0")
    for k in range(4):
        c.circ(34 - k * 4, 318 + k * 14 - 10, 4, "#9fd4ff")
    c.text((130, 435), "CHEM", 18, "#ffffff")
    c.text((400, 80), "RESIDUE", 44, "#2b2d42")
    c.save(OUTDIR + "/vocabulary-residue.webp")


def screenplay():
    c = C("#2b2d42", "#3b3f5c")
    # clapperboard
    c.rect(90, 250, 390, 470, "#1a1b26", r=10, outline="#ffffff", w=4)
    c.poly([(80, 170), (400, 130), (415, 215), (90, 255)], "#1a1b26", "#ffffff")
    for k in range(5):
        x0 = 105 + k * 62
        c.poly([(x0, 166), (x0 + 36, 162), (x0 + 50, 205 + 0), (x0 + 14, 210)], "#ffffff")
    c.rect(90, 250, 390, 280, "#ffffff", r=4)
    for k in range(5):
        c.poly([(100 + k * 62, 250), (126 + k * 62, 250), (110 + k * 62, 280), (84 + k * 62, 280)], "#1a1b26") if False else None
    for y in (330, 380, 430):
        c.line([(120, y), (360, y)], "#8d99ae", 4, False)
    c.text((240, 265), "SCENE 1   TAKE 1", 18, "#1a1b26")
    # script pages
    c.rect(470, 120, 720, 480, "#fffdf5", r=8)
    c.rect(450, 140, 700, 500, "#f5f1e1", r=8, outline="#cfc8a8", w=2)
    c.text((575, 175), "SCREENPLAY", 24, "#2b2d42")
    c.text((575, 215), "INT. STUDIO - DAY", 17, "#8d99ae")
    for y in range(250, 460, 26):
        c.line([(490, y), (680, y)], "#c9c2a3", 3, False)
    for y in (250, 328):
        c.line([(540, y), (640, y)], "#2b2d42", 4, False)
    # pencil
    c.poly([(660, 420), (700, 380), (720, 400), (680, 440)], "#ffd23f")
    c.poly([(660, 420), (680, 440), (645, 455)], "#f4c9a3")
    c.poly([(646, 452), (653, 441), (659, 448)], "#2b2d42")
    # film strip
    c.rect(60, 505, 740, 570, "#111", r=6)
    for x in range(75, 740, 30):
        c.rect(x, 512, x + 14, 524, "#ffffff", r=2)
        c.rect(x, 552, x + 14, 564, "#ffffff", r=2)
    for x in range(90, 740, 120):
        c.rect(x, 528, x + 90, 548, "#444")
    c.save(OUTDIR + "/vocabulary-screenplay.webp")


def cellservice():
    c = C("#e9f4ff", "#cfe6ff")
    ground(c, 500, "#bfe0c4")
    # tower
    c.poly([(150, 500), (190, 500), (176, 200), (164, 200)], "#6b7280")
    for y in (260, 330, 400, 460):
        c.line([(160 + (y - 200) * 0.03, y), (180 - (y - 200) * 0.03, y)], "#6b7280", 5, False)
    c.circ(170, 190, 14, "#e63946")
    for r in (40, 75, 110):
        c.arc([170 - r, 190 - r, 170 + r, 190 + r], 300, 420, "#2a9d8f", 7)
        c.arc([170 - r, 190 - r, 170 + r, 190 + r], 120, 240, "#2a9d8f", 7)
    # phone
    c.rect(430, 70, 650, 520, "#1f2937", r=34)
    c.rect(445, 100, 635, 490, "#e8f1ff", r=16)
    c.rect(500, 82, 580, 92, "#4b5563", r=5)
    # bars
    for i in range(4):
        h = 40 + i * 36
        c.rect(476 + i * 36, 380 - h, 500 + i * 36, 380, "#2a9d8f", r=4)
    c.text((540, 135), "Cell service", 26, "#1f2937")
    c.text((540, 440), "5G", 56, "#2a9d8f")
    c.save(OUTDIR + "/vocabulary-cellservice.webp")


if __name__ == "__main__":
    names = sys.argv[2:]
    fns = {"planning": planning, "clock": clock, "joinforces": joinforces, "formally": formally, "assume": assume,
           "enterprising": enterprising, "excess": excess, "assuch": as_such, "undertaking": undertaking,
           "entail": entail, "involve": involve, "residue": residue, "screenplay": screenplay, "cellservice": cellservice}
    for n in (names or fns):
        fns[n]()
        print("drew", n)
