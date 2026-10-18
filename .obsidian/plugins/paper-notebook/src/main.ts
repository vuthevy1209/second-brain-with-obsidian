import { MarkdownView, Notice, Plugin, TFile, TFolder, WorkspaceLeaf } from "obsidian";
import { exportNotebookPdf } from "./export-pdf";
import { isNotebookPath, serializeNotebook } from "./format";
import { newDoc } from "./model";
import { installOpenPatch } from "./open-patch";
import { NotebookNameModal } from "./ui/name-prompt";
import { DEFAULT_SETTINGS, PaperNotebookSettings, PaperNotebookSettingTab } from "./settings";
import { NOTEBOOK_ICON, NotebookView, VIEW_TYPE } from "./view";

export default class PaperNotebookPlugin extends Plugin {
  settings: PaperNotebookSettings = { ...DEFAULT_SETTINGS };
  /** Leaf nào đang được người dùng chọn xem dạng markdown, kèm đường dẫn file */
  private rawLeaves = new WeakMap<WorkspaceLeaf, string>();

  async onload() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };

    this.registerView(VIEW_TYPE, (leaf) => new NotebookView(leaf, this));
    this.register(installOpenPatch(this.rawLeaves));
    this.addSettingTab(new PaperNotebookSettingTab(this.app, this));

    this.addRibbonIcon(NOTEBOOK_ICON, "Tạo notebook mới", () => this.createNotebook());

    this.addCommand({
      id: "create-notebook",
      name: "Tạo notebook mới",
      callback: () => this.createNotebook(),
    });

    this.addCommand({
      id: "export-pdf",
      name: "Export notebook ra PDF",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(NotebookView);
        if (!view) return false;
        if (!checking) this.exportPdf(view);
        return true;
      },
    });

    this.addCommand({
      id: "open-as-markdown",
      name: "Mở notebook dạng markdown",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(NotebookView);
        if (!view) return false;
        if (!checking) this.openAsMarkdown(view.leaf);
        return true;
      },
    });

    this.addCommand({
      id: "open-as-notebook",
      name: "Mở dạng notebook (trang giấy)",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view?.file || !isNotebookPath(view.file.path)) return false;
        if (!checking) this.openAsNotebook(view.leaf, view.file);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source, leaf) => {
        if (file instanceof TFolder) {
          // Cùng nhóm với New note / New drawing ở đầu menu
          menu.addItem((i) =>
            i
              .setSection("action-primary")
              .setTitle("New notebook")
              .setIcon(NOTEBOOK_ICON)
              .onClick(() => this.createNotebook(file))
          );
          return;
        }
        if (!(file instanceof TFile) || !isNotebookPath(file.path)) return;
        const view = leaf?.view;
        if (view instanceof NotebookView) {
          menu.addItem((i) => i.setTitle("Export PDF").setIcon("file-down").onClick(() => this.exportPdf(view)));
          menu.addItem((i) => i.setTitle("Mở dạng markdown").setIcon("file-code").onClick(() => this.openAsMarkdown(view.leaf)));
        } else if (view instanceof MarkdownView && leaf) {
          menu.addItem((i) => i.setTitle("Mở dạng notebook").setIcon(NOTEBOOK_ICON).onClick(() => this.openAsNotebook(leaf, file)));
        }
      })
    );

    // Notebook đã mở sẵn bằng view markdown trước khi plugin được bật
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
        const file = (leaf.view as MarkdownView).file;
        if (file && isNotebookPath(file.path)) this.openAsNotebook(leaf, file);
      });
    });
  }

  onunload() {
    // Tắt plugin thì trả các notebook đang mở về view markdown
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
      const file = (leaf.view as NotebookView).file;
      if (!file) return;
      this.rawLeaves.set(leaf, file.path);
      leaf.setViewState({ type: "markdown", state: { file: file.path } });
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshPageNumbers() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => (leaf.view as NotebookView).refreshPageNumbers());
  }

  /** Hỏi tên rồi mới tạo notebook */
  createNotebook(folder?: TFolder) {
    const parent = folder ?? this.app.fileManager.getNewFileParent(this.app.workspace.getActiveFile()?.path ?? "");
    new NotebookNameModal(this.app, parent, async (path) => {
      try {
        const file = await this.app.vault.create(path, serializeNotebook(newDoc(this.settings.defaultTemplate), ""));
        await this.app.workspace.getLeaf(false).openFile(file);
      } catch (err) {
        console.error("[paper-notebook] Không tạo được notebook", err);
        new Notice(`Không tạo được notebook: ${err instanceof Error ? err.message : err}`);
      }
    }).open();
  }

  openAsMarkdown(leaf: WorkspaceLeaf) {
    const file = (leaf.view as NotebookView).file;
    if (!file) return;
    this.rawLeaves.set(leaf, file.path);
    leaf.setViewState({ type: "markdown", state: { file: file.path }, active: true });
  }

  openAsNotebook(leaf: WorkspaceLeaf, file: TFile) {
    this.rawLeaves.delete(leaf);
    leaf.setViewState({ type: VIEW_TYPE, state: { file: file.path }, active: true });
  }

  async exportPdf(view: NotebookView) {
    const file = view.file;
    if (!file) return;
    view.flushEdits();
    const notice = new Notice("Đang export PDF…", 0);
    try {
      const pdf = await exportNotebookPdf(this, file, view.store.doc);
      notice.hide();
      new Notice(`Đã export: ${pdf.path}`);
      if (this.settings.openPdfAfterExport) await this.app.workspace.getLeaf("tab").openFile(pdf);
    } catch (err) {
      notice.hide();
      console.error("[paper-notebook] Export PDF lỗi", err);
      new Notice(`Export PDF lỗi: ${err instanceof Error ? err.message : err}`);
    }
  }
}
