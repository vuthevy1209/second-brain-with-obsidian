// Kích thước trang A4 tính bằng mm — mọi toạ độ trong notebook đều dùng đơn vị này
export const PAGE_W = 210;
export const PAGE_H = 297;

export type Template = "blank" | "lined" | "grid" | "dot";
export const TEMPLATES: { id: Template; label: string }[] = [
  { id: "blank", label: "Giấy trắng" },
  { id: "lined", label: "Kẻ ngang" },
  { id: "grid", label: "Ô vuông" },
  { id: "dot", label: "Chấm" },
];

/** Một điểm của nét bút: [x mm, y mm, lực nhấn 0..1] */
export type InkPoint = [number, number, number];

export interface StrokeElement {
  id: string;
  type: "stroke";
  tool: "pen" | "highlighter";
  color: string;
  /** Độ dày nét, mm */
  size: number;
  /** true khi nét vẽ bằng bút có cảm ứng lực, false thì giả lập lực theo tốc độ */
  realPressure: boolean;
  points: InkPoint[];
}

export interface TextElement {
  id: string;
  type: "text";
  x: number;
  y: number;
  /** Chiều rộng hộp chữ, mm. Chiều cao tự giãn theo nội dung */
  w: number;
  /** Cỡ chữ, pt */
  fontSize: number;
  color: string;
  md: string;
}

export interface ImageElement {
  id: string;
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Đường dẫn file ảnh trong vault */
  src: string;
}

export type NotebookElement = StrokeElement | TextElement | ImageElement;

export interface Page {
  id: string;
  template: Template;
  elements: NotebookElement[];
}

export interface NotebookDoc {
  version: 1;
  pages: Page[];
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newPage(template: Template): Page {
  return { id: newId(), template, elements: [] };
}

export function newDoc(template: Template): NotebookDoc {
  return { version: 1, pages: [newPage(template)] };
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// ---------- Operations ----------
// Mọi thay đổi trên notebook đều là một operation. Undo/redo dựa vào đây,
// và sau này iPad gửi realtime qua socket cũng chỉ cần gửi cùng loại operation.

export type Op =
  | { type: "addPage"; index: number; page: Page }
  | { type: "removePage"; index: number }
  | { type: "movePage"; from: number; to: number }
  | { type: "setTemplate"; pageId: string; template: Template }
  | { type: "addElement"; pageId: string; element: NotebookElement; index?: number }
  | { type: "removeElement"; pageId: string; elementId: string }
  | { type: "updateElement"; pageId: string; element: NotebookElement };

export interface Change {
  /** Trang có nội dung thay đổi */
  pages: Set<string>;
  /** Danh sách trang thay đổi (thêm/xoá/đổi thứ tự) */
  structure: boolean;
}

interface HistoryEntry {
  ops: Op[];
  inverse: Op[];
}

const HISTORY_LIMIT = 200;

export class NotebookStore {
  doc: NotebookDoc;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private listeners: ((change: Change) => void)[] = [];

  constructor(doc: NotebookDoc) {
    this.doc = doc;
  }

  load(doc: NotebookDoc) {
    this.doc = doc;
    this.undoStack = [];
    this.redoStack = [];
  }

  onChange(listener: (change: Change) => void) {
    this.listeners.push(listener);
  }

  page(pageId: string): Page | undefined {
    return this.doc.pages.find((p) => p.id === pageId);
  }

  pageIndex(pageId: string): number {
    return this.doc.pages.findIndex((p) => p.id === pageId);
  }

  element(pageId: string, elementId: string): NotebookElement | undefined {
    return this.page(pageId)?.elements.find((e) => e.id === elementId);
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  /** Áp dụng một nhóm operation như một bước undo */
  commit(ops: Op[]) {
    if (ops.length === 0) return;
    const change: Change = { pages: new Set(), structure: false };
    const inverse = this.applyAll(ops, change);
    this.undoStack.push({ ops, inverse });
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
    this.emit(change);
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;
    const change: Change = { pages: new Set(), structure: false };
    this.applyAll(entry.inverse, change);
    this.redoStack.push(entry);
    this.emit(change);
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return;
    const change: Change = { pages: new Set(), structure: false };
    entry.inverse = this.applyAll(entry.ops, change);
    this.undoStack.push(entry);
    this.emit(change);
  }

  private applyAll(ops: Op[], change: Change): Op[] {
    const inverse: Op[] = [];
    for (const op of ops) {
      const inv = this.apply(op, change);
      if (inv) inverse.unshift(inv);
    }
    return inverse;
  }

  private emit(change: Change) {
    for (const l of this.listeners) l(change);
  }

  /** Áp dụng một operation, trả về operation ngược lại để undo */
  private apply(op: Op, change: Change): Op | null {
    const pages = this.doc.pages;
    switch (op.type) {
      case "addPage": {
        const index = Math.max(0, Math.min(op.index, pages.length));
        pages.splice(index, 0, clone(op.page));
        change.structure = true;
        return { type: "removePage", index };
      }
      case "removePage": {
        if (pages.length <= 1) return null; // luôn giữ ít nhất một trang
        const [page] = pages.splice(op.index, 1);
        if (!page) return null;
        change.structure = true;
        return { type: "addPage", index: op.index, page };
      }
      case "movePage": {
        const [page] = pages.splice(op.from, 1);
        if (!page) return null;
        pages.splice(op.to, 0, page);
        change.structure = true;
        return { type: "movePage", from: op.to, to: op.from };
      }
      case "setTemplate": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const prev = page.template;
        page.template = op.template;
        change.pages.add(page.id);
        change.structure = true; // thumbnail và toolbar cần cập nhật
        return { type: "setTemplate", pageId: page.id, template: prev };
      }
      case "addElement": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const index = op.index ?? page.elements.length;
        page.elements.splice(index, 0, clone(op.element));
        change.pages.add(page.id);
        return { type: "removeElement", pageId: page.id, elementId: op.element.id };
      }
      case "removeElement": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const index = page.elements.findIndex((e) => e.id === op.elementId);
        if (index < 0) return null;
        const [element] = page.elements.splice(index, 1);
        change.pages.add(page.id);
        return { type: "addElement", pageId: page.id, element, index };
      }
      case "updateElement": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const index = page.elements.findIndex((e) => e.id === op.element.id);
        if (index < 0) return null;
        const prev = page.elements[index];
        page.elements[index] = clone(op.element);
        change.pages.add(page.id);
        return { type: "updateElement", pageId: page.id, element: prev };
      }
    }
  }
}
