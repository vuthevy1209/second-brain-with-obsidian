"""Build the vocabulary note from a JSON card list, one `> [!vocab]` callout per card.
Usage: python3 build_md.py cards.json OUTPUT.md [--title "# Lần 1"] [--header-image "name.webp"]

cards.json (one object per card, in the order of the source note):
  [{"word": "hastily", "reading": "hây(s) tờ ly", "pos": "adv", "ipa": "ˈheɪstəli",
    "meaning": "một cách hấp tấp, vội vàng", "details": "- Học từ của haste",
    "img": "vocabulary-hastily.webp"}, ...]
  word, reading, pos, ipa, meaning are required; details (markdown string or list of lines)
  and img are optional. pos must be one of POS below. `/.../` around ipa and `==...==`
  around meaning are added by the script (and stripped if you already wrote them).

Output per card:
  > [!vocab] <ruby>hastily<rt>hây(s) tờ ly</rt></ruby>
  > ![[vocabulary-hastily.webp]]
  >
  > (adv) /ˈheɪstəli/
  > ==một cách hấp tấp, vội vàng==
  >
  > - Học từ của haste

Old cards {"img", "head", "body"} are still accepted and written as-is (head = title,
body = markdown), with a warning, since they skip the pos/ipa/reading checks.
The script exits with an error listing every invalid card and writes nothing.

The callout is rendered as a 2-column card (image left, word + meaning right) by the
vocab-flashcard plugin (.obsidian/plugins/vocab-flashcard/styles.css); no Multi-Column plugin needed.
"""
import json, re, sys

POS = ["n", "v", "adj", "adv", "prep", "conj", "pron", "det", "phr v", "phr", "idiom"]
REQUIRED = ["word", "reading", "pos", "ipa", "meaning"]
# Letters that only Vietnamese uses (đ, ă, â, ê, ô, ơ, ư, ã, ĩ, ũ, ả, ạ, ...); accents that
# English loanwords also use ("café", "à la carte") stay allowed.
VIETNAMESE = re.compile(r"[đĐăĂâÂêÊôÔơƠưƯãÃĩĨũŨẠ-ỹ]")

args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
cards = json.load(open(args[0]))
out_path = args[1]


def clean(card):
    """Normalize the new-format fields in place and return the list of problems."""
    for k in REQUIRED:
        card[k] = str(card.get(k) or "").strip()
    card["pos"] = re.sub(r"\s+", " ", card["pos"].strip("()").strip().rstrip("."))
    card["ipa"] = card["ipa"].strip("/").strip()
    card["meaning"] = re.sub(r"^==|==$", "", card["meaning"]).strip()

    problems = [f"thiếu {k}" for k in REQUIRED if not card[k]]
    if card["pos"] and card["pos"] not in POS:
        problems.append(f"pos '{card['pos']}' không thuộc {', '.join(POS)}")
    if ":" in card["word"] or VIETNAMESE.search(card["word"]) or "<" in card["word"]:
        problems.append("word chỉ được chứa từ tiếng Anh (không nghĩa, không ':', không thẻ HTML)")
    if "." in card["ipa"]:
        problems.append("ipa không được có dấu chấm tách âm tiết")
    if "\n" in card["meaning"] or "==" in card["meaning"]:
        problems.append("meaning phải là 1 dòng, không chứa '=='")
    return problems


def details_lines(card):
    details = card.get("details") or ""
    if isinstance(details, list):
        details = "\n".join(details)
    details = re.sub(r"\n{3,}", "\n\n", details.strip())
    return details.split("\n") if details else []


def quote(lines):
    return [f"> {line}" if line.strip() else ">" for line in lines]


def callout(card):
    if "word" not in card:
        return legacy_callout(card)
    lines = [f"> [!vocab] <ruby>{card['word']}<rt>{card['reading']}</rt></ruby>"]
    if card.get("img"):
        # The blank `>` line keeps the image in its own paragraph: the plugin CSS moves
        # the first paragraph holding only an image into the left column.
        lines += [f"> ![[{card['img']}]]", ">"]
    lines += [f"> ({card['pos']}) /{card['ipa']}/", f"> =={card['meaning']}=="]
    details = details_lines(card)
    if details:
        lines += [">"] + quote(details)
    return "\n".join(lines)


def legacy_callout(card):
    lines = [f"> [!vocab] {card['head'].strip()}"]
    body = re.sub(r"\n{3,}", "\n\n", card.get("body", "").strip())
    if card.get("img"):
        lines.append(f"> ![[{card['img']}]]")
        if body:
            lines.append(">")
    lines += quote(body.split("\n")) if body else []
    return "\n".join(lines)


errors, legacy = [], []
for i, card in enumerate(cards, 1):
    if "word" in card:
        problems = clean(card)
        if problems:
            errors.append(f"  #{i} {card['word'] or '?'}: " + "; ".join(problems))
    elif "head" in card:
        legacy.append(f"#{i} {card['head']}")
    else:
        errors.append(f"  #{i}: không có word (hoặc head kiểu cũ)")
if errors:
    sys.exit(f"{len(errors)} thẻ không hợp lệ, chưa ghi file:\n" + "\n".join(errors))
if legacy:
    print(f"Cảnh báo: {len(legacy)} thẻ kiểu cũ head/body (không kiểm tra pos/ipa/reading): "
          + ", ".join(legacy), file=sys.stderr)

out = [opt("--title", "# Lần 1"), ""]
if opt("--header-image"):
    out += [f"![[{opt('--header-image')}]]", ""]
# One blank line between callouts is enough; without it the next card would merge into this one.
out += ["\n\n".join(callout(c) for c in cards)]
open(out_path, "w").write("\n".join(out).rstrip("\n") + "\n")
print(len(cards), "cards ->", out_path)
