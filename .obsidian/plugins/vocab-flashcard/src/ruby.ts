import { App, Editor, Modal, Notice } from "obsidian";

/**
 * Thêm nghĩa lên trên từ đang bôi đen: `từ` → `<ruby>từ<rt>nghĩa</rt></ruby> `.
 * Thay cho template Templater "Add Ruby Meaning" trước đây (cùng phím tắt Mod+Shift+R).
 */
export function addRubyMeaning(app: App, editor: Editor) {
  const selection = editor.getSelection();
  const word = selection.trim();
  if (!word) {
    new Notice("Hãy bôi đen từ hoặc bạn chưa chuyển sang chế độ ghi!");
    return;
  }
  // Lưu vùng chọn lại vì mở hộp nhập có thể làm editor mất vùng chọn
  const from = editor.getCursor("from");
  const to = editor.getCursor("to");
  new MeaningPrompt(app, word, (meaning) => {
    const { text, cursorOffset } = buildRuby(selection, meaning, editor.getLine(to.line).slice(to.ch));
    const start = editor.posToOffset(from);
    editor.replaceRange(text, from, to);
    // Đặt con trỏ ra hẳn ngoài thẻ <ruby> để Live Preview hiện ngay chữ đã render
    editor.setCursor(editor.offsetToPos(start + cursorOffset));
    editor.focus();
  }).open();
}

/**
 * `selection` là đoạn đang bôi đen (có thể dính khoảng trắng hai đầu), `after` là phần còn lại của dòng.
 * Khoảng trắng hai đầu được giữ ở ngoài thẻ; chỉ thêm dấu cách khi chữ phía sau dính liền vào từ
 * (tránh 2 dấu cách liền nhau). Con trỏ đứng sau thẻ ít nhất 1 ký tự.
 */
export function buildRuby(selection: string, meaning: string, after: string): { text: string; cursorOffset: number } {
  const lead = selection.match(/^\s*/)![0];
  let trail = selection.match(/\s*$/)![0];
  const ruby = `<ruby>${selection.trim()}<rt>${meaning}</rt></ruby>`;
  if (!trail && (after === "" || /^[\p{L}\p{N}]/u.test(after))) trail = " ";
  const end = lead.length + ruby.length;
  // Không có khoảng trắng phía sau (vd dấu phẩy) thì nhảy qua ký tự kế tiếp
  const skip = trail ? trail.length : after ? 1 : 0;
  return { text: lead + ruby + trail, cursorOffset: end + skip };
}

class MeaningPrompt extends Modal {
  constructor(app: App, private word: string, private onSubmit: (meaning: string) => void) {
    super(app);
  }

  onOpen() {
    this.modalEl.addClass("vf-ruby-prompt");
    this.titleEl.setText(`Nghĩa của "${this.word}":`);
    const input = this.contentEl.createEl("input", { type: "text", cls: "vf-ruby-input" });
    input.placeholder = "Nhập nghĩa rồi bấm Enter";
    input.addEventListener("keydown", (evt) => {
      // Bộ gõ tiếng Việt đang ghép chữ thì Enter là để chốt chữ, chưa gửi
      if (evt.key !== "Enter" || evt.isComposing) return;
      evt.preventDefault();
      const meaning = input.value.trim();
      this.close();
      // Để trống thì giữ nguyên từ, giống template cũ
      if (meaning) this.onSubmit(meaning);
    });
    window.setTimeout(() => input.focus());
  }

  onClose() {
    this.contentEl.empty();
  }
}
