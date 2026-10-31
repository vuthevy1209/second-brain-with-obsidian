import { cardExamples, VocabCard } from "./parser";
import { shuffle } from "./util";

interface Token {
  text: string;
  card: VocabCard;
}

/** Một đoạn gõ liền mạch: cả bài trộn từ (Gõ chữ) hoặc một câu ví dụ (Gõ nâng cao) */
interface Passage {
  tokens: Token[];
  /** Câu dịch hiện phía trên câu ví dụ (chỉ Gõ nâng cao) */
  caption?: string;
  /** Câu đọc lên khi bắt đầu đoạn nếu bật Tự đọc (chỉ Gõ nâng cao: cả câu ví dụ) */
  speech?: string;
}

/** words: Gõ chữ, trộn tất cả từ thành một đoạn; examples: Gõ nâng cao, gõ từng câu ví dụ */
export type TypingVariant = "words" | "examples";

/** Ngừng gõ quá khoảng này thì con trỏ nhấp nháy lại */
const IDLE_MS = 600;
/** Hằng số thời gian làm mượt con trỏ: càng lớn càng trôi chậm (≈95% quãng đường sau 3 lần giá trị này) */
const CARET_SMOOTH_MS = 30;

/**
 * Chế độ gõ lại kiểu Monkeytype: trộn tất cả từ vựng thành một đoạn văn,
 * gõ đúng thì chữ sáng lên, sai thì đỏ, Space để sang từ tiếp.
 * Biến thể Gõ nâng cao: lần lượt gõ từng câu ví dụ của từng từ, gõ xong câu thì sang câu kế.
 */
export class TypingTest {
  private passages: Passage[] = [];
  private passageIndex = 0;
  private tokens: Token[] = [];
  private typed: string[] = [];
  /** Từ bị bỏ qua vì gõ tiếp mà quên Space — tính là sai dù các chữ đã đúng */
  private skipped: boolean[] = [];
  private index = 0;
  private finished = false;
  private idleTimer: number | null = null;
  // Vị trí con trỏ đang vẽ và vị trí đích; mỗi khung hình tiến dần về đích
  private caretX = 0;
  private caretY = 0;
  private caretTargetX = 0;
  private caretTargetY = 0;
  private caretFrame: number | null = null;
  private caretLastTime = 0;
  private sideCard: VocabCard | null = null;
  private resizeObserver: ResizeObserver | null = null;
  /** Ký tự keydown vừa xử lý; sự kiện input lặp lại đúng ký tự đó thì bỏ qua (tránh gõ 1 ra 2) */
  private keydownChar: string | null = null;

  private wrapEl!: HTMLElement;
  private wordsEl!: HTMLElement;
  private caretEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private sideEl!: HTMLElement;
  /** Nghĩa của từ đang gõ (hoặc câu dịch của câu ví dụ), hiện ngay trên đoạn văn */
  private meaningEl!: HTMLElement;
  /** Đang ở câu thứ mấy (chỉ Gõ nâng cao) */
  private progressEl: HTMLElement | null = null;
  /** Nút "Câu tiếp" hiện khi gõ xong một câu (chỉ Gõ nâng cao) */
  private nextEl: HTMLElement | null = null;
  /** Gõ xong câu, đang chờ bấm nút / Space / Enter để sang câu kế */
  private awaitingNext = false;
  private wordEls: HTMLElement[] = [];

  constructor(
    private root: HTMLElement,
    private cards: VocabCard[],
    /** Vẽ phiên âm, ảnh và nghĩa của thẻ (dùng chung với flashcard) */
    private renderCard: (card: VocabCard, headEl: HTMLElement, bodyEl: HTMLElement) => void,
    /** Bắt đầu một bài (lần đầu, Tab bài mới, Gõ lại) */
    private onStart: () => void = () => {},
    /** Gõ xong bài */
    private onFinish: () => void = () => {},
    /** Đọc lên: Gõ chữ đọc từ khi con trỏ tới thẻ mới, Gõ nâng cao đọc cả câu (kèm câu dịch) khi sang câu mới */
    private onSpeak: (text: string, translation?: string) => void = () => {},
    private variant: TypingVariant = "words",
    /** Gõ xong một câu (Gõ nâng cao), trước khi sang câu kế */
    private onPassageDone: () => void = () => {}
  ) {}

  start() {
    this.onStart();
    this.passages =
      this.variant === "examples" ? buildExamplePassages(this.cards) : [{ tokens: buildTokens(this.cards) }];
    this.passageIndex = 0;
    this.awaitingNext = false;
    this.finished = false;
    this.sideCard = null;
    this.render();
  }

  destroy() {
    if (this.idleTimer !== null) window.clearTimeout(this.idleTimer);
    if (this.caretFrame !== null) cancelAnimationFrame(this.caretFrame);
    this.caretFrame = null;
    this.resizeObserver?.disconnect();
  }

  /** Đưa focus về ô gõ (dùng khi đóng dropdown chọn chế độ) */
  focus() {
    if (!this.finished) this.inputEl?.focus();
  }

  // ---------- Giao diện ----------

  private render() {
    this.root.empty();
    this.wrapEl = this.root.createDiv("vf-type vf-enter");

    // Bố cục 40/60: bên trái là thẻ của từ đang gõ, bên phải là đoạn văn
    const layout = this.wrapEl.createDiv("vf-type-layout");
    this.sideEl = layout.createDiv("vf-type-side");
    // Gõ nâng cao: câu ví dụ ngắn nên căn giữa, không cuộn theo dòng
    this.wrapEl.toggleClass("is-sentence", this.variant === "examples");
    const main = layout.createDiv("vf-type-main");
    this.progressEl = this.variant === "examples" ? main.createDiv("vf-type-progress") : null;
    this.meaningEl = main.createDiv("vf-type-meaning");
    // Câu dịch dài hơn nghĩa ngắn nên chữ nhỏ hơn
    this.meaningEl.toggleClass("is-sentence", this.variant === "examples");

    const viewport = main.createDiv("vf-type-viewport");
    this.wordsEl = viewport.createDiv("vf-type-words");
    // Luôn giữ chỗ cho nút để câu không bị đẩy lên khi nút hiện ra
    this.nextEl = this.variant === "examples" ? main.createDiv("vf-type-next") : null;

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
        // Đang bấm vào menu chọn chế độ thì để menu xử lý trước
        if (this.finished || !this.inputEl.isConnected || active?.closest(".vf-mode-picker")) return;
        this.inputEl.focus();
      });
    });
    this.wrapEl.addEventListener("mousedown", (evt) => {
      // Không cho click lấy mất focus (vẫn cho bấm link trong phần nghĩa)
      if (!(evt.target as HTMLElement).closest("a")) evt.preventDefault();
      this.inputEl.focus();
    });

    // Modal nới rộng có hiệu ứng, chữ xuống dòng lại nên phải tính lại vị trí con trỏ
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.updateCaret(true));
    this.resizeObserver.observe(viewport);

    this.renderPassage();
  }

  /** Vẽ đoạn đang gõ; khung bên trái chỉ đổi khi sang thẻ khác (2 câu ví dụ của cùng một từ giữ nguyên thẻ) */
  private renderPassage() {
    const passage = this.passages[this.passageIndex];
    this.tokens = passage.tokens;
    this.typed = this.tokens.map(() => "");
    this.skipped = this.tokens.map(() => false);
    this.index = 0;
    this.awaitingNext = false;
    this.wrapEl.removeClass("is-done");
    this.nextEl?.empty();

    this.wordsEl.empty();
    this.wordEls = this.tokens.map((t) => {
      const el = this.wordsEl.createSpan("vf-tword");
      for (const ch of t.text) el.createSpan({ cls: "vf-tchar", text: ch });
      return el;
    });
    this.caretEl = this.wordsEl.createDiv("vf-caret");

    if (this.variant === "examples") {
      this.progressEl?.setText(`${this.passageIndex + 1} / ${this.passages.length}`);
      // Tạo phần tử mới mỗi câu để hiệu ứng hiện lên chạy lại
      this.meaningEl.empty();
      if (passage.caption) this.meaningEl.createSpan({ cls: "vf-type-meaning-text", text: passage.caption });
      if (passage.speech) this.onSpeak(passage.speech, passage.caption?.replace(/_+/g, "").trim());
    }

    this.updateSide();
    // Đợi layout xong mới đo được vị trí con trỏ
    requestAnimationFrame(() => {
      this.inputEl.focus();
      this.updateCaret(true);
    });
  }

  private renderWord(i: number) {
    const el = this.wordEls[i];
    const text = this.tokens[i].text;
    const typed = this.typed[i];
    const length = text.length;

    // Giữ lại các span cũ thay vì vẽ lại, để hiệu ứng đổi màu chạy mượt
    while (el.children.length > length) el.lastElementChild!.remove();
    while (el.children.length < length) el.createSpan("vf-tchar");
    for (let c = 0; c < length; c++) {
      const span = el.children[c] as HTMLElement;
      span.setText(text[c]);
      const state = c >= typed.length ? "" : typed[c] === text[c] ? "correct" : "wrong";
      for (const cls of ["correct", "wrong"]) span.toggleClass(cls, cls === state);
    }
    el.toggleClass("error", i < this.index && !this.isCorrect(i));
  }

  /** snap = nhảy thẳng tới chỗ (lúc mới vẽ / đổi kích thước), còn lại thì trượt mượt */
  private updateCaret(snap = false) {
    const wordEl = this.wordEls[this.index];
    if (!wordEl) return;
    const chars = wordEl.children as HTMLCollectionOf<HTMLElement>;
    const pos = this.typed[this.index].length;
    const left =
      pos < chars.length
        ? chars[pos].offsetLeft
        : chars.length
          ? chars[chars.length - 1].offsetLeft + chars[chars.length - 1].offsetWidth
          : wordEl.offsetLeft;
    const top = wordEl.offsetTop + (wordEl.offsetHeight - this.caretEl.offsetHeight) / 2;
    this.moveCaret(left, top, snap);

    // Luôn giữ dòng đang gõ ở dòng thứ 2 của khung 3 dòng (câu ví dụ thì hiện trọn, không cuộn)
    if (this.variant === "examples") return;
    const line = Math.round(wordEl.offsetTop / wordEl.offsetHeight);
    this.wordsEl.style.transform = `translateY(-${Math.max(0, line - 1) * wordEl.offsetHeight}px)`;
  }

  private moveCaret(x: number, y: number, snap: boolean) {
    this.caretTargetX = x;
    this.caretTargetY = y;
    if (snap) {
      this.caretX = x;
      this.caretY = y;
      this.paintCaret();
      return;
    }
    if (this.caretFrame === null) {
      this.caretLastTime = performance.now();
      this.caretFrame = requestAnimationFrame(this.stepCaret);
    }
  }

  /**
   * Làm mượt kiểu "đuổi theo": mỗi khung hình đi một phần quãng đường còn lại.
   * Gõ nhanh thì đích đổi liên tục nhưng con trỏ vẫn trôi liền mạch, không bị giật như transition CSS.
   */
  private stepCaret = (now: number) => {
    const dt = Math.min(now - this.caretLastTime, 50);
    this.caretLastTime = now;
    const k = 1 - Math.exp(-dt / CARET_SMOOTH_MS);
    this.caretX += (this.caretTargetX - this.caretX) * k;
    this.caretY += (this.caretTargetY - this.caretY) * k;

    const done =
      Math.abs(this.caretTargetX - this.caretX) < 0.3 && Math.abs(this.caretTargetY - this.caretY) < 0.3;
    if (done) {
      this.caretX = this.caretTargetX;
      this.caretY = this.caretTargetY;
      this.caretFrame = null;
    } else {
      this.caretFrame = requestAnimationFrame(this.stepCaret);
    }
    this.paintCaret();
  };

  private paintCaret() {
    this.caretEl.style.transform = `translate3d(${this.caretX}px, ${this.caretY}px, 0)`;
  }

  private updateSide() {
    const card = this.tokens[this.index]?.card ?? null;
    // Cụm nhiều từ dùng chung một thẻ, chỉ đổi khi sang thẻ khác
    if (card === this.sideCard) return;
    this.sideCard = card;

    this.sideEl.empty();
    // Gõ nâng cao hiện câu dịch theo từng câu (renderPassage), không hiện nghĩa theo từ
    if (this.variant === "words") this.meaningEl.empty();
    if (!card) return;
    if (this.variant === "words") this.onSpeak(card.word);
    // Tạo phần tử mới mỗi lần để hiệu ứng hiện lên chạy lại khi sang từ khác
    if (this.variant === "words" && card.short) this.meaningEl.createSpan({ cls: "vf-type-meaning-text", text: card.short });
    // Tạo phần tử mới mỗi lần nên hiệu ứng trượt vào tự chạy lại
    const cardEl = this.sideEl.createDiv("vf-type-card");
    // Từ vựng và loại từ nằm cùng một hàng
    const headEl = cardEl.createDiv("vf-type-card-head");
    headEl.createDiv({ cls: "vf-type-card-word", text: card.word });
    this.renderCard(card, headEl, cardEl.createDiv("vf-type-card-content"));
  }

  /** Đang gõ thì con trỏ đứng yên, dừng một lúc mới nhấp nháy lại */
  private markTyping() {
    this.wrapEl.addClass("is-typing");
    if (this.idleTimer !== null) window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => this.wrapEl.removeClass("is-typing"), IDLE_MS);
  }

  // ---------- Xử lý phím ----------

  private onKey(evt: KeyboardEvent) {
    this.keydownChar = null;
    if (this.finished) return;
    // Phím đang được bộ gõ (Telex/VNI…) xử lý: để sự kiện input đọc chữ sau khi ghép xong
    if (evt.isComposing || evt.keyCode === 229) return;
    if (evt.key === "Tab") {
      evt.preventDefault();
      return this.start();
    }
    if (this.awaitingNext && evt.key === "Enter") {
      evt.preventDefault();
      return this.goNext();
    }
    if (evt.key === "Backspace") {
      // Câu đã gõ xong thì không lùi lại nữa
      if (this.awaitingNext) return evt.preventDefault();
      evt.preventDefault();
      this.markTyping();
      return this.backspace(evt.altKey || evt.ctrlKey || evt.metaKey);
    }
    if (evt.metaKey || evt.ctrlKey || evt.key.length !== 1) return;

    evt.preventDefault();
    this.keydownChar = evt.key;
    this.handleChar(evt.key);
  }

  /** Bàn phím ảo (mobile) hay không gửi keydown có `key`, nên đọc chữ từ ô input */
  private onInput(evt: InputEvent) {
    // Bộ gõ tiếng Việt đang ghép chữ thì đợi ghép xong mới đọc
    if (evt.isComposing) return;
    const text = this.inputEl.value;
    this.inputEl.value = "";
    const duplicate = text === this.keydownChar;
    this.keydownChar = null;
    if (duplicate) return;
    for (const ch of text) {
      if (this.finished) break;
      this.handleChar(ch);
    }
  }

  private handleChar(ch: string) {
    // Gõ xong câu: chỉ Space mới sang câu kế, các phím khác bỏ qua
    if (this.awaitingNext) {
      if (ch === " ") this.goNext();
      return;
    }
    this.markTyping();
    if (ch === " ") this.nextWord();
    else this.typeChar(ch);
  }

  private isCorrect(i: number): boolean {
    return this.typed[i] === this.tokens[i].text && !this.skipped[i];
  }

  private typeChar(ch: string): void {
    const text = this.tokens[this.index].text;
    const typed = this.typed[this.index];

    // Đã gõ hết từ mà không bấm Space: đánh dấu từ này sai rồi đưa chữ vừa gõ sang từ tiếp theo
    if (typed.length >= text.length) {
      this.skipped[this.index] = true;
      if (this.index === this.tokens.length - 1) return this.endPassage();
      this.advance();
      return this.typeChar(ch);
    }

    this.typed[this.index] = typed + ch;
    this.renderWord(this.index);

    // Từ cuối cùng gõ đúng thì kết thúc luôn, không cần bấm Space
    if (this.index === this.tokens.length - 1 && this.typed[this.index] === text) return this.endPassage();
    this.updateCaret();
  }

  private nextWord() {
    if (!this.typed[this.index]) return;
    if (this.index === this.tokens.length - 1) return this.endPassage();
    this.advance();
  }

  /** Hết một đoạn: còn câu thì sang câu kế, hết rồi thì kết thúc bài */
  private endPassage() {
    if (this.variant === "words") return this.finish();

    // Gõ nâng cao: dừng lại ở câu vừa gõ, hiện nút để người học tự sang câu kế
    this.awaitingNext = true;
    this.index = this.tokens.length;
    this.renderWord(this.tokens.length - 1);
    this.wrapEl.addClass("is-done");
    this.onPassageDone();
    if (!this.nextEl) return;
    this.nextEl.empty();
    const last = this.passageIndex === this.passages.length - 1;
    const button = this.nextEl.createEl("button", { cls: "mod-cta vf-type-next-button", text: last ? "Hoàn thành" : "Câu tiếp" });
    button.onclick = () => this.goNext();
  }

  private goNext() {
    if (!this.awaitingNext) return;
    if (this.passageIndex === this.passages.length - 1) return this.finish();
    this.passageIndex++;
    this.renderPassage();
  }

  private advance() {
    this.index++;
    this.renderWord(this.index - 1);
    this.updateCaret();
    this.updateSide();
  }

  /** Giống Monkeytype: chỉ được lùi về từ trước nếu từ đó gõ sai */
  private backspace(wholeWord: boolean) {
    if (!this.typed[this.index]) {
      const prev = this.index - 1;
      if (prev < 0 || this.isCorrect(prev)) return;
      this.index = prev;
      // Quay lại từ bị bỏ qua thì cho gõ lại Space như bình thường
      this.skipped[prev] = false;
      if (wholeWord) this.typed[prev] = "";
    } else {
      this.typed[this.index] = wholeWord ? "" : this.typed[this.index].slice(0, -1);
    }
    this.renderWord(this.index);
    this.updateCaret();
    this.updateSide();
  }

  // ---------- Kết thúc ----------

  /** Gõ xong thì chỉ hiện nút gõ lại, không thống kê gì thêm */
  private finish() {
    this.finished = true;
    this.onFinish();
    if (this.caretFrame !== null) cancelAnimationFrame(this.caretFrame);
    this.caretFrame = null;
    this.resizeObserver?.disconnect();

    this.root.empty();
    const done = this.root.createDiv("vf-type-finished vf-enter");
    const again = done.createEl("button", { text: "Gõ lại", cls: "mod-cta" });
    again.onclick = () => this.start();
    again.addEventListener("keydown", (evt) => {
      if (evt.key === "Tab") {
        evt.preventDefault();
        this.start();
      }
    });
    again.focus();
  }
}

/** Trộn ngẫu nhiên các thẻ rồi tách cụm từ thành từng từ để gõ */
function buildTokens(cards: VocabCard[]): Token[] {
  return shuffle(cards).flatMap((card) => tokenize(card.word, card));
}

/**
 * Gõ nâng cao: trộn thẻ, mỗi câu ví dụ là một đoạn (thẻ có 2 câu thì gõ cả 2);
 * thẻ không có ví dụ (từ quá dễ) thì gõ lại chính từ đó, phía trên hiện nghĩa.
 */
function buildExamplePassages(cards: VocabCard[]): Passage[] {
  const passages: Passage[] = [];
  for (const card of shuffle(cards)) {
    const examples = cardExamples(card);
    if (!examples.length) passages.push({ tokens: tokenize(card.word, card), caption: card.short, speech: card.word });
    for (const { en, vi } of examples) passages.push({ tokens: tokenize(en, card), caption: vi, speech: en });
  }
  return passages.filter((p) => p.tokens.length);
}

function tokenize(text: string, card: VocabCard): Token[] {
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ text: t, card }));
}

/** Đổi ký tự khó gõ về ký tự có sẵn trên bàn phím: ngoặc cong, gạch dài, dấu ba chấm, chữ có dấu (café → cafe) */
function normalize(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/\u00a0/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
