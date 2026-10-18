import { InkPoint } from "./model";

// Lưu điểm nét bút gọn trong file: x, y làm tròn tới 0.01mm, lực nhấn tới 0.01,
// mỗi điểm chỉ ghi phần chênh lệch so với điểm trước.
const XY_SCALE = 100;
const P_SCALE = 100;

export function encodePoints(points: InkPoint[]): string {
  const out: number[] = [];
  let px = 0;
  let py = 0;
  let pp = 0;
  for (const [x, y, p] of points) {
    const qx = Math.round(x * XY_SCALE);
    const qy = Math.round(y * XY_SCALE);
    const qp = Math.round(p * P_SCALE);
    out.push(qx - px, qy - py, qp - pp);
    px = qx;
    py = qy;
    pp = qp;
  }
  return out.join(",");
}

export function decodePoints(encoded: string): InkPoint[] {
  if (!encoded) return [];
  const nums = encoded.split(",").map(Number);
  const points: InkPoint[] = [];
  let x = 0;
  let y = 0;
  let p = 0;
  for (let i = 0; i + 2 < nums.length; i += 3) {
    x += nums[i];
    y += nums[i + 1];
    p += nums[i + 2];
    points.push([x / XY_SCALE, y / XY_SCALE, p / P_SCALE]);
  }
  return points;
}
