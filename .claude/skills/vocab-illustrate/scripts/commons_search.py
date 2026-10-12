"""Search Wikimedia Commons for photos and build one contact sheet per query.
Usage: python3 commons_search.py WORKDIR slug "query" [slug "query" ...]
Output: WORKDIR/candidates/<slug>/<i>.<ext> (960px), meta.json, and WORKDIR/candidates/<slug>_sheet.jpg (labelled #i).
Runs serially with backoff because Commons returns HTTP 429 when hit in parallel.
"""
import json, os, sys, time, urllib.parse, urllib.request
from PIL import Image, ImageDraw

UA = {"User-Agent": "ObsidianVocabBot/1.0 (personal study notes)"}


def get(url, timeout=40, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except Exception as e:
            if k == tries - 1:
                raise
            time.sleep(12 if "429" in str(e) else 3)


def search(q, n=8):
    p = {"action": "query", "format": "json", "generator": "search", "gsrnamespace": "6",
         "gsrsearch": q + " filetype:bitmap", "gsrlimit": str(n), "prop": "imageinfo",
         "iiprop": "url|mime|extmetadata", "iiurlwidth": "960"}
    d = json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p)))
    pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda x: x["index"])
    return [(pg["title"], pg["imageinfo"][0].get("thumburl"), pg["imageinfo"][0]["mime"],
             pg["imageinfo"][0].get("extmetadata", {}).get("LicenseShortName", {}).get("value", "?")) for pg in pages]


def run(work, slug, q):
    d = os.path.join(work, "candidates", slug)
    os.makedirs(d, exist_ok=True)
    meta = []
    for i, (t, u, m, lic) in enumerate(search(q)):
        try:
            p = os.path.join(d, "%d.%s" % (i, "jpg" if "jpeg" in m else m.split("/")[-1]))
            open(p, "wb").write(get(u))
            meta.append({"i": i, "path": p, "title": t, "license": lic})
        except Exception:
            pass
    json.dump(meta, open(os.path.join(d, "meta.json"), "w"), indent=1, ensure_ascii=False)
    W, H, cols = 300, 220, 4
    sheet = Image.new("RGB", (W * cols, H * max(1, (len(meta) + cols - 1) // cols)), "white")
    dr = ImageDraw.Draw(sheet)
    for k, m in enumerate(meta):
        try:
            im = Image.open(m["path"]).convert("RGB")
            im.thumbnail((W - 6, H - 22))
            x, y = (k % cols) * W, (k // cols) * H
            sheet.paste(im, (x + 3, y + 3))
            dr.text((x + 5, y + H - 18), "#%d %s" % (m["i"], m["title"][5:40]), fill="red")
        except Exception:
            pass
    sheet.save(os.path.join(work, "candidates", slug + "_sheet.jpg"), quality=80)
    return len(meta)


if __name__ == "__main__":
    work, rest = sys.argv[1], sys.argv[2:]
    for slug, q in zip(rest[::2], rest[1::2]):
        print(slug, run(work, slug, q), "candidates", flush=True)
        time.sleep(4)
