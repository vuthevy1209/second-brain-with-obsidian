"""Build the multi-column vocabulary note from a JSON card list.
Usage: python3 build_md.py cards.json OUTPUT.md [--title "# Lần 1"] [--header-image "name.webp"]
cards.json: [{"img": "vocabulary-x.webp", "head": "word or <ruby>..</ruby>", "body": "markdown"}, ...]
"""
import json, random, string, sys

args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
cards = json.load(open(args[0]))
out_path = args[1]
random.seed(1209)
ids = set()


def rid():
    while True:
        i = "ID_" + "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(4))
        if i not in ids:
            ids.add(i)
            return i


out = [opt("--title", "# Lần 1"), ""]
if opt("--header-image"):
    out += [f"![[{opt('--header-image')}]]", ""]
out += [""]
for c in cards:
    out += [f"--- start-multi-column: {rid()}", "```column-settings", "Number of Columns: 2",
            "Largest Column: standard", "```", "", f"![[{c['img']}]]" if c.get("img") else "", "",
            "--- column-break ---", "", f"## {c['head']}", "", c["body"], "", "--- end-multi-column"] + [""] * 8
open(out_path, "w").write("\n".join(out).rstrip("\n") + "\n")
print(len(cards), "cards ->", out_path)
