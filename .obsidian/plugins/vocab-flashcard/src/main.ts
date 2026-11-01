import { addIcon, Editor, MarkdownView, Notice, Platform, Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import { buildClipLine, ClipPayload } from "./clip-card";
import { ClipResult, startClipServer } from "./clip-server";
import { registerEditorCommands } from "./editor-commands";
import { registerCardMeta } from "./card-meta";
import { registerCardSpeaker } from "./speaker";
import { PROGRESSION_ICON, PROGRESSION_SVG } from "./icons";
import { StudyModal } from "./modal";
import { parseVocab, VocabCard } from "./parser";
import { STATS_VIEW_TYPE, StatsView } from "./stats-view";
import { StudyStorage } from "./storage";
import { StudyTracker } from "./tracker";

/** Cổng extension Chrome "ProMax Translate" gửi từ vựng sang */
const CLIP_PORT = 27190;

export default class VocabFlashcardPlugin extends Plugin {
  private modal: StudyModal | null = null;
  private tracker!: StudyTracker;
  private clipServer: { close: () => void } | null = null;

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

    // Máy chủ nhận từ vựng từ Chrome cần Node, chỉ có ở bản desktop
    if (Platform.isDesktopApp) {
      this.clipServer = startClipServer({
        port: CLIP_PORT,
        onClip: (payload) => this.clip(payload),
        onError: (err) => {
          console.error("[vocab-flashcard] Không mở được máy chủ nhận từ vựng", err);
          new Notice(
            err.code === "EADDRINUSE"
              ? `Vocab Flashcard: cổng ${CLIP_PORT} đang bị chương trình khác dùng, chưa nhận được từ vựng gửi từ Chrome.`
              : "Vocab Flashcard: không mở được máy chủ nhận từ vựng gửi từ Chrome.",
          );
        },
      });
    }
  }

  /** Thêm dòng `- **từ**: nghĩa` cho từ extension Chrome gửi sang vào cuối note đang mở */
  private async clip(payload: ClipPayload): Promise<ClipResult> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) return { status: "no-note" };

    const { editor, file } = view;
    // Note đang ở chế độ đọc thì không sửa sau lưng người đọc; extension báo lại để chuyển sang chế độ viết
    if (view.getMode() === "preview") return { status: "reading-view", file: file.basename };
    appendLine(editor, buildClipLine(payload));
    new Notice(`Đã thêm “${payload.text}” vào ${file.basename}`);
    return { status: "inserted", file: file.basename };
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
    this.clipServer?.close();
    this.clipServer = null;
  }
}

/**
 * Thêm vào cuối note, luôn trên một dòng mới; con trỏ và chỗ đang xem giữ nguyên. Note đang kết thúc
 * bằng callout/trích dẫn (`>`) thì cách một dòng trống, nếu không dòng mới bị nhập vào khối đó.
 */
function appendLine(editor: Editor, text: string) {
  const lastLine = editor.lastLine();
  const last = editor.getLine(lastLine);
  const prefix = !last.trim() ? "" : last.trimStart().startsWith(">") ? "\n\n" : "\n";
  editor.replaceRange(prefix + text, { line: lastLine, ch: last.length });
}

function collectMarkdownFiles(target: TAbstractFile): TFile[] {
  if (target instanceof TFile) return target.extension === "md" ? [target] : [];
  if (target instanceof TFolder) return target.children.flatMap(collectMarkdownFiles);
  return [];
}
