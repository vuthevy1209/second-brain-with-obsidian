import { PAGE_H, PAGE_W, Template } from "../model";

// Nền giấy vẽ bằng một <path> duy nhất cho mỗi loại (không dùng <pattern>),
// để màn hình và PDF đều là vector và giống hệt nhau.

const LINE_GAP = 8; // khoảng cách dòng kẻ ngang, mm
const LINE_TOP = 28;
const MARGIN_X = 25;
const GRID_GAP = 5;
const DOT_GAP = 5;

/**
 * Nhịp dòng của từng loại giấy, dùng để đặt chữ ngay ngắn trên đường kẻ:
 * chiều cao mỗi dòng chữ là bội số của `gap`, chân chữ (baseline) nằm trên
 * đường kẻ, cách đường kẻ `inset` mm. Giấy trắng không có nhịp.
 */
export interface PaperRhythm {
  /** Khoảng cách giữa hai đường kẻ, mm */
  gap: number;
  /** Toạ độ y của một đường kẻ bất kỳ (các đường còn lại cách nhau `gap`) */
  first: number;
  /** Chân chữ nằm cao hơn đường kẻ bao nhiêu mm */
  inset: number;
  /** Bắt mép trái chữ theo lưới (ô vuông, chấm) */
  snapX?: number;
  /** Đường lề đỏ của giấy kẻ ngang: kéo chữ tới gần thì dính vào ngay sau lề */
  marginX?: number;
}

export function paperRhythm(template: Template): PaperRhythm | null {
  switch (template) {
    case "lined":
      return { gap: LINE_GAP, first: LINE_TOP, inset: 1.2, marginX: MARGIN_X };
    case "grid":
      return { gap: GRID_GAP, first: GRID_GAP, inset: 0.9, snapX: GRID_GAP };
    case "dot":
      return { gap: DOT_GAP, first: DOT_GAP, inset: 0.9, snapX: DOT_GAP };
    default:
      return null;
  }
}

/** Chiều cao một dòng chữ (mm) để khớp nhịp giấy; null = giấy trắng, dùng line-height thường */
export function textLineHeight(fontSizePt: number, rhythm: PaperRhythm | null): number | null {
  if (!rhythm) return null;
  const needed = fontSizePt * 0.3528 * 1.1; // pt → mm, chừa chút khoảng thở
  return rhythm.gap * Math.max(1, Math.ceil(needed / rhythm.gap - 1e-6));
}

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function templateSvg(template: Template): string {
  const parts: string[] = [`<rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>`];
  if (template === "lined") {
    let d = "";
    for (let y = LINE_TOP; y < PAGE_H - 16; y += LINE_GAP) d += `M0 ${fmt(y)}H${PAGE_W}`;
    parts.push(`<path d="${d}" stroke="#c5d3e6" stroke-width="0.2" fill="none"/>`);
    parts.push(`<path d="M${MARGIN_X} 0V${PAGE_H}" stroke="#eba5a5" stroke-width="0.25" fill="none"/>`);
  } else if (template === "grid") {
    let d = "";
    for (let x = GRID_GAP; x < PAGE_W; x += GRID_GAP) d += `M${fmt(x)} 0V${PAGE_H}`;
    for (let y = GRID_GAP; y < PAGE_H; y += GRID_GAP) d += `M0 ${fmt(y)}H${PAGE_W}`;
    parts.push(`<path d="${d}" stroke="#dbe3ec" stroke-width="0.15" fill="none"/>`);
  } else if (template === "dot") {
    // Mỗi chấm là một đoạn dài 0 với đầu tròn
    let d = "";
    for (let y = DOT_GAP; y < PAGE_H; y += DOT_GAP) {
      for (let x = DOT_GAP; x < PAGE_W; x += DOT_GAP) d += `M${fmt(x)} ${fmt(y)}h0.01`;
    }
    parts.push(`<path d="${d}" stroke="#aeb8c4" stroke-width="0.6" stroke-linecap="round" fill="none"/>`);
  }
  return parts.join("");
}
