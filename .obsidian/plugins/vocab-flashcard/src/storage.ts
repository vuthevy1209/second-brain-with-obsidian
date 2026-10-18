import { DataAdapter, Notice } from "obsidian";
import { Mode } from "./modes";
import { loadStudyData, splitByYear, StudyData, yearOf } from "./tracker";

const YEAR_FILE = /^(\d{4})\.json$/;

/**
 * Lưu thời gian học thành mỗi năm một file: `<plugin>/data/2025.json`, `2026.json`…
 * Lúc đọc thì gộp hết các năm lại, nên heatmap "53 tuần gần nhất" vắt qua 2 năm vẫn liền mạch.
 * Lúc ghi chỉ ghi lại các năm có thay đổi; file năm cũ không bị đụng tới.
 */
export class StudyStorage {
  /** Ghi tuần tự để 2 lần lưu sát nhau không ghi đè lẫn nhau */
  private queue: Promise<void> = Promise.resolve();

  constructor(private adapter: DataAdapter, private pluginDir: string) {}

  private get dir() {
    return `${this.pluginDir}/data`;
  }

  async loadAll(): Promise<StudyData> {
    const merged: StudyData = { version: 2, days: {} };
    if (await this.adapter.exists(this.dir)) {
      const names = (await this.adapter.list(this.dir)).files.map((p) => p.split("/").pop()!);
      const years = new Set(names.map((n) => n.replace(/\.tmp$/, "").match(YEAR_FILE)?.[1]).filter(Boolean) as string[]);
      for (const year of years) {
        const data = await this.readYear(year, names);
        if (data) Object.assign(merged.days, data.days);
      }
    }
    await this.migrateLegacy(merged);
    return merged;
  }

  /**
   * Đọc một năm. Còn bản .tmp nghĩa là lần ghi trước bị ngắt giữa chừng; .tmp luôn được ghi xong
   * trước khi đụng tới file chính nên nó là bản mới nhất → ưu tiên .tmp, hỏng thì mới dùng file chính.
   * File không đọc được thì đổi tên thành .broken-<thời điểm> để lần lưu sau không ghi đè mất.
   */
  private async readYear(year: string, names: string[]): Promise<StudyData | null> {
    const candidates = [`${year}.json.tmp`, `${year}.json`].filter((n) => names.includes(n));
    let data: StudyData | null = null;
    for (const name of candidates) {
      const path = `${this.dir}/${name}`;
      try {
        data = loadStudyData(JSON.parse(await this.adapter.read(path)));
        break;
      } catch (err) {
        const backup = `${path}.broken-${Date.now()}`;
        console.error(`[vocab-flashcard] Không đọc được data/${name}, giữ lại ở ${backup}`, err);
        new Notice(`Vocab Flashcard: data/${name} bị hỏng, đã giữ lại bản sao ${backup.split("/").pop()}.`);
        await this.adapter.rename(path, backup);
      }
    }
    return data;
  }

  /**
   * data.json cũ (một file cho tất cả) → gộp vào các file năm rồi xoá.
   * Ngày có ở cả hai nơi thì lấy số phút lớn hơn của từng chế độ, để không bị cộng trùng.
   */
  private async migrateLegacy(merged: StudyData) {
    const legacy = `${this.pluginDir}/data.json`;
    if (!(await this.adapter.exists(legacy))) return;
    let old: StudyData;
    try {
      old = loadStudyData(JSON.parse(await this.adapter.read(legacy)));
    } catch (err) {
      console.error("[vocab-flashcard] data.json cũ bị hỏng, giữ nguyên file", err);
      return;
    }

    const touched = new Set<string>();
    for (const [key, day] of Object.entries(old.days)) {
      const target = (merged.days[key] ??= { byMode: {} });
      for (const [mode, stat] of Object.entries(day.byMode) as [Mode, { ms: number }][]) {
        const cur = target.byMode[mode]?.ms ?? 0;
        if (stat.ms > cur) target.byMode[mode] = { ms: stat.ms };
      }
      touched.add(yearOf(key));
    }
    await this.saveYears(splitByYear(merged, touched));
    await this.adapter.remove(legacy);
  }

  saveYears(years: Map<string, StudyData>): Promise<void> {
    this.queue = this.queue.then(() => this.writeYears(years)).catch((err) => {
      console.error("[vocab-flashcard] Lưu thời gian học thất bại", err);
    });
    return this.queue;
  }

  /** Ghi ra file tạm rồi đổi tên đè lên file chính, để tắt máy giữa chừng không làm hỏng file */
  private async writeYears(years: Map<string, StudyData>) {
    if (!(await this.adapter.exists(this.dir))) await this.adapter.mkdir(this.dir);
    for (const [year, data] of years) {
      const file = `${this.dir}/${year}.json`;
      const tmp = `${file}.tmp`;
      await this.adapter.write(tmp, JSON.stringify(data));
      if (await this.adapter.exists(file)) await this.adapter.remove(file);
      await this.adapter.rename(tmp, file);
    }
  }
}
