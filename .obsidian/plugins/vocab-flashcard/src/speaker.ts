import { Plugin, setIcon } from "obsidian";
import { speak } from "./pronounce";

/**
 * Gắn nút loa ở góc trên bên phải thẻ `> [!vocab]` khi note được hiển thị (Reading và Live Preview):
 * bấm vào là đọc từ tiếng Anh của thẻ (bỏ phần đọc lái trong <rt>).
 */
export function registerCardSpeaker(plugin: Plugin) {
  plugin.registerMarkdownPostProcessor((el) => {
    const callouts = el.matches('.callout[data-callout="vocab"]')
      ? [el]
      : Array.from(el.querySelectorAll<HTMLElement>('.callout[data-callout="vocab"]'));
    for (const callout of callouts) addSpeaker(callout);
  });
}

function addSpeaker(callout: HTMLElement) {
  const title = callout.querySelector<HTMLElement>(":scope > .callout-title .callout-title-inner");
  if (!title || callout.querySelector(":scope > .vf-card-speak")) return;
  const word = cardWord(title);
  if (!word) return;

  const btn = callout.createEl("button", {
    cls: "vf-card-speak clickable-icon",
    attr: { "aria-label": `Nghe "${word}"`, type: "button" },
  });
  setIcon(btn, "volume-2");
  // Live Preview: chặn mousedown để bấm nút không chuyển khối callout sang chế độ sửa
  btn.addEventListener("mousedown", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  });
  btn.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    speak(word);
  });
}

/** Chữ tiếng Anh trong tiêu đề, bỏ phần đọc lái <rt> */
function cardWord(title: HTMLElement): string {
  const clone = title.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("rt, rp, .vf-card-speak").forEach((n) => n.remove());
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}
