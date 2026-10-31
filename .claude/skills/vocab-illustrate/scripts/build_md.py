"""Build the vocabulary note from a JSON card list, one `> [!vocab]` callout per card.
Usage: python3 build_md.py cards.json OUTPUT.md [--title "# Lần 1"] [--header-image "name.webp"]

cards.json (one object per card, in the order of the source note):
  [{"word": "hastily", "reading": "hây(s) tờ ly", "pos": "adv", "ipa": "ˈheɪstəli",
    "meaning": "một cách hấp tấp, vội vàng",
    "details": ["- Trang trọng hơn *quickly*, hay mang ý chê: làm vội nên dễ sai.",
                "EX He hastily signed the contract. || Anh ấy **vội vàng** ký hợp đồng."],
    "img": "vocabulary-hastily.webp"}, ...]
  word, pos, meaning are required. reading and ipa are required for a single word and left
  out for a multi-word entry (phrase or sentence: the word contains a space). details
  (markdown string or list of lines) and img are optional. pos must be one of POS below.
  `/.../` around ipa and `==...==` around meaning are added by the script.
  A details line "EX English || Tiếng Việt" becomes an example: a nested `[!example]`
  callout with the English sentence as its title and the Vietnamese translation below.

Output per card:
  > [!vocab] <ruby>hastily<rt>hây(s) tờ ly</rt></ruby>     (phrase: plain "> [!vocab] look into")
  > ![[vocabulary-hastily.webp]]
  >
  > (adv) /ˈheɪstəli/                                       (phrase: "> (phr v)")
  > ==một cách hấp tấp, vội vàng==
  >
  > - Trang trọng hơn *quickly*, hay mang ý chê: làm vội nên dễ sai.
  >
  > > [!example] He hastily signed the contract.
  > > Anh ấy **vội vàng** ký hợp đồng.

Old cards {"img", "head", "body"} are still accepted and written as-is (head = title,
body = markdown), with a warning, since they skip the pos/ipa/reading checks.
The script exits with an error listing every invalid card and writes nothing.

The callout is rendered as a 2-column card (image left, word + meaning right) by the
vocab-flashcard plugin (.obsidian/plugins/vocab-flashcard/styles.css); no Multi-Column plugin needed.
"""
import json, re, sys

POS = ["n", "v", "adj", "adv", "prep", "conj", "pron", "det", "phr v", "phr", "idiom"]
FIELDS = ["word", "reading", "pos", "ipa", "meaning"]
# Letters that only Vietnamese uses (đ, ă, â, ê, ô, ơ, ư, ã, ĩ, ũ, ả, ạ, ...); accents that
# English loanwords also use ("café", "à la carte") stay allowed.
VIETNAMESE = re.compile(r"[đĐăĂâÂêÊôÔơƠưƯãÃĩĨũŨẠ-ỹ]")


def is_phrase(word):
    """Multi-word entries (phrases, sentences) get no ruby reading and no IPA."""
    return " " in word.strip()


def clean(card):
    """Normalize the new-format fields in place and return (problems, notes)."""
    for k in FIELDS:
        card[k] = str(card.get(k) or "").strip()
    card["pos"] = re.sub(r"\s+", " ", card["pos"].strip("()").strip().rstrip("."))
    card["ipa"] = card["ipa"].strip("/").strip()
    card["meaning"] = re.sub(r"^==|==$", "", card["meaning"]).strip()

    notes = []
    required = ["word", "pos", "meaning"]
    if is_phrase(card["word"]):
        if card["reading"] or card["ipa"]:
            notes.append("cụm nhiều từ: bỏ reading/ipa")
        card["reading"] = card["ipa"] = ""
    else:
        required += ["reading", "ipa"]

    problems = [f"thiếu {k}" for k in required if not card[k]]
    if card["pos"] and card["pos"] not in POS:
        problems.append(f"pos '{card['pos']}' không thuộc {', '.join(POS)}")
    if ":" in card["word"] or VIETNAMESE.search(card["word"]) or "<" in card["word"]:
        problems.append("word chỉ được chứa từ tiếng Anh (không nghĩa, không ':', không thẻ HTML)")
    if "." in card["ipa"]:
        problems.append("ipa không được có dấu chấm tách âm tiết")
    if "\n" in card["meaning"] or "==" in card["meaning"]:
        problems.append("meaning phải là 1 dòng, không chứa '=='")
    if repeats_meaning(card["meaning"], details_lines(card)):
        problems.append("details lặp lại nghĩa chính: details chỉ để giải thích ngữ cảnh + ví dụ")
    return problems, notes


def repeats_meaning(meaning, details):
    """True when details copy the meaning line as a `==highlight==` (the old
    "==nghĩa== - nghĩa phụ" layout). Example translations may still contain the meaning."""
    plain = lambda s: re.sub(r"\*\*|<[^>]+>|[“”\"]", "", s).strip().lower()
    m = plain(meaning)
    highlights = (plain(h) for h in re.findall(r"==([^=]+)==", "\n".join(details)))
    return bool(m) and any(h and (h in m or m in h) for h in highlights)


def details_lines(card):
    details = card.get("details") or ""
    if isinstance(details, list):
        details = "\n".join(details)
    lines = []
    for line in details.strip().split("\n"):
        example = re.match(r"\s*EX\s+(.+?)\s*\|\|\s*(.+)", line)
        if example:
            # Each example is its own nested [!example] callout (English title, translation
            # body); the plugin's "Gõ nâng cao" mode reads examples from this marker
            lines += ["", f"> [!example] {example[1]}", f"> {example[2]}"]
        else:
            lines.append(line.rstrip())
    details = re.sub(r"\n{3,}", "\n\n", "\n".join(lines).strip())
    return details.split("\n") if details else []


def quote(lines):
    return [f"> {line}" if line.strip() else ">" for line in lines]


def title(card):
    if is_phrase(card["word"]):
        return card["word"]
    return f"<ruby>{card['word']}<rt>{card['reading']}</rt></ruby>"


def callout(card):
    if "word" not in card:
        return legacy_callout(card)
    lines = [f"> [!vocab] {title(card)}"]
    if card.get("img"):
        # The blank `>` line keeps the image in its own paragraph: the plugin CSS moves
        # the first paragraph holding only an image into the left column.
        lines += [f"> ![[{card['img']}]]", ">"]
    meta = f"({card['pos']}) /{card['ipa']}/" if card["ipa"] else f"({card['pos']})"
    lines += [f"> {meta}", f"> =={card['meaning']}=="]
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


def check(cards):
    """Validate every card; exit listing all problems, or return the warnings."""
    errors, warnings = [], []
    for i, card in enumerate(cards, 1):
        if "word" in card:
            problems, notes = clean(card)
            if problems:
                errors.append(f"  #{i} {card['word'] or '?'}: " + "; ".join(problems))
            warnings += [f"#{i} {card['word']}: {n}" for n in notes]
        elif "head" in card:
            warnings.append(f"#{i} {card['head']}: thẻ kiểu cũ head/body (không kiểm tra pos/ipa/reading)")
        else:
            errors.append(f"  #{i}: không có word (hoặc head kiểu cũ)")
    if errors:
        sys.exit(f"{len(errors)} thẻ không hợp lệ, chưa ghi file:\n" + "\n".join(errors))
    return warnings


if __name__ == "__main__":
    args = sys.argv[1:]
    opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
    cards = json.load(open(args[0]))
    for w in check(cards):
        print("Cảnh báo:", w, file=sys.stderr)

    out = [opt("--title", "# Lần 1"), ""]
    if opt("--header-image"):
        out += [f"![[{opt('--header-image')}]]", ""]
    # One blank line between callouts is enough; without it the next card would merge into this one.
    out += ["\n\n".join(callout(c) for c in cards)]
    open(args[1], "w").write("\n".join(out).rstrip("\n") + "\n")
    print(len(cards), "cards ->", args[1])
