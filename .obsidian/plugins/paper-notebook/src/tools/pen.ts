import { InkPoint, newId, PAGE_H, PAGE_W, StrokeElement } from "../model";
import { HIGHLIGHTER_OPACITY, strokePathData } from "../render/ink";
import { PageView, Pt, RulerEdgeMm, SVG_NS, Tool, ToolHost } from "./types";

/** Nét chạm mép thước trong khoảng này (px màn hình) thì bị ép đi theo mép */
const RULER_CATCH_PX = 10;
/** Kéo bút ra xa mép thước quá khoảng này (px) thì nét được vẽ tự do trở lại */
const RULER_RELEASE_PX = 28;

/** Bút bi và bút highlight. Nét đang viết vẽ ở overlay, nhấc bút mới lưu vào trang. */
export class PenTool implements Tool {
  private points: InkPoint[] = [];
  private live: SVGPathElement | null = null;
  private realPressure = false;
  /** Hai mép thước (mm) lúc bắt đầu nét; thước không đổi chỗ trong lúc đang vẽ */
  private edges: RulerEdgeMm[] = [];
  /** Mép thước nét đang bám theo, null = vẽ tự do */
  private lock: RulerEdgeMm | null = null;

  constructor(private host: ToolHost, private kind: StrokeElement["tool"]) {}

  private get opts() {
    return this.host.options[this.kind];
  }

  down(pv: PageView, pt: Pt, e: PointerEvent) {
    this.realPressure = e.pointerType === "pen" && e.pressure > 0;
    this.edges = this.host.rulerEdges(pv, this.opts.size);
    this.lock = null;
    this.points = [this.point(pt, e)];
    this.live = document.createElementNS(SVG_NS, "path");
    this.live.setAttribute("fill", this.opts.color);
    if (this.kind === "highlighter") this.live.setAttribute("fill-opacity", String(HIGHLIGHTER_OPACITY));
    pv.overlay.appendChild(this.live);
    this.redraw(false);
  }

  move(pv: PageView, pt: Pt, e: PointerEvent) {
    if (!this.live) return;
    this.points.push(this.point(pt, e));
    this.redraw(false);
  }

  up(pv: PageView) {
    if (!this.live) return;
    this.live.remove();
    this.live = null;
    if (this.points.length === 0) return;
    const element: StrokeElement = {
      id: newId(),
      type: "stroke",
      tool: this.kind,
      color: this.opts.color,
      size: this.opts.size,
      realPressure: this.realPressure,
      points: this.points,
    };
    this.points = [];
    this.host.store.commit([{ type: "addElement", pageId: pv.id, element }]);
  }

  deactivate() {
    this.live?.remove();
    this.live = null;
    this.points = [];
  }

  private point(pt: Pt, e: PointerEvent): InkPoint {
    pt = this.followRuler(pt);
    // Nét không vượt ra ngoài mép giấy
    const x = Math.max(0, Math.min(PAGE_W, pt.x));
    const y = Math.max(0, Math.min(PAGE_H, pt.y));
    return [x, y, this.realPressure ? e.pressure : 0.5];
  }

  /**
   * Như thước thật: bút vẽ từ hướng nào tới, hễ chạm mép thước (hoặc lấn vào thân
   * thước) là trượt thẳng dọc theo mép; kéo bút ra xa hẳn thì vẽ tự do tiếp.
   */
  private followRuler(pt: Pt): Pt {
    if (this.edges.length === 0) return pt;
    const measure = (e: RulerEdgeMm) => {
      const vx = pt.x - e.p0.x;
      const vy = pt.y - e.p0.y;
      return { along: vx * e.dir.x + vy * e.dir.y, out: vx * e.outward.x + vy * e.outward.y };
    };
    if (this.lock) {
      const { along, out } = measure(this.lock);
      const release = this.host.pxToMm(RULER_RELEASE_PX);
      // Đầu thước (extend) kẻ được dài ra ngoài thước nên chỉ thả khi kéo xa khỏi đường
      if (out > release || (!this.lock.extend && Math.abs(along) > this.lock.half + release)) this.lock = null;
    }
    if (!this.lock) {
      const katch = this.host.pxToMm(RULER_CATCH_PX);
      let best: { edge: RulerEdgeMm; out: number } | null = null;
      for (const edge of this.edges) {
        const { along, out } = measure(edge);
        // Sát mép từ bên ngoài, hoặc đã lấn vào thân thước (không được vẽ xuyên qua thước)
        const touching = out <= katch && out >= -(edge.thickness + katch) && Math.abs(along) <= edge.half + katch;
        if (touching && (!best || out > best.out)) best = { edge, out };
      }
      if (best) this.lock = best.edge;
    }
    if (!this.lock) return pt;
    const { along } = measure(this.lock);
    const t = this.lock.extend ? along : Math.max(-this.lock.half, Math.min(this.lock.half, along));
    return { x: this.lock.p0.x + this.lock.dir.x * t, y: this.lock.p0.y + this.lock.dir.y * t };
  }

  private redraw(complete: boolean) {
    this.live?.setAttribute("d", strokePathData(this.points, this.kind, this.opts.size, this.realPressure, complete));
  }
}
