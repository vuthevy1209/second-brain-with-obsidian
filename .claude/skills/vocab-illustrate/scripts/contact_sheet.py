"""Ghép các ảnh xem trước thành lưới 2 cột để Read kiểm tra một lần.
Usage: python3 contact_sheet.py <thư mục ảnh> <ảnh ra.png> [tên1 tên2 ...]   (tên không cần đuôi; bỏ trống = tất cả .png)
"""
import os, sys
from PIL import Image, ImageDraw

d, out = sys.argv[1], sys.argv[2]
names = sys.argv[3:] or sorted(f[:-4] for f in os.listdir(d) if f.endswith(".png"))
tw, th, cols = 600, 450, 2
g = Image.new("RGB", (cols * tw, ((len(names) + cols - 1) // cols) * (th + 20)), "white")
dr = ImageDraw.Draw(g)
for i, n in enumerate(names):
    path = os.path.join(d, n if n.endswith(".png") else n + ".png")
    im = Image.open(path).convert("RGB")
    im.thumbnail((tw, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 20)
    g.paste(im, (x, y))
    dr.text((x + 5, y + th + 4), n, fill="black")
g.save(out)
print(len(names), "ảnh ->", out)
