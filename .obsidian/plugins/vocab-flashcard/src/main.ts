import { addIcon, Notice, Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import { registerEditorCommands } from "./editor-commands";
import { registerCardMeta } from "./card-meta";
import { registerCardSpeaker } from "./speaker";
import { PROGRESSION_ICON, PROGRESSION_SVG } from "./icons";
import { StudyModal } from "./modal";
import { parseVocab, VocabCard } from "./parser";
import { STATS_VIEW_TYPE, StatsView } from "./stats-view";
import { StudyStorage } from "./storage";
import { StudyTracker } from "./tracker";

export default class VocabFlashcardPlugin extends Plugin {
  private modal: StudyModal | null = null;
  private tracker!: StudyTracker;

  async onload() {
    // Thời gian học lưu ở data/YYYY.json trong thư mục plugin, mỗi năm một file
    const storage = new StudyStorage(this.app.vault.adapter, this.manifest.dir!);
    try {
      this.tracker = new StudyTracker(await storage.loadAll(), (years) => storage.saveYears(years));
    } catch (err) {
      // Không đọc được thì vẫn cho học, nhưng tạm không lưu để khỏi ghi đè dữ liệu cũ
      console.error("[vocab-flashcard] Không đọc được dữ liệu thời gian học", err);
      new Notice("Vocab Flashcard: không đọc được dữ liệu thời gian học, lần này sẽ không lưu thời gian.");
      this.tracker = new StudyTracker({ version: 2, days: {} }, async () => {});
    }

    addIcon(PROGRESSION_ICON, PROGRESSION_SVG);
    this.registerView(STATS_VIEW_TYPE, (leaf) => new StatsView(leaf, this.tracker));
    this.addRibbonIcon(PROGRESSION_ICON, "Hoạt động học tập", () => this.openStats());
    this.addCommand({
      id: "open-study-stats",
      name: "Xem hoạt động học tập",
      callback: () => this.openStats(),
    });

    this.addRibbonIcon("brain", "Học từ vựng trong note hiện tại", () => this.studyActiveFile());

    this.addCommand({
      id: "study-current-note",
      name: "Học từ vựng trong note hiện tại",
      callback: () => this.studyActiveFile(),
    });

    this.addCommand({
      id: "study-current-folder",
      name: "Học từ vựng trong cả thư mục của note hiện tại",
      callback: () => {
        const folder = this.app.workspace.getActiveFile()?.parent;
        if (folder) this.study(folder);
        else new Notice("Hãy mở một note trước.");
      },
    });

    registerEditorCommands(this);
    registerCardSpeaker(this);
    registerCardMeta(this);
  }

  private studyActiveFile() {
    const file = this.app.workspace.getActiveFile();
    if (file) this.study(file);
    else new Notice("Hãy mở một note trước.");
  }

  private async study(target: TAbstractFile) {
    const cards = await this.loadCards(target);
    if (cards.length === 0) {
      new Notice("Không tìm thấy từ vựng nào (cần thẻ > [!vocab] từ, hoặc khối Multi-Column có ## từ).");
      return;
    }
    // "Mở rộng" điền sẵn thư mục chứa note (mở từ thư mục thì chính thư mục đó)
    const folder = target instanceof TFolder ? target : target.parent;
    this.modal = new StudyModal(this.app, cards, this.tracker, {
      folder: folder && !folder.isRoot() ? folder.path : "",
      load: async (path) => {
        const found = path ? this.app.vault.getAbstractFileByPath(path) : this.app.vault.getRoot();
        return found instanceof TFolder ? this.loadCards(found) : null;
      },
    });
    this.modal.open();
  }

  private async loadCards(target: TAbstractFile): Promise<VocabCard[]> {
    const cards: VocabCard[] = [];
    for (const file of collectMarkdownFiles(target)) {
      cards.push(...parseVocab(await this.app.vault.cachedRead(file), file.path));
    }
    return cards;
  }

  /** Mở tab "Hoạt động học tập" (đã mở rồi thì chuyển sang tab đó) */
  private async openStats() {
    const existing = this.app.workspace.getLeavesOfType(STATS_VIEW_TYPE)[0];
    if (existing) {
      // Không dùng revealLeaf: nó làm tiêu đề tab nháy vàng mỗi lần chuyển tới.
      // setActiveLeaf chuyển tab êm như Graph view.
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      await existing.loadIfDeferred();
      return;
    }
    await this.app.workspace.getLeaf("tab").setViewState({ type: STATS_VIEW_TYPE, active: true });
  }

  // Modal chặn Esc/bấm ra ngoài, nên khi tắt hoặc tải lại plugin phải tự đóng nó
  onunload() {
    this.modal?.forceClose();
    this.modal = null;
  }
}

function collectMarkdownFiles(target: TAbstractFile): TFile[] {
  if (target instanceof TFile) return target.extension === "md" ? [target] : [];
  if (target instanceof TFolder) return target.children.flatMap(collectMarkdownFiles);
  return [];
}
