import { clone, newId, NotebookStore, PAGE_W, TextElement } from "../model";
import { positionText } from "../render/page";
import { paperRhythm, textLineHeight } from "../render/templates";
import { PageView, Pt, Tool, ToolHost } from "./types";

const DRAG_THRESHOLD_PX = 4;

/**
 * Bấm vào chỗ trống: tạo text box. Bấm vào text box có sẵn: sửa.
 * Nhấn giữ text box rồi kéo: di chuyển, thả ra thì chữ tự hít vào đường kẻ gần nhất.
 */
export class TextTool implements Tool {
  private drag: { pv: PageView; el: TextElement; start: Pt; to: Pt; moved: boolean; node: HTMLElement | null } | null = null;

  constructor(private host: ToolHost) {}

  down(pv: PageView, pt: Pt) {
    const el = this.host.textAt(pv, pt);
    if (!el) {
      this.host.editText(pv, null, pt);
      return;
    }
    const node = pv.layers.texts.querySelector(`.pn-text[data-id="${el.id}"]`) as HTMLElement | null;
    this.drag = { pv, el, start: pt, to: { x: el.x, y: el.y }, moved: false, node };
  }

  move(pv: PageView, pt: Pt) {
    const d = this.drag;
    if (!d) return;
    const dx = pt.x - d.start.x;
    const dy = pt.y - d.start.y;
    if (!d.moved && Math.hypot(dx, dy) < this.host.pxToMm(DRAG_THRESHOLD_PX)) return;
    d.moved = true;
    d.to = this.host.snapText(d.pv.id, d.el, d.el.x + dx, d.el.y + dy);
    if (d.node) {
      d.node.addClass("pn-dragging");
      d.node.style.transform = `translate(${d.to.x - d.el.x}mm, ${d.to.y - d.el.y}mm)`;
    }
  }

  up() {
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    d.node?.removeClass("pn-dragging");
    if (!d.moved) {
      this.host.editText(d.pv, d.el.id);
      return;
    }
    if (d.to.x === d.el.x && d.to.y === d.el.y) {
      if (d.node) d.node.style.transform = "";
      return;
    }
    this.host.store.commit([{ type: "updateElement", pageId: d.pv.id, element: { ...clone(d.el), x: d.to.x, y: d.to.y } }]);
  }

  deactivate() {
    if (this.drag?.node) {
      this.drag.node.style.transform = "";
      this.drag.node.removeClass("pn-dragging");
    }
    this.drag = null;
  }
}

/** Textarea đè lên đúng vị trí text box, cùng font/cỡ chữ để gõ thấy như trên giấy */
export class TextEditor {
  private textarea: HTMLTextAreaElement;
  private done = false;

  constructor(
    private store: NotebookStore,
    private pv: PageView,
    private element: TextElement,
    private isNew: boolean,
    private onClose: () => void
  ) {
    this.textarea = pv.layers.texts.createEl("textarea", { cls: "pn-text-editor" });
    const template = store.page(pv.id)?.template ?? "blank";
    positionText(this.textarea, element, textLineHeight(element.fontSize, paperRhythm(template)));
    this.textarea.value = element.md;
    this.textarea.spellcheck = false;
    this.textarea.addEventListener("input", () => this.autosize());
    // Ô gõ co giãn theo chữ (field-sizing); trình duyệt cũ thì giữ rộng tối đa, chỉ giãn chiều cao
    if (!CSS.supports("field-sizing", "content")) this.textarea.style.width = this.textarea.style.maxWidth;
    this.textarea.addEventListener("blur", () => this.finish());
    this.textarea.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        this.textarea.blur();
      }
    });
    this.textarea.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    this.autosize();
    window.setTimeout(() => this.textarea.focus(), 0);
  }

  get elementId() {
    return this.element.id;
  }

  static create(
    store: NotebookStore,
    pv: PageView,
    at: Pt,
    opts: { color: string; fontSize: number },
    /** Đặt hộp chữ mới lên đường kẻ gần chỗ bấm */
    place: (el: TextElement) => Pt,
    onClose: () => void
  ) {
    const x = Math.max(5, Math.min(at.x, PAGE_W - 30));
    const element: TextElement = {
      id: newId(),
      type: "text",
      x,
      // Đặt dòng đầu tiên ngay dưới con trỏ
      y: Math.max(0, at.y - (opts.fontSize * 0.3528 * 1.45) / 2),
      // Chiều rộng tối đa tới gần mép phải trang; hộp thực tế co theo nội dung
      w: PAGE_W - x - 5,
      fontSize: opts.fontSize,
      color: opts.color,
      md: "",
    };
    const p = place(element);
    element.x = p.x;
    element.y = p.y;
    element.w = Math.max(15, PAGE_W - p.x - 5);
    return new TextEditor(store, pv, element, true, onClose);
  }

  private autosize() {
    if (CSS.supports("field-sizing", "content")) return;
    this.textarea.style.height = "auto";
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }

  finish() {
    if (this.done) return;
    this.done = true;
    const md = this.textarea.value.replace(/\s+$/, "");
    this.textarea.remove();
    this.onClose();
    const pageId = this.pv.id;
    if (this.isNew) {
      if (md.trim()) this.store.commit([{ type: "addElement", pageId, element: { ...this.element, md } }]);
    } else if (!md.trim()) {
      this.store.commit([{ type: "removeElement", pageId, elementId: this.element.id }]);
    } else if (md !== this.element.md) {
      this.store.commit([{ type: "updateElement", pageId, element: { ...this.element, md } }]);
    }
  }
}
