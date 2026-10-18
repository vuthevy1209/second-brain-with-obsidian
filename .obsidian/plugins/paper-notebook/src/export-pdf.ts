import { arrayBufferToBase64, Component, MarkdownRenderer, normalizePath, TFile } from "obsidian";
import { notebookTitle } from "./format";
import { NotebookDoc } from "./model";
import { createPageLayers, renderPage, RenderContext, setPageNumber } from "./render/page";
import type PaperNotebookPlugin from "./main";

// Export dùng đúng hàm renderPage như trên màn hình, chỉ khác là in ở tỉ lệ 1:1
// (210mm × 297mm) bằng Chromium của Electron ⇒ PDF giống hệt những gì thấy trong app.

const EXPORT_CSS = `
@page { size: 210mm 297mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body > .pn-page {
  position: relative !important;
  transform: none !important;
  box-shadow: none !important;
  break-after: page;
  page-break-after: always;
}
body > .pn-page:last-child { break-after: auto; page-break-after: auto; }
`;

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  avif: "image/avif",
};

export async function exportNotebookPdf(plugin: PaperNotebookPlugin, file: TFile, doc: NotebookDoc): Promise<TFile> {
  const { app } = plugin;
  const html = await buildHtml(plugin, file, doc);
  const pdf = await printToPdf(html);

  const folder = plugin.settings.exportFolder || file.parent?.path || "";
  const path = normalizePath(`${folder ? folder + "/" : ""}${notebookTitle(file.basename)}.pdf`);
  if (folder && !app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
  const data = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) {
    await app.vault.modifyBinary(existing, data);
    return existing;
  }
  return app.vault.createBinary(path, data);
}

async function buildHtml(plugin: PaperNotebookPlugin, file: TFile, doc: NotebookDoc): Promise<string> {
  const { app } = plugin;
  const holder = document.body.createDiv({ cls: "pn-export-holder" });
  const component = new Component();
  component.load();
  const ctx: RenderContext = {
    // Ảnh nhúng thẳng vào HTML dạng base64, giữ nguyên độ phân giải gốc
    imageUrl: async (src) => {
      const f = app.metadataCache.getFirstLinkpathDest(src, file.path) ?? app.vault.getAbstractFileByPath(src);
      if (!(f instanceof TFile)) return null;
      const mime = MIME[f.extension.toLowerCase()] ?? "application/octet-stream";
      return `data:${mime};base64,${arrayBufferToBase64(await app.vault.readBinary(f))}`;
    },
    renderMarkdown: (md, el) => MarkdownRenderer.render(app, md, el, file.path, component),
  };
  try {
    for (const [i, page] of doc.pages.entries()) {
      const layers = createPageLayers();
      setPageNumber(layers, plugin.settings.showPageNumbers ? i + 1 : null);
      holder.appendChild(layers.root);
      await renderPage(layers, page, ctx);
    }
    // Đợi post-processor (MathJax, …) chạy xong
    await new Promise((r) => window.setTimeout(r, 100));

    const css = await app.vault.adapter.read(`${plugin.manifest.dir}/styles.css`);
    const extra = Array.from(document.querySelectorAll("style"))
      .filter((s) => /^MJX/i.test(s.id))
      .map((s) => s.textContent ?? "")
      .join("\n");
    const title = notebookTitle(file.basename).replace(/[<&]/g, "");
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${css}\n${extra}\n${EXPORT_CSS}</style></head><body>${holder.innerHTML}</body></html>`;
  } finally {
    component.unload();
    holder.remove();
  }
}

/** In HTML ra PDF bằng một cửa sổ Electron ẩn */
async function printToPdf(html: string): Promise<Uint8Array> {
  const electron = (window as any).require("electron");
  const remote = electron.remote;
  if (!remote?.BrowserWindow) throw new Error("Không truy cập được Electron để in PDF.");
  const fs = (window as any).require("fs") as typeof import("fs");
  const os = (window as any).require("os") as typeof import("os");
  const path = (window as any).require("path") as typeof import("path");
  const url = (window as any).require("url") as typeof import("url");

  const tmp = path.join(os.tmpdir(), `paper-notebook-${Date.now()}.html`);
  await fs.promises.writeFile(tmp, html, "utf8");
  const win = new remote.BrowserWindow({
    show: false,
    width: 800,
    height: 1130,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  try {
    await win.loadURL(url.pathToFileURL(tmp).href);
    await win.webContents.executeJavaScript(
      "Promise.all([document.fonts.ready, ...Array.from(document.images).map(i => i.decode().catch(() => {}))]).then(() => true)"
    );
    const data = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return new Uint8Array(data);
  } finally {
    win.destroy();
    fs.promises.unlink(tmp).catch(() => {});
  }
}
