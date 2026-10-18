import { Mode } from "./modes";

export interface ModeStat {
  ms: number;
}

export interface DayStat {
  /** Thời gian học từng chế độ trong ngày */
  byMode: Partial<Record<Mode, ModeStat>>;
}

export interface StudyData {
  version: 2;
  days: Record<string, DayStat>;
}

/** Quá 60s không bấm phím / click thì đồng hồ tạm dừng, thao tác lại mới chạy tiếp */
export const IDLE_PAUSE_MS = 60_000;
/** Đang học thì cứ ~30s lưu một lần, để tắt Obsidian giữa chừng cũng không mất nhiều */
const SAVE_EVERY_MS = 30_000;
/** Đồng hồ tự kiểm tra mỗi giây: cộng dồn thời gian và phát hiện lúc cần tạm dừng */
const TICK_MS = 1_000;

/** Ngày theo giờ máy (không dùng UTC để học lúc nửa đêm không bị lệch sang ngày khác) */
export function dayKey(time: number): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayMs(day: DayStat | undefined): number {
  return day ? Object.values(day.byMode).reduce((s, m) => s + (m?.ms ?? 0), 0) : 0;
}

/**
 * Chuẩn hoá dữ liệu đọc từ file (cả data.json cũ version 1 có đếm lượt + lịch sử): chỉ giữ số phút.
 */
export function loadStudyData(raw: unknown): StudyData {
  const data: StudyData = { version: 2, days: {} };
  const days = (raw as { days?: Record<string, { byMode?: Record<string, { ms?: number }> }> } | null)?.days;
  for (const [key, day] of Object.entries(days ?? {})) {
    const byMode: DayStat["byMode"] = {};
    for (const [mode, stat] of Object.entries(day.byMode ?? {})) {
      if (stat?.ms) byMode[mode as Mode] = { ms: stat.ms };
    }
    if (Object.keys(byMode).length) data.days[key] = { byMode };
  }
  return data;
}

/** Năm của một ngày "YYYY-MM-DD" — mỗi năm lưu một file data/YYYY.json */
export function yearOf(key: string): string {
  return key.slice(0, 4);
}

/** Tách dữ liệu theo năm; `only` = chỉ lấy các năm này */
export function splitByYear(data: StudyData, only?: Set<string>): Map<string, StudyData> {
  const years = new Map<string, StudyData>();
  for (const [key, day] of Object.entries(data.days)) {
    const year = yearOf(key);
    if (only && !only.has(year)) continue;
    if (!years.has(year)) years.set(year, { version: 2, days: {} });
    years.get(year)!.days[key] = day;
  }
  // Năm được yêu cầu mà không còn ngày nào vẫn trả về (file rỗng) để ghi đè cho đúng
  for (const year of only ?? []) if (!years.has(year)) years.set(year, { version: 2, days: {} });
  return years;
}

/**
 * Đồng hồ đo thời gian học thật của từng chế độ mỗi ngày.
 * - `begin(mode)`: bấm vào một chế độ học → đồng hồ bắt đầu chạy.
 * - `activity()`: mỗi lần bấm phím / click. Đồng hồ đang tạm dừng thì chạy lại từ lúc này.
 * - Quá 60s không thao tác thì tạm dừng: chỉ tính tới mốc 60s sau thao tác cuối, phần sau bỏ.
 * - `end()`: học xong (màn hình kết quả), đổi chế độ, về trang chọn chế độ hoặc đóng modal.
 */
export class StudyTracker {
  private current: {
    mode: Mode;
    /** Đã cộng thời gian tới mốc này */
    countedUntil: number;
    lastActivity: number;
  } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastSave = 0;
  private listeners = new Set<() => void>();
  /** Các năm có thay đổi chưa ghi; chỉ những file năm này được ghi lại */
  private dirtyYears = new Set<string>();

  constructor(
    public data: StudyData,
    private persist: (years: Map<string, StudyData>) => Promise<void>,
    private now: () => number = () => Date.now(),
    /** Tắt đồng hồ tự kiểm tra (dùng khi test, gọi `tick()` bằng tay) */
    private autoTick = true
  ) {}

  get mode(): Mode | null {
    return this.current?.mode ?? null;
  }

  /** Đang đo nhưng quá 60s chưa thao tác */
  get paused(): boolean {
    const cur = this.current;
    return !!cur && this.now() - cur.lastActivity >= IDLE_PAUSE_MS;
  }

  begin(mode: Mode) {
    this.end();
    const t = this.now();
    this.current = { mode, countedUntil: t, lastActivity: t };
    // Lưu lần đầu sau ~30s học, không lưu ngay khi vừa bắt đầu
    this.lastSave = t;
    if (this.autoTick) this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  /** Gọi mỗi lần bấm phím / click trong modal */
  activity() {
    const cur = this.current;
    if (!cur) return;
    const t = this.now();
    this.count(t);
    // Đang tạm dừng thì khoảng vắng mặt bị bỏ qua, chạy tiếp từ lúc này
    cur.countedUntil = Math.max(cur.countedUntil, t);
    cur.lastActivity = t;
  }

  /** Cộng dồn tới hiện tại (đồng hồ gọi mỗi giây) và lưu định kỳ */
  tick() {
    if (!this.current) return;
    const t = this.now();
    this.count(t);
    if (t - this.lastSave >= SAVE_EVERY_MS) this.save();
  }

  /** Học xong / đổi chế độ / đóng modal: chốt thời gian và lưu */
  end() {
    if (!this.current) return;
    this.count(this.now());
    this.current = null;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.save();
  }

  /** Cộng khoảng [countedUntil, t] nhưng không quá mốc tạm dừng; học qua nửa đêm thì chia đúng 2 ngày */
  private count(t: number) {
    const cur = this.current!;
    const until = Math.min(t, cur.lastActivity + IDLE_PAUSE_MS);
    let from = cur.countedUntil;
    if (until <= from) return;
    while (from < until) {
      const d = new Date(from);
      const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      const to = Math.min(until, nextDay);
      const key = dayKey(from);
      const day = (this.data.days[key] ??= { byMode: {} });
      (day.byMode[cur.mode] ??= { ms: 0 }).ms += to - from;
      this.dirtyYears.add(yearOf(key));
      from = to;
    }
    cur.countedUntil = until;
  }

  private save() {
    this.lastSave = this.now();
    this.listeners.forEach((cb) => cb());
    if (!this.dirtyYears.size) return;
    const years = splitByYear(this.data, this.dirtyYears);
    this.dirtyYears = new Set();
    void this.persist(years);
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
