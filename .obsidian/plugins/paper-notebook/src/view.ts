import { MarkdownRenderer, Menu, Notice, Scope, setIcon, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { isNotebookPath, notebookTitle, parseNotebook, serializeNotebook } from "./format";
import {
  clone,
  ImageElement,
  InkPoint,
  newDoc,
  newId,
  newPage,
  NotebookElement,
  NotebookStore,
  Op,
  PAGE_H,
  PAGE_W,
  Template,
  TEMPLATES,
  TextElement,
} from "./model";
import { strokeBounds } from "./render/ink";
import { paperRhythm, textLineHeight } from "./render/templates";
import { createPageLayers, renderPage, RenderContext, setPageNumber } from "./render/page";
import { openPaperPicker, PaperPickerHandle, PaperPickerOptions } from "./ui/paper-picker";
import { Ruler, RulerEdge } from "./ui/ruler";
import { EraserTool } from "./tools/eraser";
import { LassoTool, translated } from "./tools/lasso";
import { PenTool } from "./tools/pen";
import { TextEditor, TextTool } from "./tools/text";
import { PageView, Pt, Rect, RulerEdgeMm, SVG_NS, Tool, ToolHost, ToolId, ToolOptions } from "./tools/types";
import type PaperNotebookPlugin from "./main";

export const VIEW_TYPE = "paper-notebook";
export const NOTEBOOK_ICON = "notebook-pen";

/** Số pixel CSS trên 1mm */
export const PX_PER_MM = 96 / 25.4;
const FIT_MAX_ZOOM = 1.25;
/** Khi tự cuộn tới trang: chừa khoảng này phía trên để mép giấy không bị thanh công cụ nổi che */
const SCROLL_TOP_GAP = 68;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
/** Tốc độ zoom khi Ctrl/Cmd + cuộn (trước đây 0.01 — quá nhanh) */
const ZOOM_WHEEL_SPEED = 0.004;
const ZOOM_WHEEL_MAX_DELTA = 25;

const PEN_COLORS = ["#1a1a1a", "#1f5fbf", "#d93025", "#188038", "#7b3fe4", "#e8710a"];
const HIGHLIGHTER_COLORS = ["#ffd60a", "#7bf1a8", "#ff8fab", "#8ecae6"];
const PEN_SIZES = [0.35, 0.6, 1];
const HIGHLIGHTER_SIZES = [4, 6, 9];
const FONT_SIZES = [9, 11, 14, 18, 24];
/** Bán kính cục tẩy, pixel màn hình */
const ERASER_SIZES = [5, 9, 15];
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];

const TOOLS: { id: ToolId; icon: string; title: string; key?: string }[] = [
  { id: "pointer", icon: "mouse-pointer-2", title: "Chọn trang", key: "v" },
  { id: "hand", icon: "hand", title: "Bàn tay: kéo để cuộn (hoặc giữ Space)" },
  { id: "pen", icon: "pencil", title: "Bút", key: "p" },
  { id: "highlighter", icon: "highlighter", title: "Bút highlight", key: "h" },
  { id: "eraser", icon: "eraser", title: "Tẩy", key: "e" },
  { id: "lasso", icon: "lasso-select", title: "Chọn / di chuyển", key: "l" },
  { id: "text", icon: "type", title: "Text box", key: "t" },
];

type PageReveal = "scroll" | "glide" | "stay";

// Dùng chung giữa các notebook để copy từ notebook này dán sang notebook khác
const CLIP_MARKER = "paper-notebook:elements";
let clipboard: { elements: NotebookElement[]; pageId: string } | null = null;

export class NotebookView extends TextFileView implements ToolHost {
  store = new NotebookStore(newDoc("lined"));
  options: ToolOptions = {
    pen: { color: PEN_COLORS[0], size: PEN_SIZES[1] },
    highlighter: { color: HIGHLIGHTER_COLORS[0], size: HIGHLIGHTER_SIZES[1] },
    text: { color: PEN_COLORS[0], fontSize: 11 },
    eraser: { size: ERASER_SIZES[1] },
  };
  zoom = 1;
  currentPageId: string | null = null;

  private frontmatter = "";
  private raw = "";
  private loadError: string | null = null;
  private pageViews = new Map<string, PageView>();
  private hidden = new Map<string, Set<string>>();
  private toolId: ToolId = "pen";
  private tools: Record<ToolId, Tool>;
  private lasso: LassoTool;
  private active: { pv: PageView; pointerId: number } | null = null;
  private textEditor: TextEditor | null = null;
  private fitWidth = true;
  private optionsOpen = false;
  /** requestAnimationFrame id của lần tự cuộn đang chạy */
  private glide: number | null = null;
  private selectedPageId: string | null = null;
  private picker: PaperPickerHandle | null = null;
  private ruler: Ruler | null = null;
  private baselineCache = new Map<string, number>();
  private spaceHeld = false;
  private pan: { pointerId: number; x: number; y: number; left: number; top: number } | null = null;
  private thumbTimers = new Map<string, number>();
  private ctx: RenderContext;

  private ui: {
    root: HTMLElement;
    palette: HTMLElement;
    toolButtons: Map<ToolId, HTMLElement>;
    options: HTMLElement;
    collapse: HTMLElement;
    rulerBtn: HTMLElement;
    pageActions: { bar: HTMLElement; label: HTMLElement; remove: HTMLElement };
    stage: HTMLElement;
    undo: HTMLElement;
    redo: HTMLElement;
    zoomLabel: HTMLElement;
    body: HTMLElement;
    sidebar: HTMLElement;
    scroller: HTMLElement;
    pages: HTMLElement;
    addPage: HTMLElement;
    error: HTMLElement;
  } | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: PaperNotebookPlugin) {
    super(leaf);
    this.lasso = new LassoTool(this, () => {
      this.renderToolOptions();
      if (this.toolId === "lasso") this.setOptionsOpen(!!this.lasso.selection);
    });
    // Con trỏ và bàn tay không vẽ gì lên trang, view tự xử lý
    const none: Tool = { down() {} };
    this.tools = {
      pointer: none,
      hand: none,
      pen: new PenTool(this, "pen"),
      highlighter: new PenTool(this, "highlighter"),
      eraser: new EraserTool(this),
      lasso: this.lasso,
      text: new TextTool(this),
    };
    this.ctx = {
      imageUrl: (src) => {
        const f = this.resolveImage(src);
        return f ? this.app.vault.getResourcePath(f) : null;
      },
      renderMarkdown: (md, el) => MarkdownRenderer.render(this.app, md, el, this.file?.path ?? "", this),
    };
    this.store.onChange((change) => {
      if (change.structure) this.syncPages();
      for (const id of change.pages) this.rerender(id);
      this.lasso.refresh();
      this.updateToolbarState();
      this.requestSave();
    });
    this.registerKeys();
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getIcon() {
    return NOTEBOOK_ICON;
  }

  getDisplayText() {
    return this.file ? notebookTitle(this.file.basename) : "Notebook";
  }

  // Không nhận file theo đuôi: mọi file .md (kể cả .notebook.md) đều đi qua
  // setViewState, nơi open-patch chỉ chuyển .notebook.md sang view này.
  // Trả true ở đây làm Obsidian tái dùng view notebook để mở file .md thường.
  canAcceptExtension(_extension: string) {
    return false;
  }

  async onLoadFile(file: TFile) {
    // Chốt chặn: lỡ bị giao một file .md thường thì trả nó về view markdown
    if (!isNotebookPath(file.path)) {
      window.setTimeout(() => this.leaf.setViewState({ type: "markdown", state: { file: file.path }, active: true }), 0);
      return;
    }
    await super.onLoadFile(file);
  }

  async onUnloadFile(file: TFile) {
    // Không bao giờ ghi dữ liệu notebook vào một file .md thường
    if (!isNotebookPath(file.path)) return;
    await super.onUnloadFile(file);
  }

  async save(clear?: boolean) {
    if (this.file && !isNotebookPath(this.file.path)) return;
    await super.save(clear);
  }

  async onOpen() {
    await super.onOpen();
    this.ensureUI();
  }

  async onClose() {
    this.picker?.close();
    this.textEditor?.finish();
    await super.onClose();
  }

  onResize() {
    if (this.fitWidth) this.fit();
    this.ruler?.layout();
  }

  // ---------- Đọc / ghi file ----------

  getViewData(): string {
    this.textEditor?.finish();
    // Đọc file lỗi thì trả lại nguyên văn để không ghi đè mất dữ liệu
    if (this.loadError) return this.raw;
    return serializeNotebook(this.store.doc, this.frontmatter);
  }

  setViewData(data: string, clear: boolean) {
    this.ensureUI();
    this.raw = data;
    this.picker?.close();
    this.textEditor = null;
    try {
      const parsed = parseNotebook(data, this.plugin.settings.defaultTemplate);
      this.loadError = null;
      this.frontmatter = parsed.frontmatter;
      this.store.load(parsed.doc);
    } catch (err) {
      console.error("[paper-notebook] Không đọc được notebook", err);
      this.loadError = err instanceof Error ? err.message : String(err);
    }
    this.showError();
    if (clear) this.currentPageId = null;
    this.rebuildPages();
    if (!this.loadError && data.trim() === "") this.requestSave();
    if (clear && this.fitWidth) window.requestAnimationFrame(() => this.fit());
  }

  clear() {
    this.store.load(newDoc(this.plugin.settings.defaultTemplate));
    this.frontmatter = "";
    this.raw = "";
    this.loadError = null;
    this.lasso.clear();
    this.rebuildPages();
  }

  // ---------- Dựng giao diện ----------

  private ensureUI() {
    if (this.ui) return;
    const root = this.contentEl;
    root.empty();
    root.addClass("pn-root");
    root.tabIndex = -1;

    // Zoom, export, danh sách trang đặt chung hàng với nút "⋯" trên thanh tiêu đề của
    // Obsidian. addAction chèn nút mới vào bên trái nút trước, nên thêm từ phải sang trái.
    this.addAction("panel-right", "Hiện/ẩn danh sách trang", () => this.toggleSidebar());
    this.addAction("file-down", "Export PDF", () => this.plugin.exportPdf(this)).addClass("pn-action-gap");
    this.addAction("zoom-in", "Phóng to (Mod+=)", () => this.zoomBy(1.2));
    const zoomLabel = this.addAction("zoom-in", "Vừa khung (Mod+0)", () => this.fit());
    zoomLabel.empty();
    zoomLabel.addClass("pn-zoom-action");
    this.addAction("zoom-out", "Thu nhỏ (Mod+-)", () => this.zoomBy(1 / 1.2));

    const body = root.createDiv({ cls: "pn-body" });
    const sidebar = body.createDiv({ cls: "pn-sidebar" });
    // Khung chứa vùng cuộn; thanh công cụ, thanh thao tác trang và thước nổi trên khung này
    const stage = body.createDiv({ cls: "pn-stage" });
    const scroller = stage.createDiv({ cls: "pn-scroller" });
    this.ruler = new Ruler(stage, {
      pxPerMm: () => PX_PER_MM * this.zoom,
      onStamp: (edge) => this.stampRuler(edge),
      onWheel: (e) => {
        if (!this.zoomWheel(e)) this.ui?.scroller.scrollBy({ left: e.deltaX, top: e.deltaY });
      },
    });
    const pages = scroller.createDiv({ cls: "pn-pages" });
    const addPage = pages.createEl("button", { cls: "pn-add-page", attr: { "aria-label": "Thêm trang" } });
    setIcon(addPage, "plus");
    addPage.addEventListener("click", () => this.pickTemplateAndAdd(this.store.doc.pages.length, "glide"));

    // Thanh công cụ nổi ngay trên vùng viết, kiểu Excalidraw (số nhỏ ở góc là phím tắt)
    const palette = stage.createDiv({ cls: "pn-palette" });
    const toolsRow = palette.createDiv({ cls: "pn-palette-row pn-palette-tools" });
    const toolButtons = new Map<ToolId, HTMLElement>();
    TOOLS.forEach((t, i) => {
      const keys = [String(i + 1), t.key?.toUpperCase()].filter(Boolean).join(" hoặc ");
      const btn = toolsRow.createEl("button", { cls: "pn-tool", attr: { "aria-label": `${t.title} — ${keys}` } });
      setIcon(btn.createSpan({ cls: "pn-tool-icon" }), t.icon);
      btn.createSpan({ cls: "pn-tool-key", text: String(i + 1) });
      // Bấm lại vào công cụ đang chọn thì mở bảng màu / cỡ nét
      btn.addEventListener("click", () => (t.id === this.toolId ? this.setOptionsOpen(!this.optionsOpen) : this.setTool(t.id)));
      toolButtons.set(t.id, btn);
      if (t.id === "hand") toolsRow.createDiv({ cls: "pn-divider" });
    });
    toolsRow.createDiv({ cls: "pn-divider" });
    paletteButton(toolsRow, "image-plus", "Chèn ảnh", () => this.pickImage());
    const rulerBtn = paletteButton(toolsRow, "ruler", "Thước kẻ (R)", () => this.toggleRuler());
    toolsRow.createDiv({ cls: "pn-divider" });
    const undo = paletteButton(toolsRow, "undo-2", "Hoàn tác (Mod+Z)", () => this.store.undo());
    const redo = paletteButton(toolsRow, "redo-2", "Làm lại (Mod+Shift+Z)", () => this.store.redo());
    toolsRow.createDiv({ cls: "pn-divider" });
    const collapse = paletteButton(toolsRow, "chevron-down", "Màu và cỡ nét", () => this.setOptionsOpen(!this.optionsOpen));
    const options = palette.createDiv({ cls: "pn-palette-row pn-palette-options" });

    const pageActions = this.createPageActions();
    const error = root.createDiv({ cls: "pn-error" });

    this.ui = { root, palette, toolButtons, options, collapse, rulerBtn, pageActions, stage, undo, redo, zoomLabel, body, sidebar, scroller, pages, addPage, error };
    root.toggleClass("pn-sidebar-hidden", !this.plugin.settings.showSidebar);
    this.applyZoom();
    this.setTool(this.toolId);
    this.registerInput();
  }

  private showError() {
    const ui = this.ui!;
    ui.root.toggleClass("pn-has-error", !!this.loadError);
    ui.error.empty();
    if (!this.loadError) return;
    ui.error.createEl("h3", { text: "Không mở được notebook" });
    ui.error.createEl("p", { text: this.loadError });
    ui.error.createEl("p", { text: "File chưa bị thay đổi. Bạn có thể mở dạng markdown để sửa phần ## Notebook Data." });
    const btn = ui.error.createEl("button", { cls: "mod-cta", text: "Mở dạng markdown" });
    btn.addEventListener("click", () => this.plugin.openAsMarkdown(this.leaf));
  }

  private toggleSidebar() {
    const hidden = !this.ui!.root.hasClass("pn-sidebar-hidden");
    this.ui!.root.toggleClass("pn-sidebar-hidden", hidden);
    this.plugin.settings.showSidebar = !hidden;
    this.plugin.saveSettings();
    if (this.fitWidth) this.fit();
  }

  /** Bảng màu / cỡ nét hiện dạng popover ngay dưới thanh công cụ */
  private setOptionsOpen(open: boolean) {
    const ui = this.ui;
    if (!ui) return;
    this.optionsOpen = open && ui.options.childElementCount > 0;
    ui.palette.toggleClass("is-open", this.optionsOpen);
    setIcon(ui.collapse, this.optionsOpen ? "chevron-up" : "chevron-down");
  }

  setTool(id: ToolId) {
    if (id !== this.toolId) {
      this.tools[this.toolId].deactivate?.();
      this.textEditor?.finish();
    }
    this.toolId = id;
    if (id !== "pointer") this.selectPage(null);
    const ui = this.ui!;
    for (const [tid, btn] of ui.toolButtons) btn.toggleClass("is-active", tid === id);
    for (const t of TOOLS) ui.root.toggleClass(`pn-tool-${t.id}`, t.id === id);
    this.renderToolOptions();
    this.setOptionsOpen(false);
  }

  /** Màu của công cụ hiện tại, hiện ở icon và gạch chân dưới icon */
  private updateToolColors() {
    const ui = this.ui!;
    const colorOf: Partial<Record<ToolId, string>> = {
      pen: this.options.pen.color,
      highlighter: this.options.highlighter.color,
      text: this.options.text.color,
    };
    for (const [tid, btn] of ui.toolButtons) {
      const c = colorOf[tid];
      if (c) {
        btn.style.setProperty("--pn-tool-color", c);
        // Màu quá nhạt (vàng highlight…) thì icon dùng màu chữ, chỉ gạch dưới mang màu
        btn.style.setProperty("--pn-tool-icon", isLight(c) ? "var(--text-normal)" : c);
      } else {
        btn.style.removeProperty("--pn-tool-color");
        btn.style.removeProperty("--pn-tool-icon");
      }
    }
  }

  /** Hàng dưới của palette: màu và cỡ nét của công cụ đang chọn */
  private renderToolOptions() {
    const ui = this.ui;
    if (!ui) return;
    const el = ui.options;
    el.empty();
    this.updateToolColors();
    const id = this.toolId;
    const rerender = () => this.renderToolOptions();

    if (id === "pen" || id === "highlighter") {
      const opts = this.options[id];
      this.colorRow(el, id === "pen" ? PEN_COLORS : HIGHLIGHTER_COLORS, opts.color, (c) => {
        opts.color = c;
        rerender();
      });
      el.createDiv({ cls: "pn-divider" });
      const sizes = id === "pen" ? PEN_SIZES : HIGHLIGHTER_SIZES;
      this.sizeRow(el, sizes, opts.size, (s) => `${s} mm`, (s, i) => 6 + i * 4, (s) => {
        opts.size = s;
        rerender();
      });
    } else if (id === "eraser") {
      this.sizeRow(el, ERASER_SIZES, this.options.eraser.size, (s) => `Tẩy ${s}px`, (s, i) => 6 + i * 4, (s) => {
        this.options.eraser.size = s;
        rerender();
      }, true);
    } else if (id === "text") {
      const opts = this.options.text;
      this.colorRow(el, PEN_COLORS, opts.color, (c) => {
        opts.color = c;
        rerender();
      });
      el.createDiv({ cls: "pn-divider" });
      const step = (dir: number) => {
        const i = FONT_SIZES.indexOf(opts.fontSize);
        opts.fontSize = FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, (i < 0 ? 1 : i) + dir))];
        rerender();
      };
      paletteButton(el, "a-arrow-down", "Chữ nhỏ hơn", () => step(-1));
      el.createSpan({ cls: "pn-font-size", text: `${opts.fontSize} pt` });
      paletteButton(el, "a-arrow-up", "Chữ to hơn", () => step(1));
    } else if (id === "pointer") {
      el.createSpan({ cls: "pn-hint", text: "Bấm vào một trang để chọn, rồi chèn trên / dưới, nhân bản hoặc xoá" });
    } else if (id === "hand") {
      el.createSpan({ cls: "pn-hint", text: "Kéo để di chuyển. Ở công cụ khác, giữ Space hoặc kéo chuột giữa" });
    } else if (id === "lasso") {
      if (this.lasso.selection) {
        this.colorRow(el, PEN_COLORS, null, (c) => this.lasso.setColor(c));
        el.createDiv({ cls: "pn-divider" });
        paletteButton(el, "copy", "Nhân bản (Mod+D)", () => this.duplicateSelection());
        paletteButton(el, "trash-2", "Xoá (Delete)", () => this.lasso.deleteSelection());
      } else {
        el.createSpan({ cls: "pn-hint", text: "Khoanh vùng hoặc bấm vào nét để chọn" });
      }
    }
  }

  private colorRow(el: HTMLElement, colors: string[], active: string | null, onPick: (c: string) => void) {
    const list = active && !colors.includes(active) ? [...colors, active] : colors;
    for (const c of list) {
      const b = el.createEl("button", { cls: "pn-color", attr: { "aria-label": c } });
      b.style.setProperty("--pn-swatch", c);
      if (c === active) {
        b.addClass("is-active");
        const check = b.createSpan({ cls: "pn-color-check" });
        setIcon(check, "check");
        check.style.color = isLight(c) ? "#1a1a1a" : "#ffffff";
      }
      b.addEventListener("click", () => onPick(c));
    }
    // Nút "+" mở bảng chọn màu của hệ thống
    const add = el.createEl("button", { cls: "pn-color-add", attr: { "aria-label": "Màu khác" } });
    setIcon(add, "plus");
    const input = add.createEl("input", { attr: { type: "color", tabindex: "-1" } });
    input.value = active && /^#[0-9a-f]{6}$/i.test(active) ? active : "#000000";
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", () => onPick(input.value));
    add.addEventListener("click", () => input.click());
  }

  private sizeRow(
    el: HTMLElement,
    sizes: number[],
    active: number,
    label: (s: number) => string,
    dotPx: (s: number, i: number) => number,
    onPick: (s: number) => void,
    hollow = false
  ) {
    sizes.forEach((s, i) => {
      const b = el.createEl("button", { cls: "pn-size", attr: { "aria-label": label(s) } });
      const dot = b.createSpan({ cls: hollow ? "pn-size-dot is-hollow" : "pn-size-dot" });
      dot.style.width = dot.style.height = `${dotPx(s, i)}px`;
      b.toggleClass("is-active", s === active);
      b.addEventListener("click", () => onPick(s));
    });
  }

  private updateToolbarState() {
    const ui = this.ui;
    if (!ui) return;
    ui.undo.toggleClass("is-disabled", !this.store.canUndo);
    ui.redo.toggleClass("is-disabled", !this.store.canRedo);
    ui.sidebar.querySelectorAll(".pn-thumb").forEach((t) => {
      t.toggleClass("is-active", t.getAttribute("data-page-id") === this.currentPageId);
    });
  }

  // ---------- Trang ----------

  private rebuildPages() {
    for (const pv of this.pageViews.values()) pv.item.remove();
    this.pageViews.clear();
    this.hidden.clear();
    this.lasso.clear();
    if (!this.loadError) this.syncPages();
    else this.ui!.sidebar.empty();
    this.updateToolbarState();
  }

  /** Đồng bộ danh sách trang trên màn hình với dữ liệu (thêm/xoá/đổi thứ tự) */
  private syncPages() {
    const ui = this.ui!;
    const pages = this.store.doc.pages;
    for (const [id, pv] of this.pageViews) {
      if (!pages.some((p) => p.id === id)) {
        pv.item.remove();
        this.pageViews.delete(id);
        this.hidden.delete(id);
      }
    }
    pages.forEach((page, i) => {
      let pv = this.pageViews.get(page.id);
      if (!pv) {
        pv = this.createPageView(page.id);
        this.pageViews.set(page.id, pv);
        this.rerender(page.id);
      }
      ui.pages.insertBefore(pv.item, ui.addPage);
      setPageNumber(pv.layers, this.plugin.settings.showPageNumbers ? i + 1 : null);
    });
    if (!this.currentPageId || !this.pageViews.has(this.currentPageId)) this.currentPageId = pages[0]?.id ?? null;
    this.syncThumbs();
    this.selectPage(this.selectedPageId);
  }

  private createPageView(pageId: string): PageView {
    const item = createDiv({ cls: "pn-page-item" });
    const wrap = item.createDiv({ cls: "pn-page-wrap", attr: { "data-page-id": pageId } });
    const layers = createPageLayers();
    wrap.appendChild(layers.root);
    const overlay = document.createElementNS(SVG_NS, "svg");
    overlay.setAttribute("class", "pn-layer pn-overlay");
    overlay.setAttribute("viewBox", `0 0 ${PAGE_W} ${PAGE_H}`);
    overlay.setAttribute("preserveAspectRatio", "none");
    layers.root.appendChild(overlay);
    return { id: pageId, item, wrap, layers, overlay };
  }

  rerender(pageId: string) {
    const pv = this.pageViews.get(pageId);
    const page = this.store.page(pageId);
    if (!pv || !page) return;
    renderPage(pv.layers, page, this.ctx, this.hidden.get(pageId)).catch((err) =>
      console.error("[paper-notebook] Lỗi khi vẽ trang", err)
    );
    this.scheduleThumb(pageId);
  }

  pageView(pageId: string) {
    return this.pageViews.get(pageId);
  }

  hiddenOn(pageId: string): Set<string> {
    let set = this.hidden.get(pageId);
    if (!set) {
      set = new Set();
      this.hidden.set(pageId, set);
    }
    return set;
  }

  /**
   * reveal: cách đưa trang mới vào tầm nhìn
   *  - "scroll": cuộn tới trang mới (chèn trên/dưới, menu chuột phải)
   *  - "glide":  cuộn từ từ xuống trang mới (nút ⊕ cuối notebook)
   *  - "stay":   giữ nguyên chỗ đang xem, không hiệu ứng (nút ⊕ ở thanh thumbnail)
   */
  private addPage(index: number, template?: Template, reveal: PageReveal = "scroll") {
    const page = newPage(template ?? this.plugin.settings.defaultTemplate);
    const scroller = this.ui!.scroller;
    const keepTop = scroller.scrollTop;
    this.store.commit([{ type: "addPage", index, page }]);
    if (reveal === "scroll") this.scrollToPage(page.id);
    else {
      scroller.scrollTop = keepTop;
      if (reveal === "glide") this.glideToPage(page.id);
    }
    if (this.toolId === "pointer") this.selectPage(page.id);
  }

  /** Cuộn từ từ từ chỗ đang xem xuống tới đầu trang mới */
  private glideToPage(pageId: string) {
    const pv = this.pageViews.get(pageId);
    const scroller = this.ui!.scroller;
    if (!pv) return;
    this.currentPageId = pageId;
    this.updateToolbarState();
    const from = scroller.scrollTop;
    const offset = pv.item.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    const to = Math.max(0, Math.min(from + offset - SCROLL_TOP_GAP, scroller.scrollHeight - scroller.clientHeight));
    this.stopGlide();
    if (Math.abs(to - from) < 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scroller.scrollTop = to;
      return;
    }
    // Trong lúc tự cuộn, giữ nguyên trang được chọn làm trang hiện tại để
    // thumbnail không bị highlight lần lượt qua các trang ở giữa
    const duration = Math.min(1100, 450 + Math.abs(to - from) * 0.4);
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // nhanh lúc đầu, chậm dần khi tới nơi
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      scroller.scrollTop = from + (to - from) * ease(t);
      this.glide = t < 1 ? window.requestAnimationFrame(step) : null;
    };
    this.glide = window.requestAnimationFrame(step);
  }

  /** Dừng tự cuộn (khi người dùng tự cuộn hoặc bắt đầu tự cuộn tới trang khác) */
  private stopGlide() {
    if (this.glide !== null) window.cancelAnimationFrame(this.glide);
    this.glide = null;
  }

  /** Hỏi loại giấy bằng hộp thoại của notebook rồi mới thêm trang */
  private pickTemplateAndAdd(index: number, reveal: PageReveal = "scroll") {
    this.openPicker({ title: "Chọn loại giấy", current: null, onPick: (template) => this.addPage(index, template, reveal) });
  }

  /** Hộp thoại chọn giấy phủ lên khung notebook (không dùng Modal của Obsidian) */
  private openPicker(opts: PaperPickerOptions) {
    if (!this.ui) return;
    this.picker?.close();
    this.textEditor?.finish();
    this.setOptionsOpen(false);
    const handle = openPaperPicker(this.ui.root, {
      ...opts,
      onClose: () => {
        if (this.picker === handle) this.picker = null;
      },
    });
    this.picker = handle;
  }

  private pageMenu(pageId: string, evt: MouseEvent) {
    const index = this.store.pageIndex(pageId);
    const page = this.store.page(pageId);
    if (!page) return;
    const count = this.store.doc.pages.length;
    const menu = new Menu();
    menu.addItem((i) => i.setTitle("Thêm trang phía sau").setIcon("file-plus").onClick(() => this.pickTemplateAndAdd(index + 1)));
    menu.addItem((i) => i.setTitle("Nhân bản trang").setIcon("copy").onClick(() => this.duplicatePage(pageId)));
    menu.addSeparator();
    for (const t of TEMPLATES) {
      menu.addItem((i) =>
        i
          .setTitle(t.label)
          .setChecked(page.template === t.id)
          .onClick(() => this.store.commit([{ type: "setTemplate", pageId, template: t.id }]))
      );
    }
    menu.addSeparator();
    menu.addItem((i) =>
      i
        .setTitle("Chuyển lên trên")
        .setIcon("arrow-up")
        .setDisabled(index === 0)
        .onClick(() => this.store.commit([{ type: "movePage", from: index, to: index - 1 }]))
    );
    menu.addItem((i) =>
      i
        .setTitle("Chuyển xuống dưới")
        .setIcon("arrow-down")
        .setDisabled(index === count - 1)
        .onClick(() => this.store.commit([{ type: "movePage", from: index, to: index + 1 }]))
    );
    menu.addSeparator();
    menu.addItem((i) =>
      i
        .setTitle("Xoá trang")
        .setIcon("trash-2")
        .setWarning(true)
        .setDisabled(count <= 1)
        .onClick(() => this.deletePage(pageId))
    );
    menu.showAtMouseEvent(evt);
  }

  // ---------- Chọn trang (công cụ con trỏ) ----------

  /** Thanh thao tác nổi ở đầu trang đang chọn */
  private createPageActions() {
    const bar = createDiv({ cls: "pn-page-actions" });
    const label = bar.createSpan({ cls: "pn-page-actions-label" });
    bar.createDiv({ cls: "pn-divider" });
    const action = (icon: string, text: string, onClick: () => void) => {
      const btn = bar.createEl("button", { attr: { "aria-label": text } });
      setIcon(btn.createSpan({ cls: "pn-page-action-icon" }), icon);
      btn.createSpan({ text });
      btn.addEventListener("click", () => this.selectedPageId && onClick());
      return btn;
    };
    action("arrow-up-to-line", "Chèn trên", () => this.pickTemplateAndAdd(this.store.pageIndex(this.selectedPageId!)));
    action("arrow-down-to-line", "Chèn dưới", () => this.pickTemplateAndAdd(this.store.pageIndex(this.selectedPageId!) + 1));
    bar.createDiv({ cls: "pn-divider" });
    action("copy", "Nhân bản", () => this.duplicatePage(this.selectedPageId!));
    action("layout-template", "Loại giấy", () => this.changeTemplate(this.selectedPageId!));
    bar.createDiv({ cls: "pn-divider" });
    const remove = action("trash-2", "Xoá", () => this.deletePage(this.selectedPageId!));
    remove.addClass("mod-danger");
    bar.addEventListener("pointerdown", (e) => e.stopPropagation());
    return { bar, label, remove };
  }

  private selectPage(pageId: string | null) {
    const ui = this.ui;
    if (!ui) return;
    this.selectedPageId = pageId && this.pageViews.has(pageId) ? pageId : null;
    for (const pv of this.pageViews.values()) pv.item.toggleClass("is-selected", pv.id === this.selectedPageId);
    const { bar, label, remove } = ui.pageActions;
    if (!this.selectedPageId) {
      bar.detach();
      return;
    }
    // Ghim ở đầu vùng xem (không nằm trong trang) nên cuộn tới đâu cũng thấy
    if (bar.parentElement !== ui.stage) ui.stage.appendChild(bar);
    label.setText(`Trang ${this.store.pageIndex(this.selectedPageId) + 1}`);
    remove.toggleClass("is-disabled", this.store.doc.pages.length <= 1);
    if (this.currentPageId !== this.selectedPageId) {
      this.currentPageId = this.selectedPageId;
      this.updateToolbarState();
    }
  }

  private duplicatePage(pageId: string) {
    const page = this.store.page(pageId);
    if (!page) return;
    const copy = clone(page);
    copy.id = newId();
    for (const el of copy.elements) el.id = newId();
    this.store.commit([{ type: "addPage", index: this.store.pageIndex(pageId) + 1, page: copy }]);
    this.scrollToPage(copy.id);
    if (this.toolId === "pointer") this.selectPage(copy.id);
  }

  private deletePage(pageId: string) {
    const index = this.store.pageIndex(pageId);
    if (index < 0 || this.store.doc.pages.length <= 1) return;
    this.store.commit([{ type: "removePage", index }]);
    new Notice("Đã xoá trang. Bấm Mod+Z để hoàn tác.");
  }

  private changeTemplate(pageId: string) {
    const page = this.store.page(pageId);
    if (!page) return;
    this.openPicker({
      title: "Đổi loại giấy",
      current: page.template,
      badge: "Đang dùng",
      onPick: (template) => {
        if (template !== page.template) this.store.commit([{ type: "setTemplate", pageId, template }]);
      },
    });
  }

  /** Cuộn tới trang, chừa một khoảng để thấy mép trên của tờ giấy */
  private scrollToPage(pageId: string) {
    this.glideToPage(pageId);
  }

  /** Trang hiện tại = trang chiếm phần trên của khung nhìn */
  private updateCurrentPage() {
    if (this.glide !== null) return;
    const scroller = this.ui!.scroller.getBoundingClientRect();
    const probe = scroller.top + scroller.height / 3;
    for (const pv of this.pageViews.values()) {
      const r = pv.item.getBoundingClientRect();
      if (r.top <= probe && r.bottom >= probe) {
        if (this.currentPageId !== pv.id) {
          this.currentPageId = pv.id;
          this.updateToolbarState();
        }
        return;
      }
    }
  }

  // ---------- Thumbnail ----------

  private syncThumbs() {
    const sidebar = this.ui!.sidebar;
    sidebar.empty();
    this.store.doc.pages.forEach((page, i) => {
      const thumb = sidebar.createDiv({ cls: "pn-thumb", attr: { "data-page-id": page.id, draggable: "true" } });
      thumb.createDiv({ cls: "pn-thumb-page" });
      thumb.createDiv({ cls: "pn-thumb-num", text: String(i + 1) });
      thumb.addEventListener("click", () => {
        this.scrollToPage(page.id);
        if (this.toolId === "pointer") this.selectPage(page.id);
      });
      thumb.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        this.pageMenu(page.id, evt);
      });
      thumb.addEventListener("dragstart", (evt) => {
        evt.dataTransfer?.setData("text/x-pn-page", page.id);
        thumb.addClass("is-dragging");
      });
      thumb.addEventListener("dragend", () => thumb.removeClass("is-dragging"));
      thumb.addEventListener("dragover", (evt) => {
        if (!evt.dataTransfer?.types.includes("text/x-pn-page")) return;
        evt.preventDefault();
        thumb.addClass("is-drop-target");
      });
      thumb.addEventListener("dragleave", () => thumb.removeClass("is-drop-target"));
      thumb.addEventListener("drop", (evt) => {
        thumb.removeClass("is-drop-target");
        const from = this.store.pageIndex(evt.dataTransfer?.getData("text/x-pn-page") ?? "");
        const to = this.store.pageIndex(page.id);
        if (from < 0 || to < 0 || from === to) return;
        evt.preventDefault();
        this.store.commit([{ type: "movePage", from, to }]);
      });
      this.fillThumb(page.id);
    });
    const add = sidebar.createEl("button", { cls: "pn-add-page pn-thumb-add", attr: { "aria-label": "Thêm trang" } });
    setIcon(add, "plus");
    add.addEventListener("click", () => this.pickTemplateAndAdd(this.store.doc.pages.length, "stay"));
    this.updateToolbarState();
  }

  private scheduleThumb(pageId: string) {
    window.clearTimeout(this.thumbTimers.get(pageId));
    this.thumbTimers.set(
      pageId,
      window.setTimeout(() => this.fillThumb(pageId), 400)
    );
  }

  private fillThumb(pageId: string) {
    const pv = this.pageViews.get(pageId);
    const box = this.ui?.sidebar.querySelector(`.pn-thumb[data-page-id="${pageId}"] .pn-thumb-page`);
    if (!pv || !box) return;
    const copy = pv.layers.root.cloneNode(true) as HTMLElement;
    copy.querySelectorAll(".pn-overlay, .pn-text-editor").forEach((n) => n.remove());
    box.replaceChildren(copy);
  }

  // ---------- Zoom ----------

  private applyZoom() {
    const ui = this.ui!;
    ui.root.style.setProperty("--pn-zoom", String(this.zoom));
    ui.zoomLabel.setText(`${Math.round(this.zoom * 100)}%`);
    this.ruler?.layout(); // vạch mm của thước co giãn theo zoom
  }

  private setZoom(zoom: number, anchor?: { clientX: number; clientY: number }) {
    const ui = this.ui!;
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const s = ui.scroller;
    const rect = s.getBoundingClientRect();
    const ax = anchor ? anchor.clientX - rect.left : s.clientWidth / 2;
    const ay = anchor ? anchor.clientY - rect.top : s.clientHeight / 2;
    const cx = (s.scrollLeft + ax) / this.zoom;
    const cy = (s.scrollTop + ay) / this.zoom;
    this.zoom = z;
    this.applyZoom();
    s.scrollLeft = cx * z - ax;
    s.scrollTop = cy * z - ay;
    this.lasso.refresh();
  }

  /** Ctrl/Cmd + cuộn (hoặc pinch trackpad) thì zoom; trả về true nếu đã zoom */
  private zoomWheel(e: WheelEvent): boolean {
    this.stopGlide(); // người dùng tự cuộn thì thôi tự cuộn
    if (!e.ctrlKey && !e.metaKey) return false;
    this.fitWidth = false;
    // Chuột thường mỗi nấc ~100px, trackpad mỗi sự kiện vài px: chặn trần để một nấc
    // chuột chỉ đổi ~10% zoom, còn pinch trên trackpad vẫn mượt
    const delta = Math.max(-ZOOM_WHEEL_MAX_DELTA, Math.min(ZOOM_WHEEL_MAX_DELTA, e.deltaY));
    this.setZoom(this.zoom * Math.exp(-delta * ZOOM_WHEEL_SPEED), e);
    return true;
  }

  private zoomBy(factor: number) {
    this.fitWidth = false;
    this.setZoom(this.zoom * factor);
  }

  private fit() {
    const ui = this.ui;
    if (!ui || ui.scroller.clientWidth === 0) return;
    this.fitWidth = true;
    const z = (ui.scroller.clientWidth - 48) / (PAGE_W * PX_PER_MM);
    this.setZoom(Math.min(FIT_MAX_ZOOM, z));
  }

  pxToMm(px: number) {
    return px / (PX_PER_MM * this.zoom);
  }

  // ---------- Nhập liệu ----------

  private toPt(pv: PageView, e: { clientX: number; clientY: number }): Pt {
    const r = pv.layers.root.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * PAGE_W, y: ((e.clientY - r.top) / r.height) * PAGE_H };
  }

  private pageViewAt(target: EventTarget | null): PageView | undefined {
    const wrap = (target as HTMLElement | null)?.closest?.(".pn-page-wrap");
    const id = wrap?.getAttribute("data-page-id");
    return id ? this.pageViews.get(id) : undefined;
  }

  private registerInput() {
    const ui = this.ui!;

    this.registerDomEvent(ui.pages, "pointerdown", (e) => {
      if (this.loadError || this.pan || this.picker) return;
      // Nét trước chưa được kết thúc (mất sự kiện nhả chuột) thì kết thúc nó trước
      if (this.active) finish(e);
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (this.toolId === "hand" || this.spaceHeld) return; // để scroller xử lý kéo
      // Ngón tay dùng để cuộn, chỉ bút và chuột mới viết
      if (e.pointerType === "touch") return;
      const pv = this.pageViewAt(e.target);
      if (!pv) return;
      // preventDefault chặn luôn mousedown, nên tự kích hoạt leaf này
      e.preventDefault();
      if (this.app.workspace.activeLeaf !== this.leaf) this.app.workspace.setActiveLeaf(this.leaf, { focus: true });
      this.textEditor?.finish();
      this.setOptionsOpen(false);
      if (this.toolId !== "text") ui.root.focus({ preventScroll: true });
      if (this.currentPageId !== pv.id) {
        this.currentPageId = pv.id;
        this.updateToolbarState();
      }
      if (this.toolId === "pointer") {
        this.selectPage(pv.id);
        return;
      }
      pv.wrap.setPointerCapture(e.pointerId);
      this.active = { pv, pointerId: e.pointerId };
      this.tools[this.toolId].down(pv, this.toPt(pv, e), e);
    });

    this.registerDomEvent(ui.pages, "pointermove", (e) => {
      const active = this.active;
      if (!active || active.pointerId !== e.pointerId) return;
      // Không còn giữ chuột / nhấc bút mà không nhận được pointerup → kết thúc nét, không vẽ tiếp
      if (e.buttons === 0) return finish(e);
      const tool = this.tools[this.toolId];
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e]) tool.move?.(active.pv, this.toPt(active.pv, ev), ev);
    });

    /** Kết thúc nét đang vẽ (nếu có) */
    const finish = (e: PointerEvent) => {
      const active = this.active;
      if (!active) return;
      this.active = null;
      if (active.pv.wrap.hasPointerCapture(active.pointerId)) active.pv.wrap.releasePointerCapture(active.pointerId);
      this.tools[this.toolId].up?.(active.pv, this.toPt(active.pv, e), e);
    };
    const end = (e: PointerEvent) => {
      if (this.active && this.active.pointerId === e.pointerId) finish(e);
    };
    this.registerDomEvent(ui.pages, "pointerup", end);
    this.registerDomEvent(ui.pages, "pointercancel", end);
    // Nhả chuột ở bất kỳ đâu (trên thước, thanh công cụ, ngoài trang…) cũng kết thúc nét
    this.registerDomEvent(window, "pointerup", end, { capture: true });
    this.registerDomEvent(window, "pointercancel", end, { capture: true });
    // Thứ khác (ví dụ thước) giành mất pointer của trang giữa chừng → kết thúc nét luôn
    this.registerDomEvent(ui.pages, "lostpointercapture", end);

    // Chuột phải vào trang: thêm / nhân bản / đổi mẫu giấy / xoá trang
    this.registerDomEvent(ui.pages, "contextmenu", (e) => {
      const pv = this.pageViewAt(e.target);
      if (!pv) return;
      e.preventDefault();
      this.pageMenu(pv.id, e);
    });

    this.registerDomEvent(ui.pages, "dblclick", (e) => {
      const pv = this.pageViewAt(e.target);
      if (!pv || this.toolId !== "lasso") return;
      const text = this.textAt(pv, this.toPt(pv, e));
      if (text) this.editText(pv, text.id);
    });

    // Bàn tay: kéo để cuộn như Figma (công cụ bàn tay, giữ Space, hoặc kéo chuột giữa)
    this.registerDomEvent(ui.scroller, "pointerdown", (e) => {
      this.stopGlide();
      const target = e.target as HTMLElement;
      if (target.closest(".pn-page-actions, .pn-add-page")) return;
      const panning = this.toolId === "hand" || this.spaceHeld || (e.pointerType === "mouse" && e.button === 1);
      if (!panning) {
        if (this.toolId === "pointer" && !this.pageViewAt(target)) this.selectPage(null);
        return;
      }
      if (e.pointerType === "touch" || this.active) return;
      e.preventDefault();
      ui.scroller.setPointerCapture(e.pointerId);
      this.pan = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, left: ui.scroller.scrollLeft, top: ui.scroller.scrollTop };
      ui.root.addClass("pn-panning");
    });
    this.registerDomEvent(ui.scroller, "pointermove", (e) => {
      const pan = this.pan;
      if (!pan || pan.pointerId !== e.pointerId) return;
      // Đã nhả chuột (kể cả khi nhả ngoài cửa sổ, mất sự kiện pointerup) thì dừng kéo ngay
      if (e.buttons === 0) return stopPan();
      ui.scroller.scrollLeft = pan.left - (e.clientX - pan.x);
      ui.scroller.scrollTop = pan.top - (e.clientY - pan.y);
    });
    const stopPan = () => {
      if (!this.pan) return;
      if (ui.scroller.hasPointerCapture(this.pan.pointerId)) ui.scroller.releasePointerCapture(this.pan.pointerId);
      this.pan = null;
      ui.root.removeClass("pn-panning");
    };
    const endPan = (e: PointerEvent) => {
      if (this.pan && this.pan.pointerId === e.pointerId) stopPan();
    };
    this.registerDomEvent(ui.scroller, "pointerup", endPan);
    this.registerDomEvent(ui.scroller, "pointercancel", endPan);
    this.registerDomEvent(ui.scroller, "lostpointercapture", endPan);
    this.registerDomEvent(window, "pointerup", endPan);
    this.registerDomEvent(window, "blur", stopPan);

    const setSpace = (held: boolean) => {
      this.spaceHeld = held;
      ui.root.toggleClass("pn-space-pan", held);
    };
    this.registerDomEvent(window, "keydown", (e) => {
      if (e.code !== "Space" || isTyping(e.target) || this.app.workspace.getActiveViewOfType(NotebookView) !== this) return;
      e.preventDefault(); // không để Space cuộn trang
      if (!this.spaceHeld) setSpace(true);
    });
    this.registerDomEvent(window, "keyup", (e) => {
      if (e.code === "Space" && this.spaceHeld) setSpace(false);
    });
    this.registerDomEvent(window, "blur", () => this.spaceHeld && setSpace(false));

    this.registerDomEvent(
      ui.scroller,
      "wheel",
      (e) => {
        if (this.zoomWheel(e)) e.preventDefault();
      },
      { passive: false }
    );

    let ticking = false;
    this.registerDomEvent(ui.scroller, "scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        this.updateCurrentPage();
      });
    });

    this.registerDomEvent(ui.pages, "dragover", (e) => {
      if (e.dataTransfer?.types.includes("Files") || this.draggedVaultImage()) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      }
    });
    this.registerDomEvent(ui.pages, "drop", (e) => {
      const pv = this.pageViewAt(e.target);
      if (!pv) return;
      const at = this.toPt(pv, e);
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
      const vaultImage = this.draggedVaultImage();
      if (files.length) {
        e.preventDefault();
        this.insertImageFiles(files, pv.id, at);
      } else if (vaultImage) {
        e.preventDefault();
        this.addImageElement(vaultImage, pv.id, at);
      }
    });

    this.registerDomEvent(this.containerEl, "copy", (e) => {
      if (isTyping(e.target) || !this.lasso.selection) return;
      e.preventDefault();
      this.copySelection(e.clipboardData);
    });
    this.registerDomEvent(this.containerEl, "cut", (e) => {
      if (isTyping(e.target) || !this.lasso.selection) return;
      e.preventDefault();
      this.copySelection(e.clipboardData);
      this.lasso.deleteSelection();
    });
    this.registerDomEvent(this.containerEl, "paste", (e) => {
      if (isTyping(e.target) || this.loadError) return;
      const data = e.clipboardData;
      if (!data) return;
      const pageId = this.currentPageId;
      if (!pageId) return;
      const files = Array.from(data.files).filter((f) => f.type.startsWith("image/"));
      const text = data.getData("text/plain");
      e.preventDefault();
      if (files.length) this.insertImageFiles(files, pageId);
      else if (text === CLIP_MARKER && clipboard) this.pasteElements(pageId);
      else if (text.trim()) this.pasteText(pageId, text);
    });
  }

  private registerKeys() {
    const scope = new Scope(this.app.scope);
    this.scope = scope;
    const when = (fn: () => void) => (evt: KeyboardEvent) => {
      // Hộp thoại chọn giấy đang mở thì để nó tự xử lý phím
      if (isTyping(evt.target) || this.loadError || this.picker) return true;
      fn();
      return false;
    };
    scope.register(["Mod"], "z", when(() => this.store.undo()));
    scope.register(["Mod", "Shift"], "z", when(() => this.store.redo()));
    scope.register(["Mod"], "y", when(() => this.store.redo()));
    const deleteSelected = () => {
      if (this.toolId === "pointer" && this.selectedPageId) this.deletePage(this.selectedPageId);
      else this.lasso.deleteSelection();
    };
    scope.register([], "Delete", when(deleteSelected));
    scope.register([], "Backspace", when(deleteSelected));
    scope.register([], "Escape", when(() => {
      if (this.optionsOpen) this.setOptionsOpen(false);
      else if (this.selectedPageId) this.selectPage(null);
      else this.lasso.clear();
    }));
    scope.register(["Mod"], "d", when(() => {
      if (this.toolId === "pointer" && this.selectedPageId) this.duplicatePage(this.selectedPageId);
      else this.duplicateSelection();
    }));
    scope.register(["Mod"], "=", when(() => this.zoomBy(1.2)));
    scope.register(["Mod"], "-", when(() => this.zoomBy(1 / 1.2)));
    scope.register(["Mod"], "0", when(() => this.fit()));
    for (const t of TOOLS) if (t.key) scope.register([], t.key, when(() => this.setTool(t.id)));
    // Phím số như Excalidraw: 1 = công cụ đầu tiên trên thanh, 2 = công cụ thứ hai…
    TOOLS.forEach((t, i) => scope.register([], String(i + 1), when(() => this.setTool(t.id))));
    scope.register([], "r", when(() => this.toggleRuler()));
  }

  // ---------- Text ----------

  editText(pv: PageView, elementId: string | null, at?: Pt) {
    this.textEditor?.finish();
    const existing = elementId ? this.store.element(pv.id, elementId) : at ? this.textAt(pv, at) : null;
    if (existing && existing.type === "text") {
      const hidden = this.hiddenOn(pv.id);
      hidden.add(existing.id);
      this.rerender(pv.id);
      this.lasso.clear();
      this.textEditor = new TextEditor(this.store, pv, clone(existing), false, () => {
        hidden.delete(existing.id);
        this.textEditor = null;
        this.rerender(pv.id);
      });
    } else if (at) {
      this.textEditor = TextEditor.create(
        this.store,
        pv,
        at,
        this.options.text,
        (el) => this.snapText(pv.id, el, el.x, el.y),
        () => (this.textEditor = null)
      );
    }
  }

  textAt(pv: PageView, pt: Pt): TextElement | null {
    const page = this.store.page(pv.id);
    if (!page) return null;
    for (let i = page.elements.length - 1; i >= 0; i--) {
      const el = page.elements[i];
      if (el.type !== "text") continue;
      const b = this.elementBounds(pv, el);
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return el;
    }
    return null;
  }

  // ---------- Thước kẻ ----------

  private toggleRuler() {
    if (!this.ruler || !this.ui) return;
    this.ruler.toggle();
    this.ui.rulerBtn.toggleClass("is-active", this.ruler.visible);
  }

  rulerEdges(pv: PageView, strokeSize: number): RulerEdgeMm[] {
    const edges = this.ruler?.currentEdges() ?? [];
    if (edges.length === 0) return [];
    const mmPerPx = PAGE_W / pv.layers.root.getBoundingClientRect().width;
    return edges.map((e) => {
      const c = this.toPt(pv, { clientX: e.center.x, clientY: e.center.y });
      return {
        p0: { x: c.x + (e.outward.x * strokeSize) / 2, y: c.y + (e.outward.y * strokeSize) / 2 },
        dir: e.dir,
        outward: e.outward,
        half: e.half * mmPerPx,
        thickness: e.depth * mmPerPx,
        extend: e.extend,
      };
    });
  }

  /** Bấm đúp vào thước: kẻ một đường thẳng dọc mép thước lên trang nằm dưới thước */
  private stampRuler(edge: RulerEdge) {
    const kind = this.toolId === "highlighter" ? "highlighter" : "pen";
    const opts = this.options[kind];
    const pv = [...this.pageViews.values()].find((p) => {
      const r = p.layers.root.getBoundingClientRect();
      return edge.center.x >= r.left && edge.center.x <= r.right && edge.center.y >= r.top && edge.center.y <= r.bottom;
    });
    if (!pv) {
      new Notice("Đặt thước lên một trang giấy rồi bấm đúp để kẻ.");
      return;
    }
    const ends = [-1, 1].map((s) =>
      this.toPt(pv, {
        clientX: edge.center.x + edge.dir.x * edge.half * s,
        clientY: edge.center.y + edge.dir.y * edge.half * s,
      })
    );
    const off = { x: (edge.outward.x * opts.size) / 2, y: (edge.outward.y * opts.size) / 2 };
    const seg = clipToPage(
      { x: ends[0].x + off.x, y: ends[0].y + off.y },
      { x: ends[1].x + off.x, y: ends[1].y + off.y }
    );
    if (!seg) return;
    const [a, b] = seg;
    const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
    const points: InkPoint[] = [];
    for (let i = 0; i <= steps; i++) {
      points.push([a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps, 0.5]);
    }
    this.store.commit([
      {
        type: "addElement",
        pageId: pv.id,
        element: { id: newId(), type: "stroke", tool: kind, color: opts.color, size: opts.size, realPressure: false, points },
      },
    ]);
  }

  // ---------- Căn chữ vào đường kẻ ----------

  snapText(pageId: string, el: TextElement, x: number, y: number): Pt {
    const page = this.store.page(pageId);
    const rhythm = page ? paperRhythm(page.template) : null;
    if (!rhythm) return { x, y };
    const lineHeight = textLineHeight(el.fontSize, rhythm)!;
    const baseline = this.baselineOffset(el.fontSize, lineHeight);
    // Đặt chân chữ dòng đầu lên đường kẻ gần nhất; các dòng sau tự khớp vì
    // line-height là bội số của khoảng cách đường kẻ
    const k = Math.round((y + baseline + rhythm.inset - rhythm.first) / rhythm.gap);
    let ny = rhythm.first + k * rhythm.gap - rhythm.inset - baseline;
    while (ny < 0) ny += rhythm.gap;
    let nx = x;
    if (rhythm.snapX) nx = Math.round(x / rhythm.snapX) * rhythm.snapX;
    else if (rhythm.marginX !== undefined && Math.abs(x - (rhythm.marginX + 2)) < 4) nx = rhythm.marginX + 2;
    return { x: Math.max(0, Math.min(nx, PAGE_W - 5)), y: Math.min(ny, PAGE_H - lineHeight) };
  }

  /** Khoảng cách (mm) từ mép trên hộp chữ tới chân chữ dòng đầu — đo thật bằng font đang dùng */
  private baselineOffset(fontSize: number, lineHeight: number): number {
    const key = `${fontSize}/${lineHeight}`;
    const cached = this.baselineCache.get(key);
    if (cached !== undefined) return cached;
    const probe = this.contentEl.createDiv({ cls: "pn-page pn-probe" });
    const line = probe.createDiv({ cls: "pn-text" });
    line.style.fontSize = `${fontSize}pt`;
    line.style.lineHeight = `${lineHeight}mm`;
    line.appendText("Ag");
    // Khối inline-block cao 0 đặt đáy đúng tại baseline
    const mark = line.createSpan();
    mark.style.display = "inline-block";
    mark.style.height = "0";
    const mm = mark.offsetTop / PX_PER_MM; // offsetParent của mark chính là line
    probe.remove();
    if (document.fonts.status === "loaded") this.baselineCache.set(key, mm);
    return mm;
  }

  private pasteText(pageId: string, text: string) {
    const element: NotebookElement = {
      id: newId(),
      type: "text",
      x: 20,
      y: 30,
      w: PAGE_W - 40,
      fontSize: this.options.text.fontSize,
      color: this.options.text.color,
      md: text.replace(/\s+$/, ""),
    };
    this.store.commit([{ type: "addElement", pageId, element }]);
    this.setTool("lasso");
    this.lasso.select({ pageId, ids: new Set([element.id]) });
  }

  elementBounds(pv: PageView, el: NotebookElement): Rect {
    if (el.type === "stroke") return strokeBounds(el);
    if (el.type === "image") return { x: el.x, y: el.y, w: el.w, h: el.h };
    const node = pv.layers.texts.querySelector(`.pn-text[data-id="${el.id}"]`) as HTMLElement | null;
    // Hộp chữ co theo nội dung nên đo kích thước thật trên DOM
    const h = node && node.offsetHeight > 0 ? node.offsetHeight / PX_PER_MM : el.fontSize * 0.3528 * 1.45;
    const w = node && node.offsetWidth > 0 ? node.offsetWidth / PX_PER_MM : el.w;
    return { x: el.x, y: el.y, w, h };
  }

  // ---------- Copy / dán / nhân bản ----------

  private copySelection(data: DataTransfer | null) {
    clipboard = { elements: clone(this.lasso.selectedElements()), pageId: this.lasso.selection!.pageId };
    data?.setData("text/plain", CLIP_MARKER);
  }

  private pasteElements(pageId: string) {
    if (!clipboard) return;
    const offset = clipboard.pageId === pageId ? 5 : 0;
    this.addCopies(pageId, clipboard.elements, offset);
  }

  private duplicateSelection() {
    if (!this.lasso.selection) return;
    this.addCopies(this.lasso.selection.pageId, clone(this.lasso.selectedElements()), 5);
  }

  private addCopies(pageId: string, elements: NotebookElement[], offset: number) {
    const ids = new Set<string>();
    const ops: Op[] = elements.map((el) => {
      const copy = translated(el, offset, offset);
      copy.id = newId();
      ids.add(copy.id);
      return { type: "addElement", pageId, element: copy };
    });
    this.store.commit(ops);
    this.setTool("lasso");
    this.lasso.select({ pageId, ids });
  }

  // ---------- Ảnh ----------

  private resolveImage(src: string): TFile | null {
    const sourcePath = this.file?.path ?? "";
    const f = this.app.metadataCache.getFirstLinkpathDest(src, sourcePath) ?? this.app.vault.getAbstractFileByPath(src);
    return f instanceof TFile ? f : null;
  }

  private draggedVaultImage(): TFile | null {
    const draggable = (this.app as any).dragManager?.draggable;
    const file = draggable?.file;
    return file instanceof TFile && IMAGE_EXTENSIONS.includes(file.extension.toLowerCase()) ? file : null;
  }

  private pickImage() {
    const pageId = this.currentPageId;
    if (!pageId || this.loadError) return;
    const input = createEl("input", { attr: { type: "file", accept: "image/*", multiple: "" } });
    input.addEventListener("change", () => {
      const files = Array.from(input.files ?? []);
      if (files.length) this.insertImageFiles(files, pageId);
    });
    input.click();
  }

  /** Lưu ảnh vào thư mục attachment của vault rồi đặt lên trang */
  private async insertImageFiles(files: File[], pageId: string, at?: Pt) {
    if (!this.file) return;
    for (const [i, file] of files.entries()) {
      try {
        const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "png").toLowerCase();
        const name = file.name && file.name !== "image.png" ? file.name : `Pasted image ${window.moment().format("YYYYMMDDHHmmss")}.${ext}`;
        const path = await this.app.fileManager.getAvailablePathForAttachment(name, this.file.path);
        const tfile = await this.app.vault.createBinary(path, await file.arrayBuffer());
        await this.addImageElement(tfile, pageId, at ? { x: at.x + i * 5, y: at.y + i * 5 } : undefined);
      } catch (err) {
        console.error("[paper-notebook] Không chèn được ảnh", err);
        new Notice(`Không chèn được ảnh ${file.name}`);
      }
    }
  }

  private async addImageElement(file: TFile, pageId: string, at?: Pt) {
    const { width, height } = await imageSize(this.app.vault.getResourcePath(file));
    let w = Math.min(140, width / PX_PER_MM);
    let h = (w * height) / width;
    if (h > 200) {
      h = 200;
      w = (h * width) / height;
    }
    const x = clamp((at?.x ?? PAGE_W / 2) - w / 2, 0, PAGE_W - w);
    const y = clamp(at ? at.y - h / 2 : 30, 0, PAGE_H - h);
    const element: ImageElement = { id: newId(), type: "image", x, y, w, h, src: file.path };
    this.store.commit([{ type: "addElement", pageId, element }]);
  }

  /** Gọi khi bật/tắt đánh số trang trong settings */
  refreshPageNumbers() {
    this.store.doc.pages.forEach((page, i) => {
      const pv = this.pageViews.get(page.id);
      if (pv) setPageNumber(pv.layers, this.plugin.settings.showPageNumbers ? i + 1 : null);
      this.scheduleThumb(page.id);
    });
  }

  /** Dừng sửa chữ trước khi export để không mất nội dung đang gõ */
  flushEdits() {
    this.textEditor?.finish();
  }
}

function iconButton(parent: HTMLElement, icon: string, label: string, onClick: (evt: MouseEvent) => void) {
  const btn = parent.createEl("button", { cls: "clickable-icon pn-btn", attr: { "aria-label": label } });
  setIcon(btn, icon);
  btn.addEventListener("click", onClick);
  return btn;
}

function paletteButton(parent: HTMLElement, icon: string, label: string, onClick: () => void) {
  const btn = parent.createEl("button", { cls: "pn-palette-btn", attr: { "aria-label": label } });
  setIcon(btn, icon);
  btn.addEventListener("click", onClick);
  return btn;
}

function isLight(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170;
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.isContentEditable);
}

/** Cắt đoạn thẳng AB vào khung trang (thuật toán Liang–Barsky) */
function clipToPage(a: Pt, b: Pt): [Pt, Pt] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const checks: [number, number][] = [
    [-dx, a.x],
    [dx, PAGE_W - a.x],
    [-dy, a.y],
    [dy, PAGE_H - a.y],
  ];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r);
    else t1 = Math.min(t1, r);
    if (t0 > t1) return null;
  }
  return [
    { x: a.x + dx * t0, y: a.y + dy * t0 },
    { x: a.x + dx * t1, y: a.y + dy * t1 },
  ];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function imageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 400, height: img.naturalHeight || 300 });
    img.onerror = () => resolve({ width: 400, height: 300 });
    img.src = url;
  });
}

