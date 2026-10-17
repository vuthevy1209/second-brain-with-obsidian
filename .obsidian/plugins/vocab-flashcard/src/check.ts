import { setIcon } from "obsidian";
import { VocabCard } from "./parser";
import { speak } from "./pronounce";

/** Gõ đúng thì nháy xanh một chút rồi mới sang từ tiếp */
const CORRECT_FLASH_MS = 220;

type State = "typing" | "correct" | "wrong";

/**
 * Chế độ Kiểm tra: bên trái hiện ảnh + nghĩa (đã che từ tiếng Anh), bên phải gõ lại từ.
 * Chế độ Nghe chép dùng chung logic, chỉ thay phần gợi ý bằng nút nghe (bấm chuột mới phát).
 * - Gõ đủ số chữ: đúng thì tự sang từ tiếp, sai thì dừng lại và hiện đáp án.
 * - Gợi ý (Tab hoặc nút): điền chữ tiếp theo tại con trỏ; điền đủ thì tự sang từ tiếp.
 * - Từ dùng gợi ý vẫn bị tính là chưa thuộc.
 */
export class CheckTest {
  private queue: VocabCard[] = [];
  private index = 0;
  private typed = "";
  /** Vị trí nào trong `typed` là chữ do gợi ý điền vào */
  private hinted: boolean[] = [];
  private usedHint = false;
  private state: State = "typing";
  private wrong: VocabCard[] = [];
  private finished = false;
  private advanceTimer: number | null = null;
  /** Ký tự keydown vừa xử lý; sự kiện input lặp lại đúng ký tự đó thì bỏ qua (tránh gõ 1 ra 2) */
  private keydownChar: string | null = null;

  private wrapEl!: HTMLElement;
  private sideEl: HTMLElement | null = null;
  private slotsEl!: HTMLElement;
  private answerEl!: HTMLElement;
  private hintBtn!: HTMLButtonElement;
  private nextBtn!: HTMLButtonElement;
  private inputEl!: HTMLInputElement;

  constructor(
    private root: HTMLElement,
    private cards: VocabCard[],
    /** Vẽ ảnh + nghĩa (đã che từ) của thẻ; null = chế độ Nghe chép (chỉ có nút nghe) */
    private renderClue: ((card: VocabCard, el: HTMLElement) => void) | null,
    private onFinish: (total: number, wrong: VocabCard[]) => void
  ) {}

  start() {
    this.queue = this.cards;
    this.index = 0;
    this.wrong = [];
    this.finished = false;
    this.render();
    this.showCard();
  }

  destroy() {
    if (this.advanceTimer !== null) window.clearTimeout(this.advanceTimer);
    this.advanceTimer = null;
  }

  /** Đưa focus về ô gõ (dùng khi đóng menu chọn chế độ) */
  focus() {
    if (!this.finished) this.inputEl?.focus();
  }

  private get card(): VocabCard {
    return this.queue[this.index];
  }

  // ---------- Giao diện ----------

  private render() {
    this.root.empty();
    this.wrapEl = this.root.createDiv("vf-check");
    let main: HTMLElement;
    if (this.renderClue) {
      const layout = this.wrapEl.createDiv("vf-check-layout");
      this.sideEl = layout.createDiv("vf-type-side");
      main = layout.createDiv("vf-check-main");
    } else {
      this.sideEl = null;
      main = this.wrapEl.createDiv("vf-check-main vf-dictation");
      const listen = main.createEl("button", { cls: "vf-listen", attr: { "aria-label": "Nghe" } });
      setIcon(listen, "headphones");
      listen.onclick = () => speak(this.card.word);
    }

    this.slotsEl = main.createDiv("vf-slots");
    this.answerEl = main.createDiv("vf-check-answer");

    const actions = main.createDiv("vf-check-actions");
    this.hintBtn = actions.createEl("button", { text: "Gợi ý" });
    this.nextBtn = actions.createEl("button", { text: "Từ tiếp", cls: "mod-cta" });
    this.hintBtn.onclick = () => this.hint();
    this.nextBtn.onclick = () => this.next();

    this.inputEl = this.wrapEl.createEl("input", {
      cls: "vf-type-input",
      // type=password khiến hệ điều hành tắt bộ gõ tiếng Việt trong ô này
      type: "password",
      attr: { autocomplete: "off", autocapitalize: "off", spellcheck: "false" },
    });
    this.inputEl.addEventListener("keydown", (evt) => this.onKey(evt));
    this.inputEl.addEventListener("input", (evt) => this.onInput(evt as InputEvent));
    // Luôn giữ focus ở ô gõ: lỡ bấm chỗ khác thì tự focus lại (trừ menu chọn chế độ)
    this.inputEl.addEventListener("blur", () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (this.finished || !this.inputEl.isConnected || active?.closest(".vf-mode-picker")) return;
        this.inputEl.focus();
      });
    });
    this.wrapEl.addEventListener("mousedown", (evt) => {
      if (!(evt.target as HTMLElement).closest("a")) evt.preventDefault();
      this.inputEl.focus();
    });
    requestAnimationFrame(() => this.inputEl.focus());
  }

  private showCard() {
    this.typed = "";
    this.hinted = [];
    this.usedHint = false;
    this.state = "typing";

    if (this.sideEl && this.renderClue) {
      this.sideEl.empty();
      this.renderClue(this.card, this.sideEl.createDiv("vf-type-card"));
    }
    this.answerEl.empty();
    this.wrapEl.removeClass("is-correct", "is-wrong");
    this.renderSlots();
    this.updateButtons();
  }

  /** Mỗi chữ của đáp án là một ô; dấu cách để trống, cho biết độ dài và số từ trong cụm */
  private renderSlots() {
    const word = this.card.word;
    this.slotsEl.empty();
    let wordEl = this.slotsEl.createSpan("vf-slot-word");
    for (let i = 0; i < word.length; i++) {
      if (word[i] === " ") {
        // Tách cụm thành từng nhóm để xuống dòng đúng chỗ cách
        wordEl = this.slotsEl.createSpan("vf-slot-word");
        continue;
      }
      const slot = wordEl.createSpan("vf-slot");
      const ch = this.typed[i];
      if (ch !== undefined) slot.setText(ch);
      slot.toggleClass("is-hinted", !!this.hinted[i]);
      slot.toggleClass("is-current", this.state === "typing" && i === this.cursor());
      if (this.state === "wrong" && ch !== undefined) {
        slot.addClass(same(ch, word[i]) ? "is-right" : "is-off");
      }
    }
  }

  /** Vị trí ô đang chờ gõ (bỏ qua dấu cách) */
  private cursor(): number {
    let i = this.typed.length;
    while (this.card.word[i] === " ") i++;
    return i;
  }

  private updateButtons() {
    this.hintBtn.toggle(this.state === "typing");
    this.nextBtn.toggle(this.state === "wrong");
  }

  // ---------- Xử lý phím ----------

  private onKey(evt: KeyboardEvent) {
    this.keydownChar = null;
    if (this.finished) return;
    // Phím đang được bộ gõ (Telex/VNI…) xử lý: để sự kiện input đọc chữ sau khi ghép xong
    if (evt.isComposing || evt.keyCode === 229) return;

    if (evt.key === "Enter") {
      evt.preventDefault();
      if (this.state === "wrong") this.next();
      else if (this.state === "typing" && this.typed) this.submit();
      return;
    }
    if (evt.key === "Tab") {
      evt.preventDefault();
      return this.hint();
    }
    if (evt.key === "Backspace") {
      evt.preventDefault();
      return this.backspace(evt.altKey || evt.ctrlKey || evt.metaKey);
    }
    if (evt.metaKey || evt.ctrlKey || evt.key.length !== 1) return;

    evt.preventDefault();
    this.keydownChar = evt.key;
    this.typeChar(evt.key);
  }

  /** Bàn phím ảo (mobile) hay không gửi keydown có `key`, nên đọc chữ từ ô input */
  private onInput(evt: InputEvent) {
    if (evt.isComposing) return;
    const text = this.inputEl.value;
    this.inputEl.value = "";
    const duplicate = text === this.keydownChar;
    this.keydownChar = null;
    if (duplicate) return;
    for (const ch of text) this.typeChar(ch);
  }

  private typeChar(ch: string, fromHint = false) {
    if (this.state !== "typing") return;
    const word = this.card.word;
    if (ch === " ") {
      // Dấu cách chỉ hợp lệ đúng chỗ cách trong cụm; chỗ khác thì bỏ qua
      if (word[this.typed.length] === " ") this.typed += " ";
      return this.renderSlots();
    }
    // Tới chỗ cách mà gõ chữ luôn thì tự chèn dấu cách
    while (word[this.typed.length] === " ") this.typed += " ";
    if (this.typed.length >= word.length) return;

    this.hinted[this.typed.length] = fromHint;
    this.typed += ch;
    if (this.typed.length >= word.length) return this.submit();
    this.renderSlots();
  }

  private backspace(wholeWord: boolean) {
    if (this.state !== "typing" || !this.typed) return;
    if (wholeWord) {
      this.typed = "";
      this.hinted = [];
    } else {
      this.typed = this.typed.slice(0, -1);
      // Xoá luôn dấu cách tự chèn để lần xoá sau là xoá chữ
      this.typed = this.typed.replace(/ +$/, "");
      this.hinted.length = this.typed.length;
    }
    this.renderSlots();
  }

  /** Gợi ý: điền đúng chữ tại con trỏ */
  private hint() {
    if (this.state !== "typing") return;
    const pos = this.cursor();
    const ch = this.card.word[pos];
    if (ch === undefined) return;
    this.usedHint = true;
    this.typeChar(ch, true);
  }

  // ---------- Chấm điểm ----------

  private submit() {
    const word = this.card.word;
    const correct = this.typed.length === word.length && [...word].every((c, i) => same(this.typed[i], c));

    if (correct) {
      this.state = "correct";
      if (this.usedHint) this.wrong.push(this.card);
      this.wrapEl.addClass("is-correct");
      this.renderSlots();
      this.updateButtons();
      this.advanceTimer = window.setTimeout(() => this.next(), CORRECT_FLASH_MS);
      return;
    }

    this.state = "wrong";
    this.wrong.push(this.card);
    this.wrapEl.addClass("is-wrong");
    this.renderSlots();
    this.answerEl.empty();
    this.answerEl.createDiv({ cls: "vf-check-answer-label", text: "Đáp án" });
    this.answerEl.createDiv({ cls: "vf-check-answer-word", text: word });
    // Nghe chép không có thẻ bên trái nên hiện thêm nghĩa ở đây
    if (!this.renderClue && this.card.short) {
      this.answerEl.createDiv({ cls: "vf-check-answer-meaning", text: this.card.short });
    }
    this.updateButtons();
  }

  private next() {
    if (this.advanceTimer !== null) window.clearTimeout(this.advanceTimer);
    this.advanceTimer = null;
    if (this.state === "typing") return;

    this.index++;
    if (this.index < this.queue.length) return this.showCard();
    this.finished = true;
    this.onFinish(this.queue.length, this.wrong);
  }
}

function same(a: string | undefined, b: string): boolean {
  return a !== undefined && a.toLowerCase() === b.toLowerCase();
}
