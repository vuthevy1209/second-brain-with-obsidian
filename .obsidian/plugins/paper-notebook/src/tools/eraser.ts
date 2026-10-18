import { Op, StrokeElement } from "../model";
import { PageView, Pt, SVG_NS, Tool, ToolHost } from "./types";

/** Tẩy theo nét: chạm vào nét nào thì xoá cả nét đó */
export class EraserTool implements Tool {
  private erased = new Set<string>();
  private last: Pt | null = null;
  private cursor: SVGCircleElement | null = null;
  private pageId: string | null = null;

  constructor(private host: ToolHost) {}

  down(pv: PageView, pt: Pt) {
    this.pageId = pv.id;
    this.erased.clear();
    this.last = pt;
    this.cursor = document.createElementNS(SVG_NS, "circle");
    this.cursor.setAttribute("class", "pn-eraser-cursor");
    pv.overlay.appendChild(this.cursor);
    this.eraseAt(pv, pt);
  }

  move(pv: PageView, pt: Pt) {
    if (!this.last) return;
    // Lấy thêm điểm ở giữa để kéo nhanh không bỏ sót nét
    const step = this.radius() / 2;
    const dist = Math.hypot(pt.x - this.last.x, pt.y - this.last.y);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) {
      this.eraseAt(pv, {
        x: this.last.x + ((pt.x - this.last.x) * i) / n,
        y: this.last.y + ((pt.y - this.last.y) * i) / n,
      });
    }
    this.last = pt;
  }

  up(pv: PageView) {
    this.cursor?.remove();
    this.cursor = null;
    this.last = null;
    const hidden = this.host.hiddenOn(pv.id);
    const ops: Op[] = [];
    for (const id of this.erased) {
      hidden.delete(id);
      ops.push({ type: "removeElement", pageId: pv.id, elementId: id });
    }
    this.erased.clear();
    if (ops.length) this.host.store.commit(ops);
  }

  deactivate() {
    this.cursor?.remove();
    this.cursor = null;
    if (this.pageId) {
      const hidden = this.host.hiddenOn(this.pageId);
      for (const id of this.erased) hidden.delete(id);
      this.host.rerender(this.pageId);
    }
    this.erased.clear();
  }

  private radius() {
    return this.host.pxToMm(this.host.options.eraser.size);
  }

  private eraseAt(pv: PageView, pt: Pt) {
    const r = this.radius();
    this.cursor?.setAttribute("cx", String(pt.x));
    this.cursor?.setAttribute("cy", String(pt.y));
    this.cursor?.setAttribute("r", String(r));
    const page = this.host.store.page(pv.id);
    if (!page) return;
    let changed = false;
    for (const el of page.elements) {
      if (el.type !== "stroke" || this.erased.has(el.id)) continue;
      if (hitsStroke(el, pt, r)) {
        this.erased.add(el.id);
        this.host.hiddenOn(pv.id).add(el.id);
        changed = true;
      }
    }
    if (changed) this.host.rerender(pv.id);
  }
}

export function hitsStroke(el: StrokeElement, pt: Pt, r: number): boolean {
  const limit = r + el.size / 2;
  const pts = el.points;
  if (pts.length === 1) return Math.hypot(pts[0][0] - pt.x, pts[0][1] - pt.y) <= limit;
  for (let i = 1; i < pts.length; i++) {
    if (distToSegment(pt, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]) <= limit) return true;
  }
  return false;
}

function distToSegment(p: Pt, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p.x - ax) * dx + (p.y - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (ax + t * dx), p.y - (ay + t * dy));
}
