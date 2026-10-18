import { clone, NotebookElement, Op } from "../model";
import { hitsStroke } from "./eraser";
import { PageView, Pt, Rect, SVG_NS, Tool, ToolHost } from "./types";

export interface Selection {
  pageId: string;
  ids: Set<string>;
}

type Mode = "lasso" | "move" | "resize";

/** Chọn bằng lasso hoặc bấm vào phần tử, kéo để di chuyển, kéo góc để đổi kích thước */
export class LassoTool implements Tool {
  selection: Selection | null = null;
  private mode: Mode | null = null;
  private lassoPts: Pt[] = [];
  private lassoEl: SVGPolylineElement | null = null;
  private boxEl: SVGGElement | null = null;
  private start: Pt = { x: 0, y: 0 };
  private delta: Pt = { x: 0, y: 0 };

  constructor(private host: ToolHost, private onSelectionChange: () => void) {}

  down(pv: PageView, pt: Pt) {
    this.start = pt;
    this.delta = { x: 0, y: 0 };
    this.mode = null;

    if (this.selection?.pageId === pv.id) {
      const box = this.bounds(pv);
      const single = this.singleResizable(pv);
      if (box && single && Math.hypot(pt.x - (box.x + box.w), pt.y - (box.y + box.h)) <= this.handleRadius() * 1.6) {
        this.mode = "resize";
        return;
      }
      if (box && inside(pt, pad(box, this.host.pxToMm(4)))) {
        this.mode = "move";
        return;
      }
    }

    const hit = this.elementAt(pv, pt);
    if (hit) {
      this.select({ pageId: pv.id, ids: new Set([hit.id]) });
      this.mode = "move";
      return;
    }

    this.clear();
    this.mode = "lasso";
    this.lassoPts = [pt];
    this.lassoEl = document.createElementNS(SVG_NS, "polyline");
    this.lassoEl.setAttribute("class", "pn-lasso");
    pv.overlay.appendChild(this.lassoEl);
  }

  move(pv: PageView, pt: Pt) {
    if (this.mode === "lasso" && this.lassoEl) {
      this.lassoPts.push(pt);
      this.lassoEl.setAttribute("points", this.lassoPts.map((p) => `${p.x},${p.y}`).join(" "));
    } else if (this.mode === "move" && this.selection) {
      this.delta = this.snappedDelta(pt.x - this.start.x, pt.y - this.start.y);
      this.previewMove(pv);
    } else if (this.mode === "resize") {
      this.delta = { x: pt.x - this.start.x, y: pt.y - this.start.y };
      this.previewResize(pv);
    }
  }

  up(pv: PageView) {
    const mode = this.mode;
    this.mode = null;
    if (mode === "lasso") {
      this.lassoEl?.remove();
      this.lassoEl = null;
      const ids = this.idsInLasso(pv, this.lassoPts);
      this.lassoPts = [];
      if (ids.size > 0) this.select({ pageId: pv.id, ids });
      return;
    }
    if (mode === "move" && this.selection) {
      const { x: dx, y: dy } = this.delta;
      if (Math.abs(dx) + Math.abs(dy) < 0.1) {
        this.delta = { x: 0, y: 0 };
        this.previewMove(pv);
        return;
      }
      const ops: Op[] = [];
      for (const el of this.selectedElements()) {
        ops.push({ type: "updateElement", pageId: pv.id, element: translated(el, dx, dy) });
      }
      this.host.store.commit(ops);
      return;
    }
    if (mode === "resize") {
      const el = this.singleResizable(pv);
      if (el) this.host.store.commit([{ type: "updateElement", pageId: pv.id, element: this.resized(el) }]);
    }
  }

  deactivate() {
    this.lassoEl?.remove();
    this.lassoEl = null;
    this.clear();
  }

  // ---------- Selection ----------

  select(selection: Selection) {
    this.selection = selection;
    this.refresh();
    this.onSelectionChange();
  }

  clear() {
    const had = !!this.selection;
    this.selection = null;
    this.boxEl?.remove();
    this.boxEl = null;
    if (had) this.onSelectionChange();
  }

  selectedElements(): NotebookElement[] {
    if (!this.selection) return [];
    const page = this.host.store.page(this.selection.pageId);
    return page ? page.elements.filter((e) => this.selection!.ids.has(e.id)) : [];
  }

  /** Vẽ lại khung chọn sau khi dữ liệu thay đổi (undo, di chuyển…) */
  refresh() {
    this.boxEl?.remove();
    this.boxEl = null;
    if (!this.selection) return;
    const pv = this.host.pageView(this.selection.pageId);
    const page = this.host.store.page(this.selection.pageId);
    if (!pv || !page) return this.clear();
    for (const id of [...this.selection.ids]) {
      if (!page.elements.some((e) => e.id === id)) this.selection.ids.delete(id);
    }
    if (this.selection.ids.size === 0) return this.clear();
    this.drawBox(pv, this.bounds(pv)!);
  }

  deleteSelection() {
    if (!this.selection) return;
    const pageId = this.selection.pageId;
    const ops: Op[] = this.selectedElements().map((e) => ({ type: "removeElement", pageId, elementId: e.id }));
    this.clear();
    this.host.store.commit(ops);
  }

  setColor(color: string) {
    if (!this.selection) return;
    const pageId = this.selection.pageId;
    const ops: Op[] = [];
    for (const el of this.selectedElements()) {
      if (el.type === "image") continue;
      ops.push({ type: "updateElement", pageId, element: { ...clone(el), color } });
    }
    this.host.store.commit(ops);
  }

  // ---------- Helpers ----------

  /**
   * Nếu phần đang chọn có text box thì dịch cả nhóm sao cho text box đầu tiên
   * nằm ngay ngắn trên đường kẻ; nét bút, ảnh đi theo cùng độ dịch đó.
   */
  private snappedDelta(dx: number, dy: number) {
    const text = this.selectedElements().find((e) => e.type === "text");
    if (!text || text.type !== "text" || !this.selection) return { x: dx, y: dy };
    const p = this.host.snapText(this.selection.pageId, text, text.x + dx, text.y + dy);
    return { x: p.x - text.x, y: p.y - text.y };
  }

  private handleRadius() {
    return this.host.pxToMm(6);
  }

  private bounds(pv: PageView): Rect | null {
    const els = this.selectedElements();
    if (els.length === 0) return null;
    return union(els.map((e) => this.host.elementBounds(pv, e)));
  }

  private singleResizable(pv: PageView): NotebookElement | null {
    if (!this.selection || this.selection.ids.size !== 1 || this.selection.pageId !== pv.id) return null;
    const el = this.selectedElements()[0];
    return el && el.type !== "stroke" ? el : null;
  }

  private drawBox(pv: PageView, box: Rect) {
    this.boxEl?.remove();
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "pn-selection");
    const p = pad(box, this.host.pxToMm(3));
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(p.x));
    rect.setAttribute("y", String(p.y));
    rect.setAttribute("width", String(p.w));
    rect.setAttribute("height", String(p.h));
    rect.setAttribute("stroke-width", String(this.host.pxToMm(1.5)));
    rect.setAttribute("stroke-dasharray", `${this.host.pxToMm(5)} ${this.host.pxToMm(4)}`);
    g.appendChild(rect);
    if (this.singleResizable(pv)) {
      const handle = document.createElementNS(SVG_NS, "circle");
      handle.setAttribute("class", "pn-handle");
      handle.setAttribute("cx", String(box.x + box.w));
      handle.setAttribute("cy", String(box.y + box.h));
      handle.setAttribute("r", String(this.handleRadius()));
      handle.setAttribute("stroke-width", String(this.host.pxToMm(1.5)));
      g.appendChild(handle);
    }
    pv.overlay.appendChild(g);
    this.boxEl = g;
  }

  private previewMove(pv: PageView) {
    const { x: dx, y: dy } = this.delta;
    for (const id of this.selection!.ids) {
      pv.layers.root.querySelectorAll(`[data-id="${id}"]`).forEach((node) => {
        if (node instanceof SVGElement) node.setAttribute("transform", `translate(${dx} ${dy})`);
        else (node as HTMLElement).style.transform = `translate(${dx}mm, ${dy}mm)`;
      });
    }
    this.boxEl?.setAttribute("transform", `translate(${dx} ${dy})`);
  }

  private previewResize(pv: PageView) {
    const el = this.singleResizable(pv);
    if (!el) return;
    const next = this.resized(el);
    const node = pv.layers.root.querySelector(`[data-id="${el.id}"]`) as HTMLElement | null;
    if (node && next.type === "image") {
      node.style.maxWidth = `${next.w}mm`;
      node.style.height = `${next.h}mm`;
    } else if (node && next.type === "text") {
      node.style.width = `${next.w}mm`;
    }
    this.drawBox(pv, this.host.elementBounds(pv, next));
  }

  private resized(el: NotebookElement): NotebookElement {
    const next = clone(el);
    if (next.type === "image") {
      const ratio = next.h / next.w;
      next.w = Math.max(5, next.w + this.delta.x);
      next.h = next.w * ratio;
    } else if (next.type === "text") {
      next.w = Math.max(15, next.w + this.delta.x);
    }
    return next;
  }

  private elementAt(pv: PageView, pt: Pt): NotebookElement | null {
    const page = this.host.store.page(pv.id);
    if (!page) return null;
    const r = this.host.pxToMm(6);
    for (let i = page.elements.length - 1; i >= 0; i--) {
      const el = page.elements[i];
      if (el.type === "stroke" ? hitsStroke(el, pt, r) : inside(pt, this.host.elementBounds(pv, el))) return el;
    }
    return null;
  }

  private idsInLasso(pv: PageView, poly: Pt[]): Set<string> {
    const ids = new Set<string>();
    const page = this.host.store.page(pv.id);
    if (!page || poly.length < 3) return ids;
    for (const el of page.elements) {
      if (el.type === "stroke") {
        let n = 0;
        for (const [x, y] of el.points) if (inPolygon({ x, y }, poly)) n++;
        if (n > 0 && n >= el.points.length / 2) ids.add(el.id);
      } else {
        const b = this.host.elementBounds(pv, el);
        if (inPolygon({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, poly)) ids.add(el.id);
      }
    }
    return ids;
  }
}

export function translated(el: NotebookElement, dx: number, dy: number): NotebookElement {
  const next = clone(el);
  if (next.type === "stroke") next.points = next.points.map(([x, y, p]) => [x + dx, y + dy, p]);
  else {
    next.x += dx;
    next.y += dy;
  }
  return next;
}

function inside(pt: Pt, r: Rect) {
  return pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
}

function pad(r: Rect, d: number): Rect {
  return { x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d };
}

function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

function inPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
