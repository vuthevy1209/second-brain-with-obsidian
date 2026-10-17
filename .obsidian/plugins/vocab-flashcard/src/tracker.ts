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
 * Đọc data.json; bản cũ (version 1) có đếm lượt học + lịch sử thì chỉ giữ lại số phút.
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

/**
 * Ghi lại thời gian học thật của từng chế độ mỗi ngày.
 * Thời gian chỉ cộng khi có tương tác (ping): mỗi lần cộng tối đa 60s kể từ lần trước,
 * nên để modal mở rồi đi chỗ khác thì không bị tính giờ.
 */
export class StudyTracker {
  private current: { mode: Mode; lastPing: number } | null = null;
  private lastSave = 0;
  private listeners = new Set<() => void>();

  constructor(
    public data: StudyData,
    private persist: (data: StudyData) => Promise<void>,
    private now: () => number = () => Date.now()
  ) {}

  begin(mode: Mode) {
    this.end();
    this.current = { mode, lastPing: this.now() };
  }

  /** Gọi mỗi lần bấm phím / click trong modal */
  ping() {
    const cur = this.current;
    if (!cur) return;
    const t = this.now();
    const ms = Math.min(Math.max(t - cur.lastPing, 0), IDLE_CAP_MS);
    cur.lastPing = t;
    if (!ms) return;
    const day = (this.data.days[dayKey(t)] ??= { byMode: {} });
    (day.byMode[cur.mode] ??= { ms: 0 }).ms += ms;
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
    void this.persist(this.data);
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
