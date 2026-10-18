import { decodePoints, encodePoints } from "./encode";
import { NotebookDoc, NotebookElement, Page, PAGE_W, Template, TEMPLATES, newDoc, newId } from "./model";

// Cấu trúc file .notebook.md:
//   frontmatter (giữ nguyên tag/thuộc tính người dùng thêm, kèm `notebook-plugin: 1`)
//   ## Text        — chữ trong các text box, sinh lại mỗi lần lưu để Obsidian search/backlink thấy
//   ## Files       — link tới ảnh, để Obsidian tự cập nhật khi đổi tên/di chuyển ảnh
//   %% ## Notebook Data ```json ... ``` %% — dữ liệu thật của notebook, ẩn khi đọc

const DATA_HEADING = "## Notebook Data\n```json\n";
const FILES_HEADING = "## Files\n";
const FRONTMATTER_KEY = "notebook-plugin";

export interface ParsedNotebook {
  doc: NotebookDoc;
  /** Các dòng frontmatter (không gồm dấu ---) */
  frontmatter: string;
}

export function isNotebookPath(path: string): boolean {
  return path.toLowerCase().endsWith(".notebook.md");
}

export function notebookTitle(basename: string): string {
  return basename.replace(/\.notebook$/i, "");
}

export function parseNotebook(text: string, defaultTemplate: Template): ParsedNotebook {
  text = text.replace(/\r\n/g, "\n");
  let frontmatter = "";
  let body = text;
  const fm = /^---\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/.exec(text);
  if (fm) {
    frontmatter = fm[1] ?? "";
    body = text.slice(fm[0].length);
  }

  const start = body.lastIndexOf(DATA_HEADING);
  if (start < 0) {
    if (body.trim() !== "" && body.trim() !== "%%") {
      throw new Error("Không tìm thấy phần ## Notebook Data trong file.");
    }
    return { doc: newDoc(defaultTemplate), frontmatter };
  }
  const jsonStart = start + DATA_HEADING.length;
  const jsonEnd = body.indexOf("\n```", jsonStart);
  const raw = JSON.parse(body.slice(jsonStart, jsonEnd < 0 ? undefined : jsonEnd));
  const doc = normalizeDoc(raw, defaultTemplate);

  // Link ảnh trong ## Files có thể đã được Obsidian sửa khi đổi tên file ảnh → ưu tiên nó
  const links = parseFileLinks(body.slice(0, start));
  for (const page of doc.pages) {
    for (const el of page.elements) {
      if (el.type === "image" && links.has(el.id)) el.src = links.get(el.id)!;
    }
  }
  return { doc, frontmatter };
}

function parseFileLinks(text: string): Map<string, string> {
  const links = new Map<string, string>();
  const at = text.lastIndexOf(FILES_HEADING);
  if (at < 0) return links;
  const re = /^- ([\w-]+): !?\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/gm;
  const section = text.slice(at);
  let m: RegExpExecArray | null;
  while ((m = re.exec(section))) links.set(m[1], m[2].trim());
  return links;
}

function normalizeDoc(raw: any, defaultTemplate: Template): NotebookDoc {
  const templates = new Set(TEMPLATES.map((t) => t.id));
  const pages: Page[] = [];
  for (const p of Array.isArray(raw?.pages) ? raw.pages : []) {
    const elements: NotebookElement[] = [];
    for (const e of Array.isArray(p?.elements) ? p.elements : []) {
      const el = normalizeElement(e);
      if (el) elements.push(el);
    }
    pages.push({
      id: typeof p?.id === "string" ? p.id : newId(),
      template: templates.has(p?.template) ? p.template : defaultTemplate,
      elements,
    });
  }
  if (pages.length === 0) return newDoc(defaultTemplate);
  return { version: 1, pages };
}

function num(v: any, fallback: number): number {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}

function normalizeElement(e: any): NotebookElement | null {
  const id = typeof e?.id === "string" ? e.id : newId();
  switch (e?.type) {
    case "stroke":
      return {
        id,
        type: "stroke",
        tool: e.tool === "highlighter" ? "highlighter" : "pen",
        color: typeof e.color === "string" ? e.color : "#1a1a1a",
        size: num(e.size, 0.6),
        realPressure: !!e.realPressure,
        points: typeof e.points === "string" ? decodePoints(e.points) : [],
      };
    case "text":
      return {
        id,
        type: "text",
        x: num(e.x, 20),
        y: num(e.y, 20),
        w: num(e.w, PAGE_W - 40),
        fontSize: num(e.fontSize, 11),
        color: typeof e.color === "string" ? e.color : "#1a1a1a",
        md: typeof e.md === "string" ? e.md : "",
      };
    case "image":
      if (typeof e.src !== "string") return null;
      return { id, type: "image", x: num(e.x, 20), y: num(e.y, 20), w: num(e.w, 80), h: num(e.h, 60), src: e.src };
  }
  return null;
}

export function serializeNotebook(doc: NotebookDoc, frontmatter: string): string {
  const fm = frontmatter.trim();
  const fmLines = fm ? fm.split("\n") : [];
  if (!fmLines.some((l) => l.startsWith(FRONTMATTER_KEY + ":"))) fmLines.unshift(`${FRONTMATTER_KEY}: 1`);

  const out: string[] = ["---", ...fmLines, "---", ""];

  const textParts: string[] = [];
  const fileLines: string[] = [];
  doc.pages.forEach((page, i) => {
    const texts = page.elements.filter((e) => e.type === "text" && e.md.trim() !== "");
    if (texts.length > 0) {
      textParts.push(`### Trang ${i + 1}`, "");
      for (const t of texts) if (t.type === "text") textParts.push(t.md.trim(), "");
    }
    for (const e of page.elements) if (e.type === "image") fileLines.push(`- ${e.id}: [[${e.src}]]`);
  });

  out.push("## Text", "");
  if (textParts.length > 0) out.push(...textParts);
  if (fileLines.length > 0) out.push(FILES_HEADING.trim(), ...fileLines, "");

  const data = {
    version: 1,
    pages: doc.pages.map((p) => ({
      id: p.id,
      template: p.template,
      elements: p.elements.map((e) => (e.type === "stroke" ? { ...e, points: encodePoints(e.points) } : e)),
    })),
  };
  out.push("%%", DATA_HEADING + JSON.stringify(data), "```", "%%", "");
  return out.join("\n");
}
