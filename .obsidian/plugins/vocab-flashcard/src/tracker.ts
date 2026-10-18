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

/** Khoảng lặng tối đa được tính giờ: quá thì coi như đã rời đi, không cộng thêm */
const IDLE_CAP_MS = 60_000;
/** Đang học thì cứ ~30s lưu một lần, để tắt Obsidian giữa chừng cũng không mất nhiều */
const SAVE_EVERY_MS = 30_000;

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
 * Ghi lại thời gian học thật của từng chế độ mỗi ngày.
 * Thời gian chỉ cộng khi có tương tác (ping): mỗi lần cộng tối đa 60s kể từ lần trước,
 * nên để modal mở rồi đi chỗ khác thì không bị tính giờ.
 */
export class StudyTracker {
  private current: { mode: Mode; lastPing: number } | null = null;
  private lastSave = 0;
  private listeners = new Set<() => void>();
  /** Các năm có thay đổi chưa ghi; chỉ những file năm này được ghi lại */
  private dirtyYears = new Set<string>();

  constructor(
    public data: StudyData,
    private persist: (years: Map<string, StudyData>) => Promise<void>,
    private now: () => number = () => Date.now()
  ) {}

  begin(mode: Mode) {
    this.end();
    this.current = { mode, lastPing: this.now() };
    // Lưu lần đầu sau ~30s học, không lưu ngay ở cú bấm đầu tiên
    this.lastSave = this.now();
  }

  /** Gọi mỗi lần bấm phím / click trong modal */
  ping() {
    const cur = this.current;
    if (!cur) return;
    const t = this.now();
    const ms = Math.min(Math.max(t - cur.lastPing, 0), IDLE_CAP_MS);
    cur.lastPing = t;
    if (!ms) return;
    const key = dayKey(t);
    const day = (this.data.days[key] ??= { byMode: {} });
    (day.byMode[cur.mode] ??= { ms: 0 }).ms += ms;
    this.dirtyYears.add(yearOf(key));
    if (t - this.lastSave >= SAVE_EVERY_MS) this.save();
  }

  /** Đổi chế độ hoặc đóng modal: chốt thời gian và lưu */
  end() {
    if (!this.current) return;
    this.ping();
    this.current = null;
    this.save();
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
