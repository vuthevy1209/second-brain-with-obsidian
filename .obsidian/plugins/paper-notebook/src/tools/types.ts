import { App } from "obsidian";
import { NotebookElement, NotebookStore, TextElement } from "../model";
import { PageLayers } from "../render/page";

export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export type ToolId = "pointer" | "hand" | "pen" | "highlighter" | "eraser" | "lasso" | "text";

export interface PageView {
  id: string;
  /** Khối chứa trang + nhãn số trang */
  item: HTMLElement;
  /** Khung có kích thước bằng trang sau khi zoom */
  wrap: HTMLElement;
  layers: PageLayers;
  /** Lớp trên cùng để vẽ nét đang viết, khung chọn… — không xuất ra PDF */
  overlay: SVGSVGElement;
}

export interface InkOptions {
  color: string;
  size: number;
}

export interface ToolOptions {
  pen: InkOptions;
  highlighter: InkOptions;
  text: { color: string; fontSize: number };
  /** Bán kính cục tẩy, pixel màn hình */
  eraser: { size: number };
}

/** Những gì view cung cấp cho các công cụ */
export interface ToolHost {
  app: App;
  store: NotebookStore;
  options: ToolOptions;
  /** Phần tử đang tạm ẩn trên trang (đang bị tẩy, đang sửa chữ…) */
  hiddenOn(pageId: string): Set<string>;
  rerender(pageId: string): void;
  pageView(pageId: string): PageView | undefined;
  elementBounds(pv: PageView, el: NotebookElement): Rect;
  /** Quy đổi n pixel màn hình sang mm ở mức zoom hiện tại */
  pxToMm(px: number): number;
  editText(pv: PageView, elementId: string | null, at?: Pt): void;
  /** Text box nằm dưới điểm pt (nếu có) */
  textAt(pv: PageView, pt: Pt): TextElement | null;
  /** Vị trí gần (x, y) nhất mà chữ nằm ngay ngắn trên đường kẻ / lưới của trang */
  snapText(pageId: string, el: TextElement, x: number, y: number): Pt;
  /**
   * Hai mép thước đổi sang mm của trang (rỗng khi không bật thước). p0 đã lùi ra
   * ngoài nửa độ dày nét để nét nằm sát mép, không đè lên thân thước.
   */
  rulerEdges(pv: PageView, strokeSize: number): RulerEdgeMm[];
}

export interface RulerEdgeMm {
  /** Điểm giữa mép */
  p0: Pt;
  /** Hướng dọc mép (vector đơn vị) */
  dir: Pt;
  /** Pháp tuyến hướng ra ngoài thân thước */
  outward: Pt;
  /** Nửa chiều dài thước, mm */
  half: number;
  /** Thân thước nằm sâu bao nhiêu mm phía sau mép này */
  thickness: number;
  /** Mép ở đầu thước: đường kẻ vuông góc, kéo dài ra ngoài thước */
  extend: boolean;
}

export interface Tool {
  down(pv: PageView, pt: Pt, e: PointerEvent): void;
  move?(pv: PageView, pt: Pt, e: PointerEvent): void;
  up?(pv: PageView, pt: Pt, e: PointerEvent): void;
  /** Gọi khi đổi sang công cụ khác */
  deactivate?(): void;
}

export const SVG_NS = "http://www.w3.org/2000/svg";
