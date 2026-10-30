import { Plugin } from "obsidian";
import { POS_LIST } from "./parser";

/** Tên đầy đủ hiện trên nhãn loại từ */
const POS_NAMES: Record<string, string> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  prep: "preposition",
  conj: "conjunction",
  pron: "pronoun",
  det: "determiner",
  "phr v": "phrasal verb",
  phr: "phrase",
  idiom: "idiom",
};

const META_RE = new RegExp(`^\\((${POS_LIST.join("|")})\\)\\s*(\\/[^/\\n]+\\/)?$`);

/**
 * Dòng meta `(n) /ipa/` của thẻ `> [!vocab]` → nhãn loại từ có màu + IPA, nằm riêng một hàng
 * trên dòng nghĩa (Reading và Live Preview). Note giữ nguyên markdown gốc.
 */
export function registerCardMeta(plugin: Plugin) {
  plugin.registerMarkdownPostProcessor((el) => {
    const callouts = el.matches('.callout[data-callout="vocab"]')
      ? [el]
      : Array.from(el.querySelectorAll<HTMLElement>('.callout[data-callout="vocab"]'));
    for (const callout of callouts) decorateMeta(callout);
  });
}

function decorateMeta(callout: HTMLElement) {
  const content = callout.querySelector<HTMLElement>(":scope > .callout-content");
  if (!content || content.querySelector(":scope > .vf-meta")) return;
  for (const p of Array.from(content.querySelectorAll<HTMLElement>(":scope > p"))) {
    const first = p.firstChild;
    const match = first?.nodeType === Node.TEXT_NODE ? first.textContent?.trim().match(META_RE) : null;
    if (!match) continue;

    const meta = createDiv({ cls: "vf-meta" });
    meta.createSpan({ cls: "vf-pos", text: POS_NAMES[match[1]], attr: { "data-pos": match[1] } });
    if (match[2]) meta.createSpan({ cls: "vf-ipa", text: match[2] });
    content.insertBefore(meta, p);

    // Bỏ dòng meta khỏi đoạn, kể cả <br> ngăn nó với dòng nghĩa
    first!.remove();
    while (p.firstChild?.nodeName === "BR" || (p.firstChild?.nodeType === Node.TEXT_NODE && !p.firstChild.textContent?.trim())) {
      p.firstChild.remove();
    }
    if (!p.hasChildNodes()) p.remove();
    return;
  }
}
