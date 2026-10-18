// Thước kẻ nổi trên vùng xem (giống Freeform / Notability):
// - kéo thân thước để di chuyển, kéo núm ở hai đầu (hoặc lăn chuột trên thước) để xoay
// - nét bút bắt đầu sát mép thước sẽ bị ép thành đường thẳng dọc theo mép
// - bấm đúp vào thước để "đóng dấu" một đường thẳng dọc theo mép gần chỗ bấm
// Dựng bằng DOM thuần, không dùng API của Obsidian, để sau này dùng lại trên iPad.

const SVG_NS = "http://www.w3.org/2000/svg";
const HEIGHT = 64; // px trên màn hình
const SNAP_TOLERANCE = 12; // px: bắt đầu nét trong khoảng này quanh mép thì bám thước
const ANGLE_SNAP = 2; // độ: gần bội số của 15° thì hít nhẹ vào
const ROTATE_SMOOTHING_MS = 45; // càng nhỏ thì thước bám tay càng sát
// Vùng rê chuột để hiện nút xoay: từ 50px bên trong đầu thước tới 55px ra ngoài
// (vừa đủ phủ nút xoay), rộng hơn bề dày thước 16px mỗi bên
const HANDLE_REVEAL_INSIDE = 50;
const HANDLE_REVEAL_OUTSIDE = 55;
const HANDLE_REVEAL_SIDE = 16;

// Icon "reload-outline" của Ionicons 5 (react-icons: IoReloadOutline)
const ROTATE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M400 148l-21.12-24.57A191.43 191.43 0 00240 64C134 64 48 150 48 256s86 192 192 192a192.09 192.09 0 00181.07-128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"/><path d="M464 68.45V220a4 4 0 01-4 4H308.45a4 4 0 01-2.83-6.83L457.17 65.62a4 4 0 016.83 2.83z" fill="currentColor"/></svg>';

type Vec = { x: number; y: number };

/** Một mép thước, toạ độ client (px màn hình) */
export interface RulerEdge {
  /** Điểm giữa mép */
  center: Vec;
  /** Hướng dọc theo mép (vector đơn vị) */
  dir: Vec;
  /** Pháp tuyến hướng ra ngoài thân thước (vector đơn vị) */
  outward: Vec;
  /** Nửa chiều dài đoạn mép, px */
  half: number;
  /** Thân thước nằm sâu bao nhiêu px phía sau mép này */
  depth: number;
  /**
   * Mép ở hai đầu thước (cạnh ngắn): kẻ được đường vuông góc với thước và kéo dài
   * ra ngoài thước, không bị giới hạn trong chiều dài của mép
   */
  extend: boolean;
}

export interface RulerOptions {
  /** Số px màn hình trên 1mm giấy ở mức zoom hiện tại */
  pxPerMm(): number;
  /** Bấm đúp vào thước: đóng dấu đường thẳng dọc theo mép này */
  onStamp(edge: RulerEdge): void;
  /** Lăn chuột trên thước: chuyển cho vùng xem trang xử lý (cuộn hoặc zoom) */
  onWheel(e: WheelEvent): void;
}

export class Ruler {
  readonly el: HTMLDivElement;
  visible = false;
  private ticks: SVGSVGElement;
  private cx = 0;
  private cy = 0;
  /** Góc đang hiển thị (độ, không giới hạn 0–360 để xoay qua mốc 0° không bị giật) */
  private angle = 0;
  /** Góc tay người dùng đang kéo tới; góc hiển thị đuổi theo bằng animation */
  private target = 0;
  private frame: number | null = null;
  private lastFrame = 0;
  private length = 600;
  private placed = false;
  private gesture: { mode: "move" | "rotate"; pointerId: number; dx: number; dy: number; offset: number } | null = null;

  constructor(private stage: HTMLElement, private opts: RulerOptions) {
    this.el = document.createElement("div");
    this.el.className = "pn-ruler";
    this.ticks = document.createElementNS(SVG_NS, "svg");
    this.ticks.setAttribute("class", "pn-ruler-ticks");
    this.el.append(this.ticks);
    for (const side of ["start", "end"]) {
      const handle = document.createElement("div");
      handle.className = `pn-ruler-handle pn-ruler-handle-${side}`;
      handle.title = "Kéo để xoay thước";
      handle.innerHTML = ROTATE_ICON;
      this.el.appendChild(handle);
    }

    this.el.addEventListener("pointerdown", (e) => this.onDown(e));
    // Theo dõi chuột trên cả vùng xem (không chỉ trên thước) để hiện nút xoay khi lại gần đầu thước,
    // không cần thêm phần tử vô hình nào chặn nét vẽ
    stage.addEventListener("pointermove", (e) => this.revealHandles(e));
    stage.addEventListener("pointerleave", () => {
      if (!this.gesture) this.el.classList.remove("near-start", "near-end");
    });
    this.el.addEventListener("dblclick", (e) => {
      e.preventDefault();
      if ((e.target as HTMLElement).closest(".pn-ruler-handle")) return; // bấm đúp nút xoay không kẻ đường
      const edge = this.nearestEdge(e.clientX, e.clientY);
      if (edge) this.opts.onStamp(edge);
    });
    // Lăn chuột trên thước không xoay thước (chỉ xoay bằng nút ở hai đầu) mà cuộn / zoom
    // trang bên dưới như bình thường, vì thước nằm ngoài vùng cuộn nên phải chuyển tiếp
    this.el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.opts.onWheel(e);
      },
      { passive: false }
    );
  }

  toggle() {
    this.setVisible(!this.visible);
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible) {
      this.el.remove();
      return;
    }
    this.stage.appendChild(this.el);
    this.layout();
  }

  /** Gọi khi zoom hoặc kích thước vùng xem đổi */
  layout() {
    if (!this.visible) return;
    const w = this.stage.clientWidth;
    const h = this.stage.clientHeight;
    // Tab đang bị ẩn (chuyển sang tab khác) thì vùng xem có kích thước 0:
    // không đụng tới vị trí / chiều dài, để quay lại thước vẫn nằm y chỗ cũ
    if (w === 0 || h === 0) return;
    if (!this.placed) {
      // Lần đầu: nằm ngang giữa vùng xem; chiều dài cố định từ đây về sau
      this.length = Math.max(240, Math.min(w * 0.8, 1400));
      this.cx = w / 2;
      this.cy = h / 2;
      this.placed = true;
    }
    // Chỉ kéo thước vào lại khi vùng xem bị thu nhỏ tới mức tâm thước nằm ngoài
    this.cx = Math.max(0, Math.min(this.cx, w));
    this.cy = Math.max(0, Math.min(this.cy, h));
    this.el.style.width = `${this.length}px`;
    this.el.style.height = `${HEIGHT}px`;
    this.drawTicks();
    this.applyTransform();
  }

  /** Mép thước gần điểm (client) trong khoảng bắt dính, nếu có */
  edgeNear(clientX: number, clientY: number): RulerEdge | null {
    if (!this.visible) return null;
    for (const edge of this.edges()) {
      const vx = clientX - edge.center.x;
      const vy = clientY - edge.center.y;
      const along = vx * edge.dir.x + vy * edge.dir.y;
      const out = vx * edge.outward.x + vy * edge.outward.y;
      if (Math.abs(along) <= edge.half + SNAP_TOLERANCE && out >= -SNAP_TOLERANCE && out <= SNAP_TOLERANCE) return edge;
    }
    return null;
  }

  private nearestEdge(clientX: number, clientY: number): RulerEdge | null {
    // Bấm đúp chỉ kẻ dọc theo cạnh dài
    const edges = this.edges().filter((e) => !e.extend);
    const dist = (edge: RulerEdge) =>
      Math.abs((clientX - edge.center.x) * edge.outward.x + (clientY - edge.center.y) * edge.outward.y);
    return edges.sort((a, b) => dist(a) - dist(b))[0] ?? null;
  }

  /** Hai mép thước (toạ độ client), rỗng khi thước đang ẩn */
  currentEdges(): RulerEdge[] {
    return this.visible ? this.edges() : [];
  }

  private edges(): RulerEdge[] {
    const rect = this.stage.getBoundingClientRect();
    const rad = (this.angle * Math.PI) / 180;
    const dir = { x: Math.cos(rad), y: Math.sin(rad) };
    const normal = { x: -dir.y, y: dir.x }; // hướng "xuống" trong hệ toạ độ của thước
    const c = { x: rect.left + this.cx, y: rect.top + this.cy };
    const h = HEIGHT / 2;
    const half = this.length / 2;
    const back = { x: -dir.x, y: -dir.y };
    return [
      // Hai cạnh dài: kẻ đường song song với thước
      { center: { x: c.x - normal.x * h, y: c.y - normal.y * h }, dir, outward: { x: -normal.x, y: -normal.y }, half, depth: HEIGHT, extend: false },
      { center: { x: c.x + normal.x * h, y: c.y + normal.y * h }, dir, outward: normal, half, depth: HEIGHT, extend: false },
      // Hai đầu thước: kẻ đường vuông góc với thước
      { center: { x: c.x - dir.x * half, y: c.y - dir.y * half }, dir: normal, outward: back, half: h, depth: this.length, extend: true },
      { center: { x: c.x + dir.x * half, y: c.y + dir.y * half }, dir: normal, outward: dir, half: h, depth: this.length, extend: true },
    ];
  }

  /** Đặt góc đích; thước xoay mượt tới đó qua requestAnimationFrame */
  private rotateTo(deg: number, magnet = true) {
    let a = deg;
    if (magnet) {
      const nearest = Math.round(a / 15) * 15;
      if (Math.abs(a - nearest) < ANGLE_SNAP) a = nearest;
    }
    this.target = a;
    if (this.frame === null) {
      this.lastFrame = performance.now();
      this.frame = requestAnimationFrame((t) => this.animate(t));
    }
  }

  private animate(now: number) {
    const dt = Math.min(64, now - this.lastFrame);
    this.lastFrame = now;
    const diff = this.target - this.angle;
    // Đuổi theo góc đích theo hàm mũ: mượt, không giật dù chuột nhảy cóc
    this.angle = Math.abs(diff) < 0.02 ? this.target : this.angle + diff * (1 - Math.exp(-dt / ROTATE_SMOOTHING_MS));
    this.applyTransform();
    this.frame = this.angle === this.target ? null : requestAnimationFrame((t) => this.animate(t));
  }

  private applyTransform() {
    this.el.style.transform = `translate(${this.cx}px, ${this.cy}px) rotate(${this.angle}deg) translate(${-this.length / 2}px, ${-HEIGHT / 2}px)`;
  }

  private drawTicks() {
    const mm = this.opts.pxPerMm();
    const w = this.length;
    let d = "";
    const labels: string[] = [];
    // Khoảng cách vạch quá nhỏ thì chỉ vẽ vạch 5mm
    const step = mm >= 3 ? 1 : 5;
    const count = Math.floor((w - 16) / mm);
    for (let i = 0; i <= count; i += step) {
      const x = 8 + i * mm;
      const len = i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5;
      d += `M${x.toFixed(2)} 0v${len}M${x.toFixed(2)} ${HEIGHT}v${-len}`;
      if (i % 10 === 0 && (mm >= 2 || i % 20 === 0)) {
        labels.push(`<text x="${x.toFixed(2)}" y="26" text-anchor="middle">${i / 10}</text>`);
      }
    }
    this.ticks.setAttribute("viewBox", `0 0 ${w} ${HEIGHT}`);
    this.ticks.setAttribute("width", String(w));
    this.ticks.setAttribute("height", String(HEIGHT));
    this.ticks.innerHTML = `<path d="${d}" stroke="currentColor" stroke-width="1" fill="none"/>${labels.join("")}`;
  }

  private onDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const rect = this.stage.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (target.closest(".pn-ruler-handle")) {
      const pointerAngle = (Math.atan2(py - this.cy, px - this.cx) * 180) / Math.PI;
      this.gesture = { mode: "rotate", pointerId: e.pointerId, dx: 0, dy: 0, offset: this.target - pointerAngle };
    } else {
      this.gesture = { mode: "move", pointerId: e.pointerId, dx: this.cx - px, dy: this.cy - py, offset: 0 };
    }
    // Theo dõi chuột trên cả cửa sổ trong lúc kéo: nhả chuột ở đâu cũng dừng,
    // kể cả khi chuột đã trôi ra khỏi thước hoặc không giữ được pointer capture
    try {
      this.el.setPointerCapture(e.pointerId);
    } catch {
      // không sao, đã có listener trên window
    }
    window.addEventListener("pointermove", this.handleMove, true);
    window.addEventListener("pointerup", this.handleUp, true);
    window.addEventListener("pointercancel", this.handleUp, true);
    window.addEventListener("blur", this.handleBlur);
    this.el.addEventListener("lostpointercapture", this.handleUp);
    this.el.classList.add("is-active");
  }

  private onMove(e: PointerEvent) {
    const g = this.gesture;
    if (!g || g.pointerId !== e.pointerId) return;
    // Nút chuột đã nhả mà không nhận được pointerup (nhả ngoài cửa sổ…) thì dừng ngay
    if (e.buttons === 0) return this.endGesture();
    const rect = this.stage.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (g.mode === "move") {
      this.cx = Math.max(0, Math.min(px + g.dx, rect.width));
      this.cy = Math.max(0, Math.min(py + g.dy, rect.height));
      this.applyTransform();
    } else {
      // atan2 nhảy từ 180° sang -180°: chọn góc gần góc đích hiện tại nhất để không quay ngược một vòng
      let a = (Math.atan2(py - this.cy, px - this.cx) * 180) / Math.PI + g.offset;
      a += Math.round((this.target - a) / 360) * 360;
      this.rotateTo(a);
    }
  }

  private onUp(e: PointerEvent) {
    if (!this.gesture || this.gesture.pointerId !== e.pointerId) return;
    this.endGesture();
    this.revealHandles(e);
  }

  private handleMove = (e: PointerEvent) => this.onMove(e);
  private handleUp = (e: PointerEvent) => this.onUp(e);
  private handleBlur = () => this.endGesture();

  /** Kết thúc kéo / xoay và gỡ mọi listener tạm */
  private endGesture() {
    const g = this.gesture;
    this.gesture = null;
    window.removeEventListener("pointermove", this.handleMove, true);
    window.removeEventListener("pointerup", this.handleUp, true);
    window.removeEventListener("pointercancel", this.handleUp, true);
    window.removeEventListener("blur", this.handleBlur);
    this.el.removeEventListener("lostpointercapture", this.handleUp);
    if (g && this.el.hasPointerCapture(g.pointerId)) this.el.releasePointerCapture(g.pointerId);
    this.el.classList.remove("is-active");
  }

  /** Hiện nút xoay ở đầu thước khi chuột lại gần đầu đó */
  private revealHandles(e: PointerEvent) {
    if (this.gesture?.mode === "rotate") return; // đang xoay thì giữ nguyên nút đang cầm
    if (!this.visible) return;
    const rect = this.stage.getBoundingClientRect();
    const rad = (this.angle * Math.PI) / 180;
    const vx = e.clientX - rect.left - this.cx;
    const vy = e.clientY - rect.top - this.cy;
    const along = vx * Math.cos(rad) + vy * Math.sin(rad);
    const across = Math.abs(-vx * Math.sin(rad) + vy * Math.cos(rad));
    const half = this.length / 2;
    const inBand = across <= HEIGHT / 2 + HANDLE_REVEAL_SIDE;
    const nearEnd = (d: number) => inBand && d >= -HANDLE_REVEAL_INSIDE && d <= HANDLE_REVEAL_OUTSIDE;
    this.el.classList.toggle("near-start", nearEnd(-half - along));
    this.el.classList.toggle("near-end", nearEnd(along - half));
  }
}
