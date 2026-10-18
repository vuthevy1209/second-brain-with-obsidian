import { App, Component, MarkdownRenderer, Modal, setIcon } from "obsidian";
import { CheckTest } from "./check";
import { Mode, MODES } from "./modes";
import { maskWord, VocabCard } from "./parser";
import { lookupPronunciation, speak } from "./pronounce";
import { TypingTest } from "./typing";
import { StudyTracker } from "./tracker";
import { shuffle } from "./util";

interface Question {
  card: VocabCard;
  /** true: hỏi từ → chọn nghĩa; false: hỏi nghĩa → chọn từ */
  askWord: boolean;
  options: VocabCard[];
}

/** Gợi ý phím tắt hiện ở góc trên theo từng chế độ */
const SHORTCUTS: Record<Mode, [string, string][]> = {
  flashcard: [["Space", "lật"], ["← →", "đổi thẻ"], ["S", "phát âm"]],
  quiz: [["Enter", "câu tiếp"], ["S", "phát âm"]],
  quizPro: [["Enter", "câu tiếp"], ["S", "phát âm"]],
  typing: [["Tab", "bài mới"]],
  check: [["Tab", "gợi ý"], ["Enter", "từ tiếp"]],
  dictation: [["Tab", "gợi ý"], ["Enter", "từ tiếp"]],
};

const KEYS = [" ", "Enter", "1", "2", "3", "4", "5", "6", "s", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const LETTERS = ["A", "B", "C", "D"];

export class StudyModal extends Modal {
  private renderer = new Component();
  private bodyEl!: HTMLElement;
  private mode: Mode = "flashcard";
  private pickerEl!: HTMLElement;
  private modeButton!: HTMLElement;
  private modeMenu: HTMLElement | null = null;
  private onOutsideClick = (evt: MouseEvent) => {
    if (!this.pickerEl.contains(evt.target as Node)) this.closeModeMenu();
  };
  private shortcutsEl!: HTMLElement;
  private topbarEl!: HTMLElement;
  /** Phím tắt của màn hình hiện tại; đổi theo từng màn hình */
  private keyHandler: ((key: string) => void) | null = null;
  /** Chế độ Gõ chữ / Kiểm tra đang chạy (tự xử lý bàn phím, cần dọn dẹp khi đổi chế độ) */
  private session: TypingTest | CheckTest | null = null;
  /** Chỉ cho đóng khi bấm nút X, tránh lỡ tay bấm ra ngoài hoặc Esc */
  private allowClose = false;

  constructor(
    app: App,
    private cards: VocabCard[],
    /** Ghi thời gian học cho tab "Hoạt động học tập" */
    private tracker: StudyTracker
  ) {
    super(app);
  }

  onOpen() {
    this.renderer.load();
    this.modalEl.addClass("vf-modal");


    const topbar = (this.topbarEl = this.contentEl.createDiv("vf-topbar"));
    // Menu chọn chế độ tự vẽ thay cho <select> (menu hệ thống của macOS không theo theme Obsidian)
    this.pickerEl = topbar.createDiv("vf-mode-picker");
    this.modeButton = this.pickerEl.createEl("button", { cls: "vf-mode-button" });
    this.modeButton.onclick = () => (this.modeMenu ? this.closeModeMenu() : this.openModeMenu());
    this.shortcutsEl = topbar.createDiv("vf-shortcuts");
    this.bindCloseButton();
    // Bấm phím / click / cuộn đều tính là đang học; quá 60s không có thì đồng hồ tạm dừng
    for (const type of ["keydown", "mousedown", "wheel"]) {
      this.modalEl.addEventListener(type, () => this.tracker.activity(), { capture: true, passive: true });
    }
    this.bodyEl = this.contentEl.createDiv("vf-body");

    for (const key of KEYS) {
      this.scope.register([], key, (evt) => {
        if (!this.keyHandler) return;
        evt.preventDefault();
        this.keyHandler(key);
        return false;
      });
    }

    this.showHome();
  }

  /** Màn hình đầu: chọn chế độ trước khi học (bấm thẻ hoặc phím 1–6) */
  private showHome() {
    const modes = Object.keys(MODES) as Mode[];
    this.tracker.end();
    this.session?.destroy();
    this.session = null;
    this.modalEl.removeClass("vf-modal-wide");
    // Ẩn menu chọn chế độ và gợi ý phím tắt, chỉ giữ chỗ cho nút X
    this.topbarEl.addClass("is-home");

    this.bodyEl.empty();
    const home = this.bodyEl.createDiv("vf-home vf-enter");
    home.createDiv({ cls: "vf-home-title", text: "Chọn chế độ học" });
    home.createDiv({ cls: "vf-home-subtitle", text: `${this.cards.length} từ vựng` });

    const grid = home.createDiv("vf-home-grid");
    modes.forEach((mode, i) => {
      const { label, icon, desc } = MODES[mode];
      const item = grid.createDiv("vf-home-item");
      const head = item.createDiv("vf-home-item-head");
      setIcon(head.createSpan("vf-home-item-icon"), icon);
      head.createEl("kbd", { text: String(i + 1) });
      item.createDiv({ cls: "vf-home-item-label", text: label });
      item.createDiv({ cls: "vf-home-item-desc", text: desc });
      item.onclick = () => this.switchMode(mode);
    });

    this.keyHandler = (key) => {
      const mode = modes[Number(key) - 1];
      if (mode) this.switchMode(mode);
    };
  }

  /**
   * Nút X ở góc là cách duy nhất để đóng modal. Thay nút gốc bằng bản sao (cloneNode không
   * chép các listener của Obsidian) rồi gắn listener của mình, để giữ nguyên vị trí và giao diện.
   */
  private bindCloseButton() {
    // Obsidian 1.14+ đặt tên nút là .modal-header-button, bản cũ là .modal-close-button
    const native = this.modalEl.querySelector<HTMLElement>(
      ":scope > .modal-header-button, :scope > .modal-close-button"
    );
    if (native) {
      const btn = native.cloneNode(true) as HTMLElement;
      native.replaceWith(btn);
      btn.addEventListener("click", () => this.forceClose());
      return;
    }
    // Phòng khi bản Obsidian không có nút X gốc
    const btn = this.modalEl.createDiv({ cls: "vf-close clickable-icon", attr: { "aria-label": "Đóng" } });
    setIcon(btn, "x");
    btn.addEventListener("click", () => this.forceClose());
  }

  /** Đóng thật sự: dùng cho nút X và khi plugin bị tắt */
  forceClose() {
    this.allowClose = true;
    super.close();
  }

  close() {
    if (this.allowClose) return super.close();
    // Esc khi menu chọn chế độ đang mở thì chỉ đóng menu
    if (this.modeMenu) return this.closeModeMenu();
    // Lắc nhẹ để báo là modal không đóng theo cách này
    this.modalEl.removeClass("vf-blocked");
    void this.modalEl.offsetWidth;
    this.modalEl.addClass("vf-blocked");
  }

  onClose() {
    this.tracker.end();
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    this.session?.destroy();
    speechSynthesis.cancel();
    this.renderer.unload();
    this.contentEl.empty();
  }

  private switchMode(mode: Mode) {
    this.tracker.begin(mode);
    this.setActiveMode(mode);
    this.session?.destroy();
    this.session = null;
    if (mode === "typing") {
      // Ô gõ tự xử lý phím, tắt phím tắt của flashcard/trắc nghiệm
      this.keyHandler = null;
      const typing = new TypingTest(
        this.bodyEl,
        this.cards,
        (card, headEl, bodyEl) => {
          this.renderSpeaker(headEl, card.word);
          this.renderPronunciation(headEl, card);
          this.renderAnswer(card, bodyEl);
        },
        // Bài mới (Tab / Gõ lại) thì đo lại từ đầu, gõ xong thì dừng
        () => this.tracker.begin("typing"),
        () => this.tracker.end()
      );
      this.session = typing;
      return typing.start();
    }
    if (mode === "check") return this.startCheck(shuffle(this.cards));
    if (mode === "dictation") return this.startCheck(shuffle(this.cards), true);
    if (mode === "quizPro") {
      if (this.cards.length < 2) return this.showNotEnough();
      return this.startQuizPro(shuffle(this.cards));
    }
    if (mode === "flashcard") return this.startFlashcards(shuffle(this.cards));

    // Thẻ chỉ có ảnh (không có nghĩa dạng chữ) thì không làm trắc nghiệm được
    const quizCards = this.cards.filter((c) => c.short);
    if (quizCards.length < 2) {
      this.keyHandler = null;
      this.bodyEl.empty();
      this.bodyEl.createDiv({ cls: "vf-done", text: "Cần ít nhất 2 từ có phần nghĩa để làm trắc nghiệm." });
      return;
    }
    this.startQuiz(shuffle(quizCards));
  }

  private openModeMenu() {
    const menu = (this.modeMenu = this.pickerEl.createDiv("vf-mode-menu"));
    this.modeButton.addClass("is-open");
    // Không cho menu lấy focus, để ô gõ chữ vẫn giữ con trỏ
    menu.addEventListener("mousedown", (evt) => evt.preventDefault());

    for (const [mode, { label, icon }] of Object.entries(MODES) as [Mode, (typeof MODES)[Mode]][]) {
      const item = menu.createDiv({ cls: "vf-mode-item" });
      item.toggleClass("is-active", mode === this.mode);
      setIcon(item.createSpan("vf-mode-item-icon"), icon);
      item.createSpan({ cls: "vf-mode-item-label", text: label });
      if (mode === this.mode) setIcon(item.createSpan("vf-mode-item-check"), "check");
      item.onclick = () => {
        this.closeModeMenu();
        if (mode !== this.mode) this.switchMode(mode);
      };
    }
    document.addEventListener("mousedown", this.onOutsideClick, true);
  }

  private closeModeMenu() {
    const menu = this.modeMenu;
    if (!menu) return;
    this.modeMenu = null;
    this.modeButton.removeClass("is-open");
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    // Chạy hiệu ứng thu lại rồi mới xoá khỏi DOM
    menu.addClass("is-closing");
    window.setTimeout(() => menu.remove(), 120);
    this.session?.focus();
  }

  private setActiveMode(mode: Mode) {
    this.mode = mode;
    this.topbarEl.removeClass("is-home");
    this.modeButton.empty();
    setIcon(this.modeButton.createSpan("vf-mode-button-icon"), MODES[mode].icon);
    this.modeButton.createSpan({ cls: "vf-mode-button-label", text: MODES[mode].label });
    setIcon(this.modeButton.createSpan("vf-mode-button-chevron"), "chevron-down");
    // Chế độ gõ chữ cần modal rộng cho bố cục 2 cột
    // Các chế độ bố cục 2 cột cần modal rộng
    this.modalEl.toggleClass("vf-modal-wide", mode === "typing" || mode === "check" || mode === "quizPro");
    // Trắc nghiệm: modal to hơn, chữ và ảnh phóng theo
    this.modalEl.toggleClass("vf-modal-quiz", mode === "quiz");
    this.shortcutsEl.empty();
    for (const [key, label] of SHORTCUTS[mode]) {
      const item = this.shortcutsEl.createSpan("vf-shortcut");
      item.createEl("kbd", { text: key });
      item.appendText(label);
    }
  }

  // ---------- Flashcard ----------

  private startFlashcards(cards: VocabCard[]) {
    let index = 0;

    const show = () => {
      this.bodyEl.empty();
      const card = cards[index];
      if (!card) return this.showFlashcardDone(cards.length);

      const scene = this.bodyEl.createDiv("vf-scene vf-enter");
      const flipper = scene.createDiv("vf-flip");

      const front = flipper.createDiv("vf-face vf-face-front");
      this.renderSpeaker(front, card.word);
      const center = front.createDiv("vf-front-center");
      center.createDiv({ cls: "vf-word", text: card.word });
      this.renderPronunciation(center, card);

      const back = flipper.createDiv("vf-face vf-face-back");
      this.renderSpeaker(back, card.word);
      back.createDiv({ cls: "vf-back-word", text: card.word });
      this.renderAnswer(card, back.createDiv("vf-back-content"));

      // Lật theo trục ngang (Space/click) hoặc trục dọc (↑ ↓); lật về thì giữ nguyên trục cũ
      let flipped = false;
      const flip = (axis: "x" | "y") => {
        if (!flipped) flipper.dataset.axis = axis;
        flipped = !flipped;
        flipper.toggleClass("is-flipped", flipped);
      };
      const go = (step: number) => {
        if (index + step < 0) return;
        index += step;
        show();
      };

      scene.onclick = (evt) => {
        if (!(evt.target as HTMLElement).closest(".vf-speak, a")) flip("y");
      };
      this.keyHandler = (key) => {
        if (key === " " || key === "Enter") flip("y");
        else if (key === "ArrowUp" || key === "ArrowDown") flip("x");
        else if (key === "ArrowLeft") go(-1);
        else if (key === "ArrowRight") go(1);
        else if (key === "s") speak(card.word);
      };
    };

    show();
  }

  private showFlashcardDone(total: number) {
    this.tracker.end();
    this.keyHandler = (key) => key === "Enter" && this.switchMode("flashcard");
    const done = this.bodyEl.createDiv("vf-done vf-enter");
    done.createDiv({ cls: "vf-done-title", text: "Hoàn thành!" });
    done.createDiv({ cls: "vf-done-text", text: `Bạn đã xem hết ${total} thẻ.` });
    const actions = done.createDiv("vf-done-actions");
    actions.createEl("button", { text: "Học lại" }).onclick = () => this.switchMode("flashcard");
    actions.createEl("button", { text: "Làm trắc nghiệm", cls: "mod-cta" }).onclick = () => this.switchMode("quiz");
  }

  // ---------- Trắc nghiệm ----------

  private startQuiz(cards: VocabCard[]) {
    const questions = cards.map((card) => this.buildQuestion(card));
    const wrong: VocabCard[] = [];
    let index = 0;

    const show = () => {
      this.bodyEl.empty();
      const q = questions[index];
      if (!q)
        return this.showResults(questions.length, wrong, "quiz", () => this.startQuiz(shuffle(wrong)), "Làm lại câu sai");

      // Không hiện tiến độ/điểm khi đang làm, chỉ thống kê ở màn hình kết thúc
      let answered = false;

      const promptEl = this.bodyEl.createDiv("vf-question vf-enter");
      if (q.askWord) {
        this.renderSpeaker(promptEl, q.card.word);
        promptEl.createDiv({ cls: "vf-word", text: q.card.word });
        this.renderPronunciation(promptEl, q.card);
      } else {
        promptEl.createDiv({ cls: "vf-meaning", text: q.card.short });
      }
      const revealEl = promptEl.createDiv("vf-reveal");

      const optionsEl = this.bodyEl.createDiv("vf-options");
      const buttons = q.options.map((opt, i) => {
        const btn = optionsEl.createEl("button", { cls: "vf-option" });
        btn.createSpan({ cls: "vf-option-key", text: LETTERS[i] });
        btn.createSpan({ cls: "vf-option-text", text: q.askWord ? opt.short : opt.word });
        return btn;
      });

      const footer = this.bodyEl.createDiv("vf-quiz-footer");
      const nextBtn = footer.createEl("button", { cls: "mod-cta", text: "Câu tiếp" });
      nextBtn.hide();

      // Đúng hay sai đều hiện đáp án đầy đủ ngay trong thẻ câu hỏi
      const choose = (i: number) => {
        if (answered || !q.options[i]) return;
        answered = true;
        const correct = q.options[i] === q.card;
        buttons[q.options.indexOf(q.card)].addClass("is-correct");
        if (!correct) {
          buttons[i].addClass("is-wrong");
          wrong.push(q.card);
        }
        buttons.forEach((b) => (b.disabled = true));

        if (!q.askWord) {
          this.renderSpeaker(promptEl, q.card.word);
          revealEl.createDiv({ cls: "vf-word", text: q.card.word });
          this.renderPronunciation(revealEl, q.card);
        }
        this.renderAnswer(q.card, revealEl.createDiv("vf-reveal-content"));
        nextBtn.show();
      };
      const next = () => {
        if (!answered) return;
        index++;
        show();
      };

      buttons.forEach((b, i) => (b.onclick = () => choose(i)));
      nextBtn.onclick = next;
      // Chọn đáp án bằng chuột; bàn phím chỉ dùng Enter để sang câu và S để nghe
      this.keyHandler = (key) => {
        if (key === "Enter") next();
        // Câu hỏi nghĩa → từ thì phát âm sẽ lộ đáp án
        else if (key === "s") (q.askWord || answered) && speak(q.card.word);
      };
    };

    show();
  }

  // ---------- Trắc nghiệm nâng cao ----------

  /** Bố cục 50/50: trái là ảnh + nghĩa (đã che từ), phải là 4 từ tiếng Anh xếp dọc */
  private startQuizPro(cards: VocabCard[]) {
    const questions = cards.map((card) => ({ ...this.buildQuestion(card), askWord: false }));
    const wrong: VocabCard[] = [];
    let index = 0;

    const show = () => {
      this.bodyEl.empty();
      const q = questions[index];
      if (!q)
        return this.showResults(questions.length, wrong, "quizPro", () => this.startQuizPro(shuffle(wrong)), "Làm lại câu sai");

      let answered = false;
      const layout = this.bodyEl.createDiv("vf-check-layout vf-enter");
      const side = layout.createDiv("vf-type-side");
      this.renderClue(q.card, side.createDiv("vf-type-card"));

      const main = layout.createDiv("vf-pro-main");
      const optionsEl = main.createDiv("vf-options vf-options-vertical");
      const buttons = q.options.map((opt, i) => {
        const btn = optionsEl.createEl("button", { cls: "vf-option" });
        btn.createSpan({ cls: "vf-option-key", text: LETTERS[i] });
        btn.createSpan({ cls: "vf-option-text", text: opt.word });
        return btn;
      });
      const footer = main.createDiv("vf-quiz-footer");
      const nextBtn = footer.createEl("button", { cls: "mod-cta", text: "Câu tiếp" });
      nextBtn.hide();

      const choose = (i: number) => {
        if (answered) return;
        answered = true;
        const correct = q.options[i] === q.card;
        buttons[q.options.indexOf(q.card)].addClass("is-correct");
        if (!correct) {
          buttons[i].addClass("is-wrong");
          wrong.push(q.card);
        }
        buttons.forEach((b) => (b.disabled = true));

        // Chọn xong thì thẻ bên trái hiện đầy đủ: từ, phát âm, nghĩa không che
        side.empty();
        const cardEl = side.createDiv("vf-type-card");
        const headEl = cardEl.createDiv("vf-type-card-head");
        headEl.createDiv({ cls: "vf-type-card-word", text: q.card.word });
        this.renderSpeaker(headEl, q.card.word);
        this.renderPronunciation(headEl, q.card);
        this.renderAnswer(q.card, cardEl.createDiv("vf-type-card-content"));
        nextBtn.show();
      };
      const next = () => {
        if (!answered) return;
        index++;
        show();
      };

      buttons.forEach((b, i) => (b.onclick = () => choose(i)));
      nextBtn.onclick = next;
      this.keyHandler = (key) => {
        if (key === "Enter") next();
        // Chưa chọn mà phát âm thì lộ đáp án
        else if (key === "s" && answered) speak(q.card.word);
      };
    };

    show();
  }

  /** Gợi ý không lộ đáp án: loại từ, ảnh, nghĩa (che từ tiếng Anh trong câu ví dụ) */
  private renderClue(card: VocabCard, el: HTMLElement) {
    if (card.pos) el.createDiv({ cls: "vf-pos vf-check-pos", text: card.pos });
    this.renderImage(card, el);
    this.renderBody({ ...card, body: maskWord(card.body, card.word) }, el);
  }

  private showNotEnough() {
    this.keyHandler = null;
    this.bodyEl.empty();
    this.bodyEl.createDiv({ cls: "vf-done", text: "Cần ít nhất 2 từ để làm trắc nghiệm." });
  }

  private buildQuestion(card: VocabCard): Question {
    // Đáp án nhiễu phải khác cả từ lẫn nghĩa ngắn để không có 2 đáp án giống nhau
    const distractors = shuffle(
      this.cards.filter(
        (c) => c !== card && c.short && c.word.toLowerCase() !== card.word.toLowerCase() && c.short !== card.short
      )
    );
    const options: VocabCard[] = [card];
    for (const c of distractors) {
      if (options.length >= 4) break;
      if (options.some((o) => o.short === c.short || o.word === c.word)) continue;
      options.push(c);
    }
    return { card, askWord: Math.random() < 0.5, options: shuffle(options) };
  }

  // ---------- Kiểm tra ----------

  /** dictation = Nghe chép: cùng logic gõ lại, nhưng chỉ có nút nghe thay cho ảnh + nghĩa */
  private startCheck(cards: VocabCard[], dictation = false) {
    this.keyHandler = null;
    this.session?.destroy();
    const check = new CheckTest(
      this.bodyEl,
      cards,
      dictation ? null : (card, el) => this.renderClue(card, el),
      (total, wrong) => {
        this.session = null;
        this.showResults(
          total,
          wrong,
          dictation ? "dictation" : "check",
          () => this.startCheck(shuffle(wrong), dictation),
          "Làm lại từ sai"
        );
      }
    );
    this.session = check;
    check.start();
  }

  // ---------- Kết quả (trắc nghiệm / kiểm tra) ----------

  private showResults(total: number, wrong: VocabCard[], mode: Mode, retryWrong: () => void, retryWrongLabel: string) {
    // Làm xong thì dừng đo; làm lại (tất cả hoặc câu sai) thì đo tiếp
    this.tracker.end();
    this.keyHandler = null;
    this.bodyEl.empty();
    const score = total - wrong.length;
    const done = this.bodyEl.createDiv("vf-done vf-enter");
    done.createDiv({ cls: "vf-done-title", text: `${score} / ${total}` });

    // Nút đặt ngay dưới điểm để không phải cuộn qua danh sách từ sai
    const actions = done.createDiv("vf-done-actions");
    actions.createEl("button", { text: "Làm lại tất cả", cls: wrong.length ? "" : "mod-cta" }).onclick = () =>
      this.switchMode(mode);
    if (wrong.length) {
      actions.createEl("button", { text: retryWrongLabel, cls: "mod-cta" }).onclick = () => {
        this.tracker.begin(mode);
        retryWrong();
      };

      // Từ làm sai hiện thành thẻ 2 cột giống trong note: ảnh | từ + nghĩa
      const list = done.createDiv("vf-wrong-list");
      for (const c of wrong) this.renderNoteCard(c, list);
    }
  }

  // ---------- Chung ----------

  private renderSpeaker(parent: HTMLElement, word: string) {
    const btn = parent.createEl("button", { cls: "vf-speak clickable-icon", attr: { "aria-label": "Phát âm (S)" } });
    setIcon(btn, "volume-2");
    btn.onclick = (evt) => {
      evt.stopPropagation();
      speak(word);
    };
  }

  /** Từ loại + IPA lấy từ note; thiếu thì tra thêm từ điển online */
  private renderPronunciation(parent: HTMLElement, card: VocabCard) {
    const row = parent.createDiv("vf-pron");
    const posEl = row.createSpan("vf-pos");
    const ipaEl = row.createSpan("vf-ipa");
    const fill = (pos?: string, ipa?: string) => {
      posEl.setText(pos ?? "");
      posEl.toggle(!!pos);
      ipaEl.setText(ipa ?? "");
      ipaEl.toggle(!!ipa);
    };
    fill(card.pos, card.ipa);
    if (card.reading) parent.createDiv({ cls: "vf-reading", text: card.reading });

    if (!card.pos || !card.ipa) {
      lookupPronunciation(card.word).then((p) => fill(card.pos ?? shortPos(p.pos), card.ipa ?? p.ipa));
    }
  }

  private renderAnswer(card: VocabCard, el: HTMLElement) {
    this.renderImage(card, el);
    this.renderBody(card, el);
  }

  /** Thẻ giống khối multi-column trong note: ảnh bên trái, từ + nghĩa bên phải */
  private renderNoteCard(card: VocabCard, parent: HTMLElement) {
    const cardEl = parent.createDiv("vf-note-card");
    if (card.image) this.renderImage(card, cardEl.createDiv("vf-note-card-image"));
    else cardEl.addClass("is-text-only");
    const text = cardEl.createDiv("vf-note-card-text");
    text.createDiv({ cls: "vf-note-card-word", text: card.word });
    this.renderBody(card, text);
  }

  private renderImage(card: VocabCard, el: HTMLElement) {
    if (!card.image) return;
    const file = this.app.metadataCache.getFirstLinkpathDest(card.image, card.sourcePath);
    if (file) el.createEl("img", { cls: "vf-image", attr: { src: this.app.vault.getResourcePath(file) } });
  }

  private renderBody(card: VocabCard, el: HTMLElement) {
    if (!card.body) return;
    MarkdownRenderer.render(this.app, card.body, el.createDiv("vf-markdown"), card.sourcePath, this.renderer);
  }
}

const POS_SHORT: Record<string, string> = { noun: "n", verb: "v", adjective: "adj", adverb: "adv", preposition: "prep" };

function shortPos(pos?: string): string | undefined {
  return pos ? POS_SHORT[pos] ?? pos : undefined;
}
