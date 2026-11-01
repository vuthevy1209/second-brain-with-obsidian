/** Từ vựng extension Chrome "ProMax Translate" gửi sang khi bấm nút Obsidian trong popup tra từ */
export interface ClipPayload {
  /** Từ hoặc cụm từ được bôi đen */
  text: string;
  /** Nghĩa tiếng Việt */
  translation: string;
  /** Phiên âm kiểu Google (vd `ˈsalvij`), không phải IPA chuẩn */
  phonetic: string;
  /** Extension gửi kèm, dòng ghi chú chưa dùng */
  source: string;
  /** Các nghĩa theo loại từ tiếng Việt, vd { pos: "danh từ", terms: ["sự cứu hộ"] } */
  meanings: { pos: string; terms: string[] }[];
  /** Định nghĩa tiếng Anh */
  definitions: { pos: string; gloss: string; example: string }[];
  /** Câu trên trang có chứa từ + câu dịch (có thể rỗng) */
  sentence: string;
  sentenceTranslation: string;
  /** Tiêu đề + địa chỉ trang đang đọc */
  title: string;
  url: string;
}

/** Kiểm tra + làm sạch JSON nhận được; thiếu `text` thì trả về null */
export function toClipPayload(raw: unknown): ClipPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = clean(r.text);
  if (!text) return null;
  return {
    text,
    translation: clean(r.translation),
    phonetic: clean(r.phonetic),
    source: clean(r.source),
    meanings: items(r.meanings).map((m) => ({
      pos: clean(m.pos),
      terms: (Array.isArray(m.terms) ? m.terms : []).map(clean).filter(Boolean),
    })),
    definitions: items(r.definitions).map((d) => ({ pos: clean(d.pos), gloss: clean(d.gloss), example: clean(d.example) })),
    sentence: clean(r.sentence),
    sentenceTranslation: clean(r.sentenceTranslation),
    title: clean(r.title),
    url: clean(r.url),
  };
}

/**
 * Ghi gọn như cách ghi tay trong note; thẻ `[!vocab]` đầy đủ thì dựng sau bằng skill vocab-illustrate:
 *   - **condo**: căn hộ chung cư
 */
export function buildClipLine(payload: ClipPayload): string {
  const meaning = payload.translation || payload.meanings[0]?.terms[0] || "";
  return `- **${payload.text}**${meaning ? `: ${meaning}` : ""}`;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function items(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((v) => v && typeof v === "object") : [];
}
