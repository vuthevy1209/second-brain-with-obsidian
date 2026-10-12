"""Convert chosen candidates to webp in the assets folder and record credits.
Usage: python3 commons_pick.py WORKDIR ASSETS_DIR slug:index [slug:index ...]
Writes ASSETS_DIR/vocabulary-<slug>.webp and appends to WORKDIR/credits.json.
"""
import json, os, sys
from PIL import Image

work, assets, picks = sys.argv[1], sys.argv[2], sys.argv[3:]
cred_path = os.path.join(work, "credits.json")
credits = json.load(open(cred_path)) if os.path.exists(cred_path) else []
for pk in picks:
    slug, idx = pk.rsplit(":", 1)
    meta = json.load(open(f"{work}/candidates/{slug}/meta.json"))
    m = next(x for x in meta if x["i"] == int(idx))
    im = Image.open(m["path"]).convert("RGB")
    im.save(os.path.join(assets, f"vocabulary-{slug}.webp"), "WEBP", quality=82)
    credits.append({"slug": slug, "file": m["title"], "license": m["license"]})
    print(slug, m["title"], m["license"], im.size)
json.dump(credits, open(cred_path, "w"), indent=1, ensure_ascii=False)
