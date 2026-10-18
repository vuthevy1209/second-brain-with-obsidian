import { PAGE_H, PAGE_W, Template, TEMPLATES } from "../model";
import { templateSvg } from "../render/templates";

// Hộp thoại chọn loại giấy, dựng bằng DOM chuẩn của trình duyệt — không dùng
// bất cứ API nào của Obsidian — để trang web cho iPad sau này dùng lại được.

export interface PaperPickerOptions {
  title: string;
  /** Loại giấy đánh dấu sẵn; null = không chọn sẵn, để người dùng tự chọn */
  current: Template | null;
  /** Nhãn gắn lên loại giấy `current`, ví dụ "Đang dùng" */
  badge?: string;
  onPick(template: Template): void;
  onClose?(): void;
}

export interface PaperPickerHandle {
  close(): void;
}

// Icon "x" của lucide
const CLOSE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = cls;
  parent?.appendChild(node);
  return node;
}

/** Mở hộp thoại phủ lên `container` (khung notebook) */
export function openPaperPicker(container: HTMLElement, opts: PaperPickerOptions): PaperPickerHandle {
  const backdrop = el("div", "pn-picker-backdrop");
  const dialog = el("div", "pn-picker", backdrop);
  dialog.tabIndex = -1;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", opts.title);

  const header = el("div", "pn-picker-header", dialog);
  el("div", "pn-picker-title", header).textContent = opts.title;
  const closeBtn = el("button", "pn-picker-close", header);
  closeBtn.setAttribute("aria-label", "Đóng");
  closeBtn.innerHTML = CLOSE_ICON;

  const grid = el("div", "pn-template-grid", dialog);
  const cards: HTMLButtonElement[] = [];
  for (const t of TEMPLATES) {
    const card = el("button", "pn-template-card", grid);
    card.setAttribute("aria-label", t.label);
    const preview = el("div", "pn-template-preview", card);
    preview.innerHTML = `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" preserveAspectRatio="none">${templateSvg(t.id)}</svg>`;
    el("div", "pn-template-name", card).textContent = t.label;
    if (t.id === opts.current) {
      card.classList.add("is-current");
      if (opts.badge) preview.setAttribute("data-badge", opts.badge);
    }
    card.addEventListener("click", () => pick(t.id));
    cards.push(card);
  }

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.remove();
    opts.onClose?.();
  };
  const pick = (template: Template) => {
    close();
    opts.onPick(template);
  };

  closeBtn.addEventListener("click", close);
  // Bấm ra vùng nền mờ thì đóng
  backdrop.addEventListener("pointerdown", (e) => {
    if (e.target === backdrop) close();
    e.stopPropagation();
  });

  // Mũi tên để chuyển, Enter để chọn (nút tự xử lý), Esc để đóng
  backdrop.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = cards.indexOf(document.activeElement as HTMLButtonElement);
    const next = i < 0 ? (dir > 0 ? 0 : cards.length - 1) : (i + dir + cards.length) % cards.length;
    cards[next].focus();
  });

  container.appendChild(backdrop);
  // Đợi một frame để transition mở chạy
  requestAnimationFrame(() => backdrop.classList.add("is-open"));
  const start = TEMPLATES.findIndex((t) => t.id === opts.current);
  (start >= 0 ? cards[start] : dialog).focus({ preventScroll: true });

  return { close };
}
