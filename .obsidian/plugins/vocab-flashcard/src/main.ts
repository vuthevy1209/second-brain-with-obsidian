import { Notice, Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import { registerEditorCommands } from "./editor-commands";
import { StudyModal } from "./modal";
import { parseVocab, VocabCard } from "./parser";

export default class VocabFlashcardPlugin extends Plugin {
  private modal: StudyModal | null = null;

  async onload() {
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

    // Chuột phải vào file hoặc thư mục trong File explorer
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem((item) =>
          item
            .setTitle("Học từ vựng")
            .setIcon("brain")
            .onClick(() => this.study(file))
        );
      })
    );
  }

  private studyActiveFile() {
    const file = this.app.workspace.getActiveFile();
    if (file) this.study(file);
    else new Notice("Hãy mở một note trước.");
  }

  private async study(target: TAbstractFile) {
    const files = collectMarkdownFiles(target);
    const cards: VocabCard[] = [];
    for (const file of files) {
      cards.push(...parseVocab(await this.app.vault.cachedRead(file), file.path));
    }

    if (cards.length === 0) {
      new Notice("Không tìm thấy từ vựng nào (cần thẻ > [!vocab] từ, hoặc khối Multi-Column có ## từ).");
      return;
    }
    this.modal = new StudyModal(this.app, cards);
    this.modal.open();
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
