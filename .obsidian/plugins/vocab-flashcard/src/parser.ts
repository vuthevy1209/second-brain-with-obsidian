export interface VocabCard {
  word: string;
  /** Phần nghĩa đầy đủ (markdown) dưới heading `## word` */
  body: string;
  /** Nghĩa ngắn dùng cho trắc nghiệm; rỗng nếu thẻ chỉ có ảnh */
  short: string;
  /** Link ảnh trong `![[...]]`, nếu có */
  image?: string;
  /** Từ loại ở đầu phần nghĩa, vd `(adj)` → "adj" */
  pos?: string;
  /** Phiên âm IPA dạng `/raɪp/` nếu note có ghi */
  ipa?: string;
  /** Cách đọc lái tiếng Việt trong thẻ <rt> của heading */
  reading?: string;
  sourcePath: string;
}

const MULTI_COLUMN_RE = /^--- start-multi-column[^\n]*\n([\s\S]*?)^--- end-multi-column[^\n]*/gm;
// Dòng đầu `> [!vocab] từ`, sau đó là các dòng bắt đầu bằng `>`
const CALLOUT_RE = /^>[ \t]*\[!vocab\][+-]?[ \t]*(.*)\n?((?:^>.*(?:\n|$))*)/gim;
const IMAGE_RE = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/;
const POS_RE = /^\(([a-zA-Z. /-]{1,20})\)/;
// Chỉ nhận /.../ có ký tự IPA để không nhầm với "and/or"
const IPA_RE = /\/[^/\n]*[ɪʊəɛæʌɔɑɒθðʃʒŋˈˌːɜɚɝ][^/\n]*\//;
const HIGHLIGHT_RE = /==([^=]+)==|<mark[^>]*>([\s\S]*?)<\/mark>/;

/** Một thẻ từ vựng thô tìm thấy trong note, chưa xử lý heading */
interface RawCard {
  start: number;
  end: number;
  /** Dòng tiêu đề: `## từ` của multi-column, hoặc phần sau `[!vocab]` của callout */
  heading: string;
  /** Nguyên đoạn `![[ảnh|size]]`, nếu có */
  imageEmbed?: string;
  /** Phần nghĩa (markdown) sau tiêu đề */
  rest: string;
  /** Nội dung khác ở cột ảnh của Multi-Column (câu ví dụ, ảnh thứ 2…) — chỉ dùng khi chuyển đổi */
  extra?: string;
}

/**
 * Đọc thẻ từ vựng ở cả 2 định dạng:
 *
 * 1. Callout (định dạng của plugin, không cần plugin khác):
 *      > [!vocab] từ
 *      > ![[ảnh]]
 *      > (n) ==nghĩa==
 *
 * 2. Khối Multi-Column cũ:
 *      --- start-multi-column ...
 *      ![[ảnh]]
 *      --- column-break ---
 *      ## từ        (heading cấp nào cũng được; hoặc `## từ : nghĩa`)
 *      phần nghĩa
 *      --- end-multi-column
 */
export function parseVocab(markdown: string, sourcePath: string): VocabCard[] {
  const raws = [...findCallouts(markdown), ...findMultiColumns(markdown)].sort((a, b) => a.start - b.start);
  return raws.map((raw) => toCard(raw, sourcePath)).filter((c): c is VocabCard => c !== null);
}

/** Tách cột 1 của Multi-Column thành ảnh đầu tiên + phần còn lại (bỏ khối column-settings) */
function splitImageColumn(column: string): { imageEmbed?: string; extra: string } {
  const content = column.replace(/```column-settings[\s\S]*?```/, "");
  const imageEmbed = content.match(IMAGE_RE)?.[0];
  const extra = (imageEmbed ? content.replace(imageEmbed, "") : content).trim();
  return { imageEmbed, extra };
}

function findMultiColumns(markdown: string): RawCard[] {
  const raws: RawCard[] = [];
  for (const match of markdown.matchAll(MULTI_COLUMN_RE)) {
    const parts = match[1].split(/^--- column-break ---\s*$/m);
    if (parts.length < 2) continue;
    const second = parts.slice(1).join("\n");
    const heading = second.match(/^#{1,6}\s+(.+)$/m);
    if (!heading || heading.index === undefined) continue;
    raws.push({
      start: match.index!,
      end: match.index! + match[0].length,
      heading: heading[1],
      ...splitImageColumn(parts[0]),
      rest: second.slice(heading.index + heading[0].length).trim(),
    });
  }
  return raws;
}

function findCallouts(markdown: string): RawCard[] {
  const raws: RawCard[] = [];
  for (const match of markdown.matchAll(CALLOUT_RE)) {
    const lines = match[2].split("\n").map((l) => l.replace(/^>[ \t]?/, ""));
    // Dòng ảnh đầu tiên là ảnh minh họa, phần còn lại là nghĩa
    const imageLine = lines.findIndex((l) => IMAGE_RE.test(l) && l.replace(IMAGE_RE, "").trim() === "");
    const imageEmbed = imageLine >= 0 ? lines[imageLine].match(IMAGE_RE)![0] : undefined;
    if (imageLine >= 0) lines.splice(imageLine, 1);
    raws.push({
      start: match.index!,
      end: match.index! + match[0].length,
      heading: match[1],
      imageEmbed,
      rest: lines.join("\n").trim(),
    });
  }
  return raws;
}

function toCard(raw: RawCard, sourcePath: string): VocabCard | null {
  // `<ruby>reposition<rt>phiên âm</rt></ruby> : đặt lại vị trí`
  const reading = raw.heading.match(/<rt>([\s\S]*?)<\/rt>/)?.[1].trim() || undefined;
  const [rawWord, ...inlineMeaning] = stripHtml(raw.heading.replace(/<rt>[\s\S]*?<\/rt>/g, "")).split(":");
  const word = rawWord.replace(/\*\*|__|==|`/g, "").trim();
  const body = [inlineMeaning.join(":").trim(), raw.rest].filter(Boolean).join("\n\n");
  const image = raw.imageEmbed?.match(IMAGE_RE)?.[1].trim();
  if (!word || (!body && !image)) return null;

  return {
    word,
    body,
    short: body ? shortMeaning(body, word) : "",
    image,
    pos: body.match(POS_RE)?.[1].trim().toLowerCase(),
    ipa: body.match(IPA_RE)?.[0],
    reading,
    sourcePath,
  };
}

/** Nội dung callout `> [!vocab]` cho một thẻ */
export function vocabCallout(heading: string, imageEmbed: string | undefined, body: string): string {
  const lines = [`> [!vocab] ${heading.trim()}`];
  // Dòng `>` trống tách ảnh thành đoạn riêng (CSS dựa vào đó để đưa ảnh sang cột trái)
  if (imageEmbed) lines.push(`> ${imageEmbed}`, ">");
  if (body.trim()) {
    // Gộp nhiều dòng trống liền nhau thành một
    for (const line of body.trim().replace(/\n{3,}/g, "\n\n").split("\n")) {
      lines.push(line.trim() ? `> ${line}` : ">");
    }
  }
  return lines.join("\n");
}

/**
 * Khối Multi-Column không có heading (vd chú thích ảnh "Lighthouse", "put away: cất đi"):
 * lấy dòng đầu làm tiêu đề; dòng đầu là đoạn văn dài thì lấy cụm in đậm đầu tiên.
 */
function findUntitledMultiColumns(markdown: string, titled: RawCard[]): RawCard[] {
  const raws: RawCard[] = [];
  for (const match of markdown.matchAll(MULTI_COLUMN_RE)) {
    if (titled.some((r) => r.start === match.index)) continue;
    const parts = match[1].split(/^--- column-break ---\s*$/m);
    if (parts.length < 2) continue;
    const text = parts.slice(1).join("\n").trim();
    const [first, ...others] = text.split("\n");
    if (!first?.trim()) continue;

    const colon = first.indexOf(":");
    let heading: string;
    let rest: string;
    if (first.length <= 60 || (colon > 0 && colon <= 40)) {
      heading = first.trim();
      rest = others.join("\n").trim();
    } else {
      const bold = first.match(/\*\*([^*]+)\*\*/)?.[1].replace(/["“”]/g, "").trim();
      if (!bold) continue;
      heading = bold;
      rest = text;
    }
    raws.push({
      start: match.index!,
      end: match.index! + match[0].length,
      heading,
      ...splitImageColumn(parts[0]),
      rest,
    });
  }
  return raws;
}

/**
 * Đổi các khối Multi-Column thành callout `> [!vocab]`.
 * Khối không đoán được tiêu đề thì giữ nguyên và đếm vào `skipped`.
 */
export function convertMultiColumn(markdown: string): { text: string; converted: number; skipped: number } {
  const titled = findMultiColumns(markdown);
  const raws = [...titled, ...findUntitledMultiColumns(markdown, titled)].sort((a, b) => a.start - b.start);
  const total = [...markdown.matchAll(MULTI_COLUMN_RE)].length;
  let text = markdown;
  // Thay từ cuối lên đầu để vị trí các khối phía trước không bị lệch
  for (const raw of [...raws].reverse()) {
    // Nội dung thêm ở cột ảnh (câu ví dụ, ghi chú…) được giữ lại, đặt sau phần nghĩa
    let callout = vocabCallout(raw.heading, raw.imageEmbed, [raw.rest, raw.extra].filter(Boolean).join("\n\n"));
    // Callout phải có dòng trống phía sau, nếu không dòng kế tiếp sẽ bị dính vào callout
    if (!text.slice(raw.end).startsWith("\n\n")) callout += "\n";
    text = text.slice(0, raw.start) + callout + text.slice(raw.end);
  }
  return { text, converted: raws.length, skipped: total - raws.length };
}

/** Ưu tiên đoạn highlight đầu tiên (==...== hoặc <mark>), nếu không có thì lấy dòng đầu tiên. */
export function shortMeaning(body: string, word: string): string {
  const highlight = body.match(HIGHLIGHT_RE);
  const firstLine = body.split("\n").find((l) => l.trim() && !IMAGE_RE.test(l)) ?? "";
  const text = stripMarkdown(highlight ? highlight[1] ?? highlight[2] : firstLine);
  // Che từ gốc để đáp án trắc nghiệm không tự lộ ra
  const masked = text.replace(new RegExp(escapeRegExp(word), "gi"), "___");
  return masked.length > 140 ? masked.slice(0, 137) + "..." : masked;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

function stripMarkdown(text: string): string {
  return stripHtml(text)
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\*\*|__|==|[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Che từ tiếng Anh trong phần nghĩa (vd câu ví dụ) để chế độ Kiểm tra không lộ đáp án.
 * Che cả cụm lẫn từng từ dài ≥ 4 chữ trong cụm ("cell service" → che "service" đứng riêng).
 */
export function maskWord(markdown: string, word: string): string {
  const parts = [word, ...word.split(/\s+/).filter((w) => w.length >= 4)];
  let masked = markdown;
  for (const part of parts) {
    masked = masked.replace(new RegExp(escapeRegExp(part), "gi"), (m) => "＿".repeat(Math.min(m.length, 8)));
  }
  return masked;
}
