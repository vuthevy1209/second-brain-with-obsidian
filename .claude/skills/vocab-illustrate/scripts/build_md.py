"""Build the vocabulary note from a JSON card list, one `> [!vocab]` callout per card.
Usage: python3 build_md.py cards.json OUTPUT.md [--title "# Lần 1"] [--header-image "name.webp"]
cards.json: [{"img": "vocabulary-x.webp", "head": "word or <ruby>..</ruby>", "body": "markdown"}, ...]

The callout is rendered as a 2-column card (image left, word + meaning right) by the
vocab-flashcard plugin (.obsidian/plugins/vocab-flashcard/styles.css); no Multi-Column plugin needed.
"""
import json, re, sys

args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
cards = json.load(open(args[0]))
out_path = args[1]


def callout(card):
    lines = [f"> [!vocab] {card['head'].strip()}"]
    body = re.sub(r"\n{3,}", "\n\n", card.get("body", "").strip())
    if card.get("img"):
        lines.append(f"> ![[{card['img']}]]")
        # The blank `>` line keeps the image in its own paragraph: the plugin CSS moves
        # the first paragraph holding only an image into the left column.
        if body:
            lines.append(">")
    for line in body.split("\n") if body else []:
        lines.append(f"> {line}" if line.strip() else ">")
    return "\n".join(lines)


out = [opt("--title", "# Lần 1"), ""]
if opt("--header-image"):
    out += [f"![[{opt('--header-image')}]]", ""]
# One blank line between callouts is enough; without it the next card would merge into this one.
out += ["\n\n".join(callout(c) for c in cards)]
open(out_path, "w").write("\n".join(out).rstrip("\n") + "\n")
print(len(cards), "cards ->", out_path)
