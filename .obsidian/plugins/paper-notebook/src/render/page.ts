import { ImageElement, Page, PAGE_H, PAGE_W, TextElement } from "../model";
import { strokeSvg } from "./ink";
import { PaperRhythm, paperRhythm, templateSvg, textLineHeight } from "./templates";

// Một trang = div 210mm × 297mm, các lớp chồng lên nhau theo thứ tự:
// nền giấy → ảnh → highlighter → chữ → nét bút. Mọi vị trí tính bằng mm nên
// trên màn hình chỉ cần scale cả trang, còn khi in PDF thì đúng kích thước thật.
// Hàm render này dùng chung cho màn hình và export PDF.

export interface RenderContext {
  /** URL để hiển thị ảnh, null nếu không tìm thấy file */
  imageUrl(src: string): string | null | Promise<string | null>;
  renderMarkdown(md: string, el: HTMLElement): Promise<void>;
}

export interface PageLayers {
  root: HTMLElement;
  bg: SVGSVGElement;
  images: HTMLElement;
  highlights: SVGSVGElement;
  texts: HTMLElement;
  /** Số trang in ở chân trang giấy (in ra cả PDF) */
  number: HTMLElement;
  ink: SVGSVGElement;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgLayer(cls: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", `pn-layer ${cls}`);
  svg.setAttribute("viewBox", `0 0 ${PAGE_W} ${PAGE_H}`);
  svg.setAttribute("preserveAspectRatio", "none");
  return svg;
}

export function createPageLayers(): PageLayers {
  const root = createDiv({ cls: "pn-page" });
  const bg = svgLayer("pn-bg");
  const images = createDiv({ cls: "pn-layer pn-images" });
  const highlights = svgLayer("pn-highlights");
  const texts = createDiv({ cls: "pn-layer pn-texts" });
  const number = createDiv({ cls: "pn-page-number" });
  const ink = svgLayer("pn-ink");
  root.append(bg, images, highlights, texts, number, ink);
  return { root, bg, images, highlights, texts, number, ink };
}

/** null = không đánh số */
export function setPageNumber(layers: PageLayers, n: number | null) {
  layers.number.setText(n === null ? "" : String(n));
}

interface RenderCache {
  template?: string;
  nodes: Map<string, { key: string; node: HTMLElement }>;
}
const caches = new WeakMap<PageLayers, RenderCache>();

/**
 * Vẽ lại nội dung trang. Nét bút vẽ lại toàn bộ (rẻ), còn ảnh và text box
 * chỉ dựng lại cái nào thay đổi để không bị nháy.
 */
export async function renderPage(layers: PageLayers, page: Page, ctx: RenderContext, hidden?: Set<string>) {
  let cache = caches.get(layers);
  if (!cache) {
    cache = { nodes: new Map() };
    caches.set(layers, cache);
  }

  if (cache.template !== page.template) {
    layers.bg.innerHTML = templateSvg(page.template);
    cache.template = page.template;
  }

  const rhythm = paperRhythm(page.template);
  const pen: string[] = [];
  const hl: string[] = [];
  for (const el of page.elements) {
    if (el.type !== "stroke" || hidden?.has(el.id)) continue;
    (el.tool === "highlighter" ? hl : pen).push(strokeSvg(el));
  }
  layers.ink.innerHTML = pen.join("");
  layers.highlights.innerHTML = hl.join("");

  const seen = new Set<string>();
  const jobs: Promise<void>[] = [];
  for (const el of page.elements) {
    if (el.type === "stroke") continue;
    seen.add(el.id);
    // Chỉ dựng lại khi nội dung đổi; đổi vị trí/kích thước thì cập nhật tại chỗ
    const key = el.type === "text" ? `t:${el.md}` : `i:${el.src}`;
    const cached = cache.nodes.get(el.id);
    if (cached && cached.key === key) {
      if (el.type === "text") positionText(cached.node, el, textLineHeight(el.fontSize, rhythm));
      else positionImage(cached.node, el);
      cached.node.toggleClass("pn-hidden", !!hidden?.has(el.id));
      continue;
    }
    cached?.node.remove();
    const node = el.type === "text" ? createTextNode(el, rhythm) : createImageNode(el);
    node.toggleClass("pn-hidden", !!hidden?.has(el.id));
    (el.type === "text" ? layers.texts : layers.images).appendChild(node);
    cache.nodes.set(el.id, { key, node });
    if (el.type === "text") jobs.push(ctx.renderMarkdown(el.md, node.querySelector(".pn-md") as HTMLElement));
    else jobs.push(loadImage(node as HTMLImageElement, el, ctx));
  }
  for (const [id, entry] of cache.nodes) {
    if (!seen.has(id)) {
      entry.node.remove();
      cache.nodes.delete(id);
    }
  }
  // Giữ đúng thứ tự xếp chồng theo thứ tự trong dữ liệu
  for (const el of page.elements) {
    const entry = cache.nodes.get(el.id);
    if (entry) entry.node.parentElement?.appendChild(entry.node);
  }
  await Promise.all(jobs);
}

/** Xoá cache để lần render sau dựng lại toàn bộ (ví dụ khi file ảnh đổi) */
export function resetPageCache(layers: PageLayers) {
  caches.delete(layers);
  layers.images.empty();
  layers.texts.empty();
}

/** lineHeight: mm theo nhịp dòng của giấy (xem textLineHeight), null = giấy trắng */
export function positionText(node: HTMLElement, el: TextElement, lineHeight: number | null) {
  node.style.left = `${el.x}mm`;
  node.style.top = `${el.y}mm`;
  // w là chiều rộng tối đa: hộp co theo nội dung, dài quá thì xuống dòng ở mức này
  node.style.width = "";
  node.style.maxWidth = `${el.w}mm`;
  node.style.fontSize = `${el.fontSize}pt`;
  node.style.lineHeight = lineHeight ? `${lineHeight}mm` : "";
  if (lineHeight) node.style.setProperty("--pn-lh", `${lineHeight}mm`);
  else node.style.removeProperty("--pn-lh");
  node.style.color = el.color;
  node.style.transform = "";
}

function createTextNode(el: TextElement, rhythm: PaperRhythm | null): HTMLElement {
  const node = createDiv({ cls: "pn-text", attr: { "data-id": el.id } });
  positionText(node, el, textLineHeight(el.fontSize, rhythm));
  node.createDiv({ cls: "pn-md" });
  return node;
}

export function positionImage(node: HTMLElement, el: ImageElement) {
  node.style.left = `${el.x}mm`;
  node.style.top = `${el.y}mm`;
  node.style.width = `${el.w}mm`;
  node.style.height = `${el.h}mm`;
  node.style.transform = "";
}

function createImageNode(el: ImageElement): HTMLElement {
  const img = document.createElement("img");
  img.className = "pn-image";
  img.setAttribute("data-id", el.id);
  img.draggable = false;
  positionImage(img, el);
  return img;
}

async function loadImage(img: HTMLImageElement, el: ImageElement, ctx: RenderContext) {
  const url = await ctx.imageUrl(el.src);
  if (!url) {
    img.addClass("pn-image-missing");
    img.alt = `Không tìm thấy ảnh: ${el.src}`;
    return;
  }
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
