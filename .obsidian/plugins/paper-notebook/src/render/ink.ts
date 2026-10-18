import getStroke from "perfect-freehand";
import { InkPoint, StrokeElement } from "../model";

export const HIGHLIGHTER_OPACITY = 0.35;

// perfect-freehand có vài hằng số tính theo pixel (chạm một điểm thì tự thêm điểm
// lệch 1 đơn vị, bỏ qua các điểm trong 3 đơn vị cuối nét…). Toạ độ notebook là mm,
// nên tính nét ở thang 0.1mm rồi chia lại — không thì chạm nhẹ thành vết mực to.
const INK_SCALE = 10;

/** Dựng outline của nét bút (polygon) rồi chuyển thành path SVG */
export function strokePathData(
  points: InkPoint[],
  tool: StrokeElement["tool"],
  size: number,
  realPressure: boolean,
  complete = true
): string {
  if (points.length === 0) return "";
  const scaled = points.map(([x, y, p]) => [x * INK_SCALE, y * INK_SCALE, p]);
  const outline = getStroke(scaled, {
    size: size * INK_SCALE,
    thinning: tool === "highlighter" ? 0 : realPressure ? 0.6 : 0.45,
    smoothing: 0.5,
    streamline: 0.4,
    simulatePressure: tool !== "highlighter" && !realPressure,
    start: { cap: true, taper: false },
    end: { cap: true, taper: false },
    last: complete,
  });
  return outlineToPath(outline.map(([x, y]) => [x / INK_SCALE, y / INK_SCALE]));
}

function outlineToPath(points: number[][]): string {
  const len = points.length;
  if (len < 4) return "";
  const r = (n: number) => Math.round(n * 1000) / 1000;
  let a = points[0];
  let b = points[1];
  const c = points[2];
  let d = `M${r(a[0])},${r(a[1])} Q${r(b[0])},${r(b[1])} ${r((b[0] + c[0]) / 2)},${r((b[1] + c[1]) / 2)} T`;
  for (let i = 2; i < len - 1; i++) {
    a = points[i];
    b = points[i + 1];
    d += `${r((a[0] + b[0]) / 2)},${r((a[1] + b[1]) / 2)} `;
  }
  return d + "Z";
}

export function strokeSvg(el: StrokeElement): string {
  const d = strokePathData(el.points, el.tool, el.size, el.realPressure);
  const opacity = el.tool === "highlighter" ? ` fill-opacity="${HIGHLIGHTER_OPACITY}"` : "";
  return `<path data-id="${el.id}" d="${d}" fill="${escapeAttr(el.color)}"${opacity}/>`;
}

export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Khung bao của nét bút, mm */
export function strokeBounds(el: StrokeElement) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of el.points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const pad = el.size / 2;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + el.size, h: maxY - minY + el.size };
}
