import { App, Modal, normalizePath, TFolder } from "obsidian";

// Ký tự không dùng được trong tên file (Windows/macOS) và ký tự làm hỏng link Obsidian
const INVALID_CHARS = /[\\/:*?"<>|#^[\]]/;

/** Hỏi tên trước khi tạo notebook mới */
export class NotebookNameModal extends Modal {
  constructor(app: App, private folder: TFolder, private onSubmit: (path: string) => void) {
    super(app);
  }

  onOpen() {
    this.modalEl.addClass("pn-name-modal");
    this.titleEl.setText("New notebook");
    const { contentEl } = this;

    contentEl.createDiv({
      cls: "pn-name-folder",
      text: `Trong thư mục: ${this.folder.isRoot() ? "/" : this.folder.path}`,
    });
    const row = contentEl.createDiv({ cls: "pn-name-row" });
    const input = row.createEl("input", { cls: "pn-name-input", attr: { type: "text", spellcheck: "false" } });
    row.createSpan({ cls: "pn-name-ext", text: ".notebook" });
    const error = contentEl.createDiv({ cls: "pn-name-error" });

    const buttons = contentEl.createDiv({ cls: "modal-button-container" });
    const cancel = buttons.createEl("button", { text: "Huỷ" });
    const create = buttons.createEl("button", { cls: "mod-cta", text: "Tạo" });

    input.value = this.availableName("Untitled");
    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);

    const submit = () => {
      const name = input.value.trim().replace(/(\.notebook)?(\.md)?$/i, "").trim();
      const problem = this.validate(name);
      error.setText(problem ?? "");
      input.toggleClass("is-invalid", !!problem);
      if (problem) return;
      this.close();
      this.onSubmit(this.pathFor(name));
    };

    input.addEventListener("input", () => {
      error.setText("");
      input.removeClass("is-invalid");
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) {
        e.preventDefault();
        submit();
      }
    });
    create.addEventListener("click", submit);
    cancel.addEventListener("click", () => this.close());
  }

  onClose() {
    this.contentEl.empty();
  }

  private pathFor(name: string) {
    const base = this.folder.isRoot() ? "" : this.folder.path + "/";
    return normalizePath(`${base}${name}.notebook.md`);
  }

  private availableName(name: string) {
    let candidate = name;
    for (let n = 1; this.app.vault.getAbstractFileByPath(this.pathFor(candidate)); n++) candidate = `${name} ${n}`;
    return candidate;
  }

  private validate(name: string): string | null {
    if (!name) return "Hãy nhập tên notebook.";
    if (INVALID_CHARS.test(name)) return 'Tên không được chứa các ký tự \\ / : * ? " < > | # ^ [ ]';
    if (name.startsWith(".")) return "Tên không được bắt đầu bằng dấu chấm.";
    if (this.app.vault.getAbstractFileByPath(this.pathFor(name))) return "Trong thư mục này đã có notebook trùng tên.";
    return null;
  }
}
