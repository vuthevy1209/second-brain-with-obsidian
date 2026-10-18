import { debounce, ItemView, setIcon, WorkspaceLeaf } from "obsidian";
import { Mode, MODES } from "./modes";
import { DayStat, dayKey, dayMs, StudyTracker } from "./tracker";

export const STATS_VIEW_TYPE = "vocab-stats";

const DAY_MS = 86_400_000;
/** Dòng mở đầu thẻ từ vựng: `> [!vocab] từ` */
const VOCAB_CARD_RE = /^>[ \t]*\[!vocab\]/gim;
const WEEKS = 53;
const WEEKDAYS = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RANGES = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "Năm nay", days: 0 },
];

/** Tab "Hoạt động học tập": heatmap thời gian học, chuỗi ngày học, số từ vựng, thời gian theo chế độ */
export class StatsView extends ItemView {
  /** Mặc định mở ở "7 ngày" */
  private rangeIndex = 0;
  /** Năm đang xem trên heatmap; null = "Gần đây" (53 tuần tính tới hôm nay) */
  private year: number | null = null;
  /** Bấm ra ngoài thì đóng menu chọn năm */
  private closeYearMenu: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;
  /** Tổng số thẻ từ vựng trong vault; null khi đang đếm */
  private vocabCount: number | null = null;
  private recount = debounce(() => this.countVocab(), 2000, true);

  constructor(leaf: WorkspaceLeaf, private tracker: StudyTracker) {
    super(leaf);
  }

  getViewType() {
    return STATS_VIEW_TYPE;
  }

  getDisplayText() {
    return "Hoạt động học tập";
  }

  getIcon() {
    return "calendar-days";
  }

  async onOpen() {
    this.unsubscribe = this.tracker.onChange(() => this.render());
    // Thêm/sửa/xoá note thì đếm lại số từ vựng (gộp nhiều thay đổi liền nhau)
    for (const evt of ["modify", "create", "delete", "rename"] as const) {
      this.registerEvent(this.app.vault.on(evt as "modify", () => this.recount()));
    }
    this.render();
    void this.countVocab();
  }

  /** Đếm mọi thẻ `> [!vocab]` trong vault (cả thẻ chưa điền nghĩa), đúng theo định dạng thẻ đã định nghĩa */
  private async countVocab() {
    let count = 0;
    for (const file of this.app.vault.getMarkdownFiles()) {
      count += (await this.app.vault.cachedRead(file)).match(VOCAB_CARD_RE)?.length ?? 0;
    }
    this.vocabCount = count;
    this.render();
  }

  async onClose() {
    this.unsubscribe?.();
    this.closeYearMenu?.();
  }

  private render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("vf-stats");
    this.renderHeatmap(root.createDiv("vf-stats-card"));
    // Hàng giữa: 4 ô tóm tắt (2×2) bên trái, biểu đồ tròn tỉ lệ chế độ bên phải
    const row = root.createDiv("vf-stats-row");
    this.renderSummary(row.createDiv("vf-stats-summary"));
    this.renderModeShare(row.createDiv("vf-stats-card vf-stats-share"));
    this.renderModeTime(root.createDiv("vf-stats-card"));
  }

  // ---------- Heatmap ----------

  private renderHeatmap(card: HTMLElement) {
    const { days } = this.tracker.data;
    const head = card.createDiv("vf-stats-head");
    head.createDiv({ cls: "vf-stats-title", text: "Hoạt động học tập" });

    // Chọn năm giống GitHub: "Gần đây" + các năm có dữ liệu (luôn có năm hiện tại)
    const thisYear = new Date().getFullYear();
    const years = [...new Set([thisYear, ...Object.keys(days).map((k) => Number(k.slice(0, 4)))])].sort((a, b) => b - a);
    this.renderYearPicker(head, [null, ...years]);

    const today = startOfDay(Date.now());
    let start: number;
    let first: number;
    let last: number;
    if (this.year === null) {
      // Cột cuối chứa hôm nay; cột đầu bắt đầu từ Chủ nhật của 52 tuần trước
      start = addDays(today, -(7 * (WEEKS - 1) + new Date(today).getDay()));
      first = start;
      last = today;
    } else {
      // Cả năm: từ Chủ nhật của tuần chứa 1/1 tới tuần chứa 31/12
      first = new Date(this.year, 0, 1).getTime();
      last = new Date(this.year, 11, 31).getTime();
      start = addDays(first, -new Date(first).getDay());
    }
    const weeks = Math.floor(daysBetween(start, last) / 7) + 1;

    const wrap = card.createDiv("vf-heatmap");
    const months = wrap.createDiv("vf-heatmap-months");
    const body = wrap.createDiv("vf-heatmap-body");
    const labels = body.createDiv("vf-heatmap-weekdays");
    ["", "Mon", "", "Wed", "", "Fri", ""].forEach((t) => labels.createDiv({ text: t }));
    const grid = body.createDiv("vf-heatmap-grid");
    // Một năm có thể là 53 hoặc 54 cột tuần
    for (const el of [months, grid]) el.style.gridTemplateColumns = `repeat(${weeks}, minmax(0, 1fr))`;

    let lastMonth = -1;
    let lastLabelCol = -10;
    for (let w = 0; w < weeks; w++) {
      const col = grid.createDiv("vf-heatmap-col");
      const weekStart = addDays(start, w * 7);
      // Nhãn tháng ở cột có ngày đầu tuần sang tháng mới (cách nhãn trước ≥ 3 cột cho khỏi chồng chữ)
      const month = new Date(Math.max(weekStart, first)).getMonth();
      const label = months.createDiv("vf-heatmap-month");
      if (month !== lastMonth && w - lastLabelCol >= 3) {
        label.setText(MONTHS[month]);
        lastLabelCol = w;
      }
      lastMonth = month;

      for (let d = 0; d < 7; d++) {
        const time = addDays(weekStart, d);
        const cell = col.createDiv("vf-heatmap-cell");
        // Ngày tương lai hoặc nằm ngoài năm đang xem: ô trống
        if (time > today || time < first || time > last) {
          cell.addClass("is-future");
          continue;
        }
        const ms = dayMs(days[dayKey(time)]);
        cell.dataset.level = String(level(ms));
        const date = new Date(time);
        cell.dataset.tip = `${ms ? formatDuration(ms) : "Không học"} · ${WEEKDAYS[date.getDay()]}, ${date.toLocaleDateString("vi-VN")}`;
      }
    }

    // Tooltip riêng: hiện ngay khi rê chuột (tooltip mặc định của Obsidian có độ trễ)
    const tip = wrap.createDiv("vf-heatmap-tip");
    grid.addEventListener("mouseover", (evt) => {
      const cell = (evt.target as HTMLElement).closest<HTMLElement>(".vf-heatmap-cell[data-tip]");
      if (!cell) return;
      tip.setText(cell.dataset.tip!);
      tip.addClass("is-visible");
      // Đặt bong bóng phía trên, giữa ô; sát mép thì dịch vào để không bị cắt
      const box = wrap.getBoundingClientRect();
      const rect = cell.getBoundingClientRect();
      const half = tip.offsetWidth / 2;
      const center = rect.left - box.left + rect.width / 2;
      const left = Math.min(Math.max(center, half), box.width - half);
      tip.style.left = `${left}px`;
      tip.style.top = `${rect.top - box.top - 8}px`;
      tip.style.setProperty("--vf-tip-arrow", `${center - left}px`);
    });
    grid.addEventListener("mouseleave", () => tip.removeClass("is-visible"));

    const legend = card.createDiv("vf-heatmap-legend");
    legend.createSpan({ text: "Ít" });
    for (let i = 0; i <= 4; i++) legend.createDiv({ cls: "vf-heatmap-cell", attr: { "data-level": String(i) } });
    legend.createSpan({ text: "Nhiều" });
  }

  /** Dropdown chọn năm, cùng kiểu với menu chọn chế độ trong modal */
  private renderYearPicker(parent: HTMLElement, options: (number | null)[]) {
    const label = (y: number | null) => (y === null ? "Gần đây" : String(y));
    const picker = parent.createDiv("vf-mode-picker vf-year-picker");
    const button = picker.createEl("button", { cls: "vf-mode-button" });
    setIcon(button.createSpan("vf-mode-button-icon"), "calendar");
    button.createSpan({ cls: "vf-mode-button-label", text: label(this.year) });
    setIcon(button.createSpan("vf-mode-button-chevron"), "chevron-down");

    let menu: HTMLElement | null = null;
    const close = () => {
      if (!menu) return;
      const el = menu;
      menu = null;
      button.removeClass("is-open");
      document.removeEventListener("mousedown", onOutside, true);
      this.closeYearMenu = null;
      el.addClass("is-closing");
      window.setTimeout(() => el.remove(), 120);
    };
    const onOutside = (evt: MouseEvent) => {
      if (!picker.contains(evt.target as Node)) close();
    };

    button.onclick = () => {
      if (menu) return close();
      menu = picker.createDiv("vf-mode-menu");
      button.addClass("is-open");
      for (const year of options) {
        const item = menu.createDiv("vf-mode-item");
        item.toggleClass("is-active", year === this.year);
        setIcon(item.createSpan("vf-mode-item-icon"), year === null ? "history" : "calendar");
        item.createSpan({ cls: "vf-mode-item-label", text: label(year) });
        if (year === this.year) setIcon(item.createSpan("vf-mode-item-check"), "check");
        item.onclick = () => {
          close();
          if (year === this.year) return;
          this.year = year;
          this.render();
        };
      }
      document.addEventListener("mousedown", onOutside, true);
      this.closeYearMenu = close;
    };
  }

  // ---------- Tóm tắt ----------

  private renderSummary(el: HTMLElement) {
    const { days } = this.tracker.data;
    const items: [string, string][] = [
      [`${currentStreak(days)} ngày`, "Chuỗi hiện tại"],
      [`${longestStreak(days)} ngày`, "Chuỗi dài nhất"],
      [this.vocabCount === null ? "…" : this.vocabCount.toLocaleString("vi-VN"), "Thẻ từ vựng"],
      // Tổng của toàn bộ dữ liệu (mọi năm), không đổi theo năm đang chọn
      [formatDuration(Object.values(days).reduce((s, d) => s + dayMs(d), 0)), "Tổng thời gian học"],
    ];
    for (const [value, label] of items) {
      const box = el.createDiv("vf-stats-box");
      box.createDiv({ cls: "vf-stats-box-value", text: value });
      box.createDiv({ cls: "vf-stats-box-label", text: label });
    }
  }

  // ---------- Tỉ lệ thời gian giữa các chế độ: biểu đồ tròn ----------

  /** Dựa trên toàn bộ dữ liệu (mọi năm), không phụ thuộc năm đang chọn */
  private renderModeShare(card: HTMLElement) {
    card.createDiv("vf-stats-head").createDiv({ cls: "vf-stats-title", text: "Tỉ lệ theo chế độ" });
    const modes = Object.keys(MODES) as Mode[];
    const totals = new Map<Mode, number>(modes.map((m) => [m, 0]));
    for (const day of Object.values(this.tracker.data.days)) {
      for (const [m, s] of Object.entries(day.byMode) as [Mode, { ms: number }][]) totals.set(m, (totals.get(m) ?? 0) + s.ms);
    }
    const sum = [...totals.values()].reduce((a, b) => a + b, 0);
    if (!sum) {
      card.createDiv({ cls: "vf-stats-empty", text: "Chưa có thời gian học." });
      return;
    }

    const body = card.createDiv("vf-share-body");
    const chart = body.createDiv("vf-share-chart");
    const SVG = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    chart.appendChild(svg);
    const tip = chart.createDiv("vf-share-tip");

    // Hình tròn đặc: mỗi chế độ một miếng, viền màu nền 2px tách các miếng
    const cx = 100;
    const cy = 100;
    const r = 96;
    const point = (angle: number) => `${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`;
    const used = modes.filter((m) => totals.get(m));
    let angle = -Math.PI / 2;
    for (const mode of used) {
      const share = totals.get(mode)! / sum;
      const end = angle + share * 2 * Math.PI;
      const slice =
        used.length === 1 ? document.createElementNS(SVG, "circle") : document.createElementNS(SVG, "path");
      if (used.length === 1) {
        slice.setAttribute("cx", String(cx));
        slice.setAttribute("cy", String(cy));
        slice.setAttribute("r", String(r));
      } else {
        const large = end - angle > Math.PI ? 1 : 0;
        slice.setAttribute("d", `M ${cx} ${cy} L ${point(angle)} A ${r} ${r} 0 ${large} 1 ${point(end)} Z`);
      }
      slice.setAttribute("class", "vf-share-slice");
      slice.setAttribute("data-mode", mode);
      // Rê chuột vào miếng: hiện % cạnh con trỏ
      const pct = share * 100;
      const text = `${MODES[mode].label} · ${pct < 1 ? "<1" : Math.round(pct)}%`;
      slice.addEventListener("mousemove", (evt) => {
        const box = chart.getBoundingClientRect();
        tip.setText(text);
        tip.style.left = `${(evt as MouseEvent).clientX - box.left}px`;
        tip.style.top = `${(evt as MouseEvent).clientY - box.top - 10}px`;
        tip.addClass("is-visible");
      });
      slice.addEventListener("mouseleave", () => tip.removeClass("is-visible"));
      svg.appendChild(slice);
      angle = end;
    }

    // Chú thích: chỉ cho biết màu nào là chế độ nào
    const legend = body.createDiv("vf-share-legend");
    for (const mode of modes) {
      const row = legend.createDiv("vf-share-row");
      row.toggleClass("is-empty", !totals.get(mode));
      row.createSpan({ cls: "vf-chart-swatch", attr: { "data-mode": mode } });
      row.createSpan({ cls: "vf-share-name", text: MODES[mode].label });
    }
  }

  // ---------- Thời gian theo chế độ: biểu đồ cột chồng ----------

  /** Mỗi cột là 1 ngày (7/30 ngày) hoặc 1 tháng (năm nay); các đoạn trong cột là thời gian từng chế độ */
  private renderModeTime(card: HTMLElement) {
    const head = card.createDiv("vf-stats-head");
    head.createDiv({ cls: "vf-stats-title", text: "Thời gian theo chế độ" });
    const tabs = head.createDiv("vf-stats-tabs");
    RANGES.forEach((range, i) => {
      // Nút "Năm nay" đổi thành "Năm 2025" khi đang xem năm khác trên heatmap
      const label = !range.days && this.year && this.year !== new Date().getFullYear() ? `Năm ${this.year}` : range.label;
      const btn = tabs.createEl("button", { text: label });
      btn.toggleClass("is-active", i === this.rangeIndex);
      btn.onclick = () => {
        this.rangeIndex = i;
        this.render();
      };
    });

    const modes = Object.keys(MODES) as Mode[];
    const buckets = buildBuckets(
      this.tracker.data.days,
      RANGES[this.rangeIndex].days,
      this.year ?? new Date().getFullYear()
    );
    const totals = new Map<Mode, number>(modes.map((m) => [m, 0]));
    for (const b of buckets) for (const m of modes) totals.set(m, totals.get(m)! + (b.ms[m] ?? 0));

    const maxMs = Math.max(0, ...buckets.map((b) => b.total));
    if (!maxMs) {
      card.createDiv({ cls: "vf-stats-empty", text: "Chưa có thời gian học trong khoảng này." });
      return;
    }
    const { step, top } = niceScale(maxMs);

    const chart = card.createDiv("vf-chart");
    const yAxis = chart.createDiv("vf-chart-yaxis");
    const plot = chart.createDiv("vf-chart-plot");
    for (let v = 0; v <= top; v += step) {
      const pct = (v / top) * 100;
      plot.createDiv("vf-chart-grid").style.bottom = `${pct}%`;
      const label = yAxis.createDiv({ cls: "vf-chart-ylabel", text: formatShort(v) });
      label.style.bottom = `${pct}%`;
    }

    const cols = plot.createDiv("vf-chart-cols");
    const tooltip = plot.createDiv("vf-chart-tooltip");
    const xAxis = chart.createDiv("vf-chart-xaxis");
    const labelEvery = buckets.length > 12 ? 5 : 1;

    buckets.forEach((b, i) => {
      // Cả cột (cao hết khung) là vùng hover, lớn hơn phần màu
      const col = cols.createDiv("vf-chart-col");
      const stack = col.createDiv("vf-chart-stack");
      stack.style.height = `${(b.total / top) * 100}%`;
      for (const m of modes) {
        const ms = b.ms[m] ?? 0;
        if (!ms) continue;
        const seg = stack.createDiv({ cls: "vf-chart-seg", attr: { "data-mode": m } });
        seg.style.flexGrow = String(ms);
      }
      const x = xAxis.createDiv("vf-chart-xlabel");
      // Năm nay: nhãn mọi tháng; 30 ngày: 5 ngày một nhãn, luôn có nhãn hôm nay
      if (i % labelEvery === 0 || i === buckets.length - 1) x.setText(b.short);

      col.onmouseenter = () => {
        tooltip.empty();
        tooltip.createDiv({ cls: "vf-chart-tooltip-title", text: b.long });
        for (const m of modes) {
          const ms = b.ms[m] ?? 0;
          if (!ms) continue;
          const row = tooltip.createDiv("vf-chart-tooltip-row");
          row.createSpan({ cls: "vf-chart-swatch", attr: { "data-mode": m } });
          row.createSpan({ text: MODES[m].label });
          row.createSpan({ cls: "vf-chart-tooltip-value", text: formatDuration(ms) });
        }
        const total = tooltip.createDiv("vf-chart-tooltip-row vf-chart-tooltip-total");
        total.createSpan({ text: "Tổng" });
        total.createSpan({ cls: "vf-chart-tooltip-value", text: b.total ? formatDuration(b.total) : "Không học" });
        // Đặt tooltip cạnh cột, lật sang trái khi cột ở nửa phải
        const center = ((i + 0.5) / buckets.length) * 100;
        tooltip.style.left = center > 50 ? "" : `calc(${center}% + 14px)`;
        tooltip.style.right = center > 50 ? `calc(${100 - center}% + 14px)` : "";
        tooltip.addClass("is-visible");
      };
      col.onmouseleave = () => tooltip.removeClass("is-visible");
    });

    // Chú thích: luôn có (6 chế độ), kèm tổng thời gian để không phải đọc bằng màu
    const legend = card.createDiv("vf-chart-legend");
    for (const m of modes) {
      const ms = totals.get(m)!;
      const item = legend.createDiv("vf-chart-legend-item");
      item.toggleClass("is-empty", !ms);
      item.createSpan({ cls: "vf-chart-swatch", attr: { "data-mode": m } });
      item.createSpan({ cls: "vf-chart-legend-label", text: MODES[m].label });
      item.createSpan({ cls: "vf-chart-legend-value", text: formatDuration(ms) });
    }
  }

}

// ---------- Tính toán ----------

interface Bucket {
  short: string;
  long: string;
  total: number;
  ms: Partial<Record<Mode, number>>;
}

/** days > 0: mỗi ngày một cột; days = 0: mỗi tháng của `year` một cột (năm nay thì tới tháng hiện tại) */
export function buildBuckets(data: Record<string, DayStat>, days: number, year: number): Bucket[] {
  const buckets: Bucket[] = [];
  const add = (bucket: Bucket, stat?: DayStat) => {
    if (!stat) return;
    for (const [m, s] of Object.entries(stat.byMode) as [Mode, { ms: number }][]) {
      bucket.ms[m] = (bucket.ms[m] ?? 0) + s.ms;
      bucket.total += s.ms;
    }
  };
  const today = startOfDay(Date.now());
  if (days) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(addDays(today, -i));
      const bucket: Bucket = {
        short: `${d.getDate()}/${d.getMonth() + 1}`,
        long: `${WEEKDAYS[d.getDay()]}, ${d.toLocaleDateString("vi-VN")}`,
        total: 0,
        ms: {},
      };
      add(bucket, data[dayKey(d.getTime())]);
      buckets.push(bucket);
    }
    return buckets;
  }
  const now = new Date(today);
  const lastMonth = year === now.getFullYear() ? now.getMonth() : 11;
  for (let month = 0; month <= lastMonth; month++) {
    buckets.push({ short: `Th${month + 1}`, long: `Tháng ${month + 1}/${year}`, total: 0, ms: {} });
  }
  for (const [key, stat] of Object.entries(data)) {
    const [y, m] = key.split("-").map(Number);
    if (y === year && buckets[m - 1]) add(buckets[m - 1], stat);
  }
  return buckets;
}

/** Bước lưới "đẹp" (5 phút, 15 phút, 1 giờ…) sao cho có khoảng 3–4 vạch */
function niceScale(maxMs: number): { step: number; top: number } {
  const steps = [5, 10, 15, 30, 60, 120, 180, 300, 600, 1200, 1800, 3000, 6000].map((m) => m * 60_000);
  const step = steps.find((s) => maxMs / s <= 4) ?? steps[steps.length - 1];
  return { step, top: Math.ceil(maxMs / step) * step };
}

/** Nhãn trục gọn: 30p, 1h, 1h30 */
function formatShort(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (!minutes) return "0";
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m}` : `${h}h`;
}

/** 5 mức màu theo số phút học trong ngày: 0, <10, 10–20, 20–40, ≥40 phút */
export function level(ms: number): number {
  const minutes = ms / 60_000;
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 20) return 2;
  if (minutes < 40) return 3;
  return 4;
}

/**
 * Cộng ngày theo lịch (không cộng 24h), để nơi có giờ mùa hè (ngày dài 23/25h) vẫn ra đúng ngày.
 * Kết quả luôn là 0h của ngày đích.
 */
export function addDays(time: number, days: number): number {
  const d = new Date(time);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

/** Số ngày lịch giữa hai mốc 0h */
function daysBetween(from: number, to: number): number {
  return Math.round((to - from) / DAY_MS);
}

function startOfDay(time: number): number {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function studied(days: Record<string, DayStat>, time: number): boolean {
  return dayMs(days[dayKey(time)]) > 0;
}

/** Số ngày học liên tiếp tới hôm nay (hôm nay chưa học thì tính tới hôm qua, chuỗi vẫn còn) */
export function currentStreak(days: Record<string, DayStat>): number {
  let t = startOfDay(Date.now());
  if (!studied(days, t)) t = addDays(t, -1);
  let streak = 0;
  while (studied(days, t)) {
    streak++;
    t = addDays(t, -1);
  }
  return streak;
}

export function longestStreak(days: Record<string, DayStat>): number {
  const keys = Object.keys(days)
    .filter((k) => dayMs(days[k]) > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const key of keys) {
    // Ngày trước đó liền kề thì nối chuỗi, không thì bắt đầu chuỗi mới
    run = prev && dayKey(addDays(new Date(`${prev}T00:00:00`).getTime(), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (ms > 0 && minutes < 1) return "<1 phút";
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}
