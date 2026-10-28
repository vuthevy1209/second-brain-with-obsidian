import { setIcon } from "obsidian";
import { VocabCard } from "./parser";
import { shuffle } from "./util";

/** Một từ đang rơi trên sân */
interface Falling {
  card: VocabCard;
  /** Chữ cần gõ (đã bỏ dấu, nháy cong… để gõ được bằng bàn phím thường) */
  text: string;
  x: number;
  y: number;
  speed: number;
  /** Phần đã gõ đúng của từ này (gõ sai không được ghi lại) */
  input: string;
  /** Gợi ý khi ẩn chữ: chữ cái trong từng từ bị đảo lộn (giữ nguyên dấu cách) */
  scramble: string;
  /** Khối từ: ảnh nhỏ (nếu có) ở trên, chữ ở dưới */
  el: HTMLElement;
  /** Dòng chữ cần gõ (khung ngắm, con trỏ nằm ở đây) */
  textEl: HTMLElement;
  charEls: HTMLElement[];
}

const LIVES = 6;
/** Số từ rơi cùng lúc tối đa */
const MAX_ON_FIELD = 4;
/** Từ dài quá thì không vừa sân, bỏ qua */
const MAX_LEN = 30;
const SHIP_BOTTOM = 34;
/** Khoảng từ đáy sân tới vạch nguy hiểm */
const DANGER_GAP = 72;
/** Chiều dài vệt đạn (px), khớp với width của .vf-shoot-bullet */
const BULLET_LEN = 32;
/** Khoảng cách tối thiểu giữa các từ đang rơi (px): ngang và dọc */
const GAP_X = 56;
const GAP_Y = 110;

/** Lựa chọn của chế độ Bắn chữ, được nhớ giữa các lần chơi */
export interface ShooterSettings {
  /** Tắt thì từ lọt vẫn ghi lại để học lại nhưng không trừ mạng, không bao giờ thua */
  lives: boolean;
  /** Tắt thì chỉ hiện ảnh + gợi ý chữ cái bị đảo lộn */
  showWord: boolean;
  save: (key: "lives" | "showWord", on: boolean) => void;
}

/**
 * Chế độ "Bắn chữ": từ tiếng Anh rơi từ trên xuống, gõ đúng từ để bắn nổ.
 * Gõ chữ cái đầu là khoá mục tiêu vào từ thấp nhất bắt đầu bằng chữ đó; Backspace để bỏ mục tiêu.
 * Nổ xong thì nghĩa của từ hiện lên ngay chỗ đó. Từ chạm vạch đáy thì mất 1 mạng.
 */
export class ShooterGame {
  private queue: VocabCard[] = [];
  private total = 0;
  private active: Falling[] = [];
  private target: Falling | null = null;
  private missed: VocabCard[] = [];
  private cleared = 0;
  private score = 0;
  private lives = LIVES;
  private frame: number | null = null;
  private lastTime = 0;
  private spawnIn = 0;
  private over = false;

  private wrapEl!: HTMLElement;
  private fieldEl!: HTMLElement;
  private shipEl!: HTMLElement;
  /** Con trỏ gõ, nằm trong từ đang ngắm */
  private caretEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private scoreEl!: HTMLElement;
  private livesEl!: HTMLElement;
  private progressEl!: HTMLElement;
  private livesToggleEl!: HTMLElement;
  private wordToggleEl!: HTMLElement;

  constructor(
    private root: HTMLElement,
    private cards: VocabCard[],
    /** Hết từ hoặc hết mạng: số từ của ván và các từ để lọt */
    private onFinish: (total: number, missed: VocabCard[]) => void,
    /** Bắn nổ một từ (dùng để tự đọc từ đó nếu bật) */
    private onClear: (card: VocabCard) => void = () => {},
    /** Đường dẫn ảnh của thẻ để hiện nhỏ phía trên từ đang rơi */
    private imageUrl: (card: VocabCard) => string | null = () => null,
    private settings: ShooterSettings = { lives: true, showWord: true, save: () => {} }
  ) {}

  start() {
    this.queue = shuffle(this.cards.filter((c) => toTypeable(c.word).length <= MAX_LEN));
    if (!this.queue.length) this.queue = shuffle(this.cards);
    this.total = this.queue.length;
    this.render();
    this.spawnIn = 0.6;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.over = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  focus() {
    if (!this.over) this.inputEl?.focus();
  }

  // ---------- Giao diện ----------

  private render() {
    this.root.empty();
    this.wrapEl = this.root.createDiv("vf-shoot vf-enter");

    const hud = this.wrapEl.createDiv("vf-shoot-hud");
    this.scoreEl = hud.createDiv("vf-shoot-score");
    this.livesEl = hud.createDiv("vf-shoot-lives");
    const right = hud.createDiv("vf-shoot-hud-right");
    const toggle = (key: "lives" | "showWord") => () => {
      this.settings[key] = !this.settings[key];
      this.settings.save(key, this.settings[key]);
      if (key === "showWord") this.active.forEach((w) => this.paintWord(w));
      this.updateHud();
      this.inputEl.focus();
    };
    this.wordToggleEl = right.createEl("button", { cls: "vf-autospeak vf-shoot-toggle" });
    this.wordToggleEl.onclick = toggle("showWord");
    this.livesToggleEl = right.createEl("button", { cls: "vf-autospeak vf-shoot-toggle" });
    this.livesToggleEl.onclick = toggle("lives");
    this.progressEl = right.createDiv("vf-shoot-progress");

    this.fieldEl = this.wrapEl.createDiv("vf-shoot-field");
    this.fieldEl.createDiv("vf-shoot-danger").style.bottom = `${DANGER_GAP}px`;
    this.caretEl = createDiv("vf-shoot-caret");
    this.shipEl = this.fieldEl.createDiv("vf-shoot-ship");
    this.shipEl.innerHTML =
      '<svg viewBox="-24 -26 48 52" aria-hidden="true"><path d="M0-24 7-7 22 5v5L6 7 4 16l8 5v3L0 21l-12 3v-3l8-5-2-9-16 3V5L-7-7Z"/></svg>';

    this.inputEl = this.wrapEl.createEl("input", {
      cls: "vf-type-input",
      // type=password khiến hệ điều hành tắt bộ gõ tiếng Việt trong ô này
      type: "password",
      attr: { autocomplete: "off", autocapitalize: "off", spellcheck: "false" },
    });
    this.inputEl.addEventListener("keydown", (evt) => this.onKey(evt));
    // Bàn phím ảo (mobile) không gửi keydown kèm chữ: đọc chữ từ ô nhập rồi xoá đi
    this.inputEl.addEventListener("input", () => {
      const text = this.inputEl.value;
      this.inputEl.value = "";
      if (!this.over) for (const ch of text) this.handleChar(ch);
    });
    this.inputEl.addEventListener("blur", () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (this.over || !this.inputEl.isConnected || active?.closest(".vf-mode-picker, .vf-autospeak")) return;
        this.inputEl.focus();
      });
    });
    this.wrapEl.addEventListener("mousedown", (evt) => {
      evt.preventDefault();
      this.inputEl.focus();
    });

    this.updateHud();
    requestAnimationFrame(() => this.inputEl.focus());
  }

  private updateHud() {
    this.scoreEl.setText(`${this.score} điểm`);
    const on = this.settings.lives;
    this.livesEl.empty();
    for (let i = 0; i < LIVES; i++) {
      setIcon(this.livesEl.createSpan({ cls: i < this.lives ? "is-on" : "" }), "heart");
    }
    // Tắt tính mạng thì ẩn tim nhưng vẫn giữ chỗ để thanh trên không bị xô lệch
    this.livesEl.toggleClass("is-hidden", !on);

    renderToggle(this.wordToggleEl, this.settings.showWord, "eye", "eye-off", "Hiện chữ (tắt: chỉ ảnh + chữ cái bị đảo)");
    renderToggle(this.livesToggleEl, on, "heart", "heart-off", "Tính mạng");
    this.progressEl.setText(`${this.cleared + this.missed.length} / ${this.total}`);
  }

  // ---------- Vòng lặp ----------

  private loop = (now: number) => {
    // Tab bị ẩn thì rAF dừng; quay lại không được nhảy cóc nên giới hạn mỗi bước tối đa 50ms
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    if (this.over) return;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.queue.length && this.active.length < MAX_ON_FIELD) {
      // Càng bắn được nhiều càng ra từ nhanh hơn; chưa có chỗ trống thì đợi chút rồi thử lại
      this.spawnIn = this.spawn() ? Math.max(3, 5.5 - this.cleared * 0.06) : 0.4;
    }

    const danger = this.fieldEl.clientHeight - DANGER_GAP;
    for (const w of [...this.active]) {
      w.y += w.speed * dt;
      w.el.style.transform = `translate(${w.x}px, ${w.y}px)`;
      if (w.y + w.el.offsetHeight >= danger) this.miss(w);
      // Mất mạng cuối cùng thì dừng ngay, không trừ tiếp các từ khác chạm đáy cùng lúc
      if (this.over) return;
    }

    if (!this.over && !this.queue.length && !this.active.length) return this.finish();
    this.frame = requestAnimationFrame(this.loop);
  };

  /** Thả một từ mới từ mép trên; trả về false nếu chưa có chỗ trống (từ được giữ lại cho lần sau) */
  private spawn(): boolean {
    const card = this.queue.shift()!;
    const text = toTypeable(card.word);
    const el = this.fieldEl.createDiv("vf-shoot-word");
    const url = this.imageUrl(card);
    if (url) el.createEl("img", { cls: "vf-shoot-image", attr: { src: url, alt: "" } });
    const textEl = el.createDiv("vf-shoot-text");
    const charEls = [...text].map((ch) => textEl.createSpan({ cls: "vf-shoot-char", text: ch }));
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const fieldW = this.fieldEl.clientWidth;

    // Không rơi sát các từ khác: chừa lề ngang GAP_X, và từ cũ phải rơi xuống đủ xa (GAP_Y) mới thả cùng cột
    const free = (x: number) =>
      this.active.every(
        (w) => x + width + GAP_X <= w.x || x >= w.x + w.el.offsetWidth + GAP_X || w.y > height + GAP_Y
      );
    let x: number | null = null;
    for (let tries = 0; tries < 16 && x === null; tries++) {
      const pick = 16 + Math.random() * Math.max(0, fieldW - width - 32);
      if (free(pick)) x = pick;
    }
    if (x === null) {
      el.remove();
      this.queue.unshift(card);
      return false;
    }

    const w: Falling = {
      card,
      text,
      x,
      y: -height,
      // Rơi chậm lúc đầu, nhanh dần theo số từ đã bắn (px/giây)
      speed: Math.min(18 + this.cleared * 0.8, 45),
      input: "",
      scramble: scrambleWords(text),
      el,
      textEl,
      charEls,
    };
    this.paintWord(w);
    el.style.transform = `translate(${w.x}px, ${w.y}px)`;
    this.active.push(w);
    return true;
  }

  // ---------- Gõ phím ----------

  private onKey(evt: KeyboardEvent) {
    if (this.over || evt.isComposing || evt.keyCode === 229) return;
    if (evt.key === "Tab") {
      evt.preventDefault();
      return this.nextTarget();
    }
    if (evt.key === "Backspace") {
      evt.preventDefault();
      // Như chế độ Gõ chữ: xoá từng chữ; Alt/Ctrl/Cmd + Backspace xoá cả từ
      return this.backspace(evt.altKey || evt.ctrlKey || evt.metaKey);
    }
    if (evt.metaKey || evt.ctrlKey || evt.altKey || evt.key.length !== 1) return;
    evt.preventDefault();
    this.handleChar(evt.key);
  }

  private handleChar(ch: string) {
    const key = ch.toLowerCase();
    let w = this.target;
    if (!w) {
      // Khoá vào từ thấp nhất (nguy hiểm nhất) bắt đầu bằng chữ vừa gõ
      const pick = this.active
        .filter((f) => f.text[0].toLowerCase() === key)
        .sort((a, b) => b.y - a.y)[0];
      if (!pick) return this.wrongKey();
      this.setTarget(pick);
      w = pick;
    }
    // Chỉ gõ đúng chữ kế tiếp thì con trỏ mới tiến; gõ sai thì đứng yên tại chỗ, từ nháy báo sai
    if (w.text[w.input.length]?.toLowerCase() !== key) return this.wrongKey();
    w.input += w.text[w.input.length];
    this.paintWord(w);
    this.aimAndFire(w);
    if (w.input.toLowerCase() === w.text.toLowerCase()) this.explode(w);
  }

  private backspace(wholeWord: boolean) {
    const w = this.target;
    if (!w) return;
    w.input = wholeWord ? "" : w.input.slice(0, -1);
    this.paintWord(w);
    // Xoá hết thì bỏ mục tiêu, gõ chữ khác để chọn từ khác
    if (!w.input) this.setTarget(null);
  }

  /** Tab: bỏ từ đang ngắm (xoá phần đã gõ), chuyển sang từ kế tiếp — từ thấp nhất trở lên rồi vòng lại */
  private nextTarget() {
    const order = [...this.active].sort((a, b) => b.y - a.y);
    if (!order.length) return;
    const current = this.target;
    const next = current ? order[(order.indexOf(current) + 1) % order.length] : order[0];
    if (current) {
      current.input = "";
      this.paintWord(current);
    }
    this.setTarget(next);
  }

  private setTarget(w: Falling | null) {
    if (this.target && this.target !== w) this.target.el.removeClass("is-target");
    this.target = w;
    if (!w) return this.caretEl.detach();
    w.el.addClass("is-target");
    w.textEl.appendChild(this.caretEl);
    // Sang từ mới thì đặt con trỏ ngay, không trượt từ vị trí trong từ cũ
    this.caretEl.addClass("is-jump");
    this.placeCaret(w);
    void this.caretEl.offsetWidth;
    this.caretEl.removeClass("is-jump");
  }

  /** Đặt con trỏ trước chữ sắp gõ (gõ hết thì đứng sau chữ cuối) */
  private placeCaret(w: Falling) {
    const i = w.input.length;
    const ch = w.charEls[Math.min(i, w.charEls.length - 1)];
    this.caretEl.style.left = `${i < w.charEls.length ? ch.offsetLeft : ch.offsetLeft + ch.offsetWidth}px`;
    // Đang gõ thì con trỏ đứng yên, chạy lại hiệu ứng nhấp nháy từ đầu
    this.caretEl.removeClass("is-blinking");
    void this.caretEl.offsetWidth;
    this.caretEl.addClass("is-blinking");
  }

  /**
   * Vẽ lại dòng chữ: phần đã gõ đúng hiện chữ thật (màu cam).
   * Ẩn chữ thì phần chưa gõ là gợi ý bị đảo: trong từ đang gõ chỉ còn các chữ cái chưa dùng, giữ thứ tự đảo.
   */
  private paintWord(w: Falling) {
    const shown = this.settings.showWord ? w.text : hintText(w.text, w.scramble, w.input.length);
    w.charEls.forEach((el, i) => {
      el.setText(shown[i]);
      el.toggleClass("is-typed", i < w.input.length);
    });
    w.textEl.toggleClass("is-scrambled", !this.settings.showWord);
    if (w === this.target) this.placeCaret(w);
  }

  private wrongKey() {
    const el = this.target?.textEl ?? this.shipEl;
    el.removeClass("is-wrong");
    void el.offsetWidth;
    el.addClass("is-wrong");
  }

  // ---------- Bắn, nổ, lọt ----------

  private center(w: Falling) {
    // Nhắm vào dòng chữ, không phải giữa cả khối (có ảnh ở trên)
    return {
      x: w.x + w.textEl.offsetLeft + w.textEl.offsetWidth / 2,
      y: w.y + w.textEl.offsetTop + w.textEl.offsetHeight / 2,
    };
  }

  private aimAndFire(w: Falling) {
    const shipX = this.fieldEl.clientWidth / 2;
    const shipY = this.fieldEl.clientHeight - SHIP_BOTTOM;
    const to = this.center(w);
    const angle = Math.atan2(to.x - shipX, shipY - to.y);
    this.shipEl.style.transform = `translateX(-50%) rotate(${(angle * 180) / Math.PI}deg)`;

    // Đạn bắn ra từ mũi máy bay, theo hướng đang ngắm
    const nose = { x: shipX + Math.sin(angle) * 24, y: shipY - Math.cos(angle) * 24 };
    const dx = to.x - nose.x;
    const dy = to.y - nose.y;
    const dist = Math.hypot(dx, dy);
    const rot = (Math.atan2(dy, dx) * 180) / Math.PI;

    // Lóe sáng ở nòng + máy bay giật nhẹ
    this.pop("vf-shoot-flash", nose.x, nose.y, 140, [
      { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(1.3)", opacity: 0 },
    ]);
    this.shipEl.querySelector("svg")?.animate(
      [{ translate: "0 0" }, { translate: "0 4px" }, { translate: "0 0" }],
      { duration: 120, easing: "ease-out" }
    );

    // Vệt đạn: đầu sáng, đuôi mờ, xoay theo hướng bay; gốc xoay ở đầu đạn nên đầu đạn đi đúng đường bay
    const bullet = this.fieldEl.createDiv("vf-shoot-bullet");
    const at = (x: number, y: number) => `translate(${x - BULLET_LEN}px, ${y - 1.5}px) rotate(${rot}deg)`;
    const flight = bullet.animate([{ transform: at(nose.x, nose.y) }, { transform: at(to.x, to.y) }], {
      duration: Math.max(90, dist / 2.6),
      easing: "cubic-bezier(0.25, 0.6, 0.45, 1)",
    });
    flight.onfinish = () => {
      bullet.remove();
      // Đạn trúng chữ: vòng sóng nhỏ loé ra (từ có thể đã nổ, nên lấy vị trí đã nhắm)
      this.pop("vf-shoot-impact", to.x, to.y, 260, [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0.9 },
        { transform: "translate(-50%, -50%) scale(1.6)", opacity: 0 },
      ]);
    };
  }

  /** Một hiệu ứng nhỏ tại (x, y), tự xoá khi chạy xong */
  private pop(cls: string, x: number, y: number, duration: number, frames: Keyframe[]) {
    if (!this.fieldEl.isConnected) return;
    const el = this.fieldEl.createDiv(cls);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.animate(frames, { duration, easing: "ease-out", fill: "forwards" }).onfinish = () => el.remove();
  }

  private explode(w: Falling) {
    // Đo vị trí dòng chữ trước khi gỡ từ khỏi sân (gỡ rồi thì kích thước đo được bằng 0)
    const { x, y } = this.center(w);
    this.removeWord(w);
    this.cleared++;
    this.score += 10 * w.text.length;
    this.updateHud();
    this.onClear(w.card);

    const boom = this.fieldEl.createDiv("vf-shoot-boom");
    boom.style.left = `${x}px`;
    boom.style.top = `${y}px`;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
      const d = 34 + Math.random() * 26;
      const p = boom.createSpan("vf-shoot-spark");
      p.style.setProperty("--dx", `${Math.cos(a) * d}px`);
      p.style.setProperty("--dy", `${Math.sin(a) * d}px`);
    }
    window.setTimeout(() => boom.remove(), 650);

    // Nổ xong hiện nghĩa ngay chỗ đó, giữ trong mép sân
    if (w.card.short) {
      const tip = this.fieldEl.createDiv({ cls: "vf-shoot-meaning", text: w.card.short });
      const half = Math.min(tip.offsetWidth / 2, this.fieldEl.clientWidth / 2 - 12);
      tip.style.left = `${Math.min(Math.max(x, half + 12), this.fieldEl.clientWidth - half - 12)}px`;
      tip.style.top = `${Math.max(y, 24)}px`;
      window.setTimeout(() => tip.remove(), 2200);
    }
  }

  private miss(w: Falling) {
    if (this.over) return;
    this.removeWord(w, true);
    this.missed.push(w.card);
    // Không tính mạng thì từ lọt chỉ được ghi lại để học lại, không trừ mạng
    if (this.settings.lives) this.lives--;
    this.updateHud();
    this.fieldEl.removeClass("is-hit");
    void this.fieldEl.offsetWidth;
    this.fieldEl.addClass("is-hit");
    if (this.settings.lives && this.lives <= 0) this.finish();
  }

  private removeWord(w: Falling, missed = false) {
    this.active.splice(this.active.indexOf(w), 1);
    if (this.target === w) this.setTarget(null);
    if (missed) {
      w.el.addClass("is-missed");
      window.setTimeout(() => w.el.remove(), 400);
    } else {
      w.el.remove();
    }
  }

  private finish() {
    if (this.over) return;
    this.destroy();
    // Hết mạng: các từ còn trên sân và chưa kịp rơi cũng tính là chưa bắn được
    const missed = [...this.missed, ...this.active.map((w) => w.card), ...this.queue];
    window.setTimeout(() => this.onFinish(this.total, missed), this.lives <= 0 ? 600 : 300);
  }
}

/** Đổi chữ khó gõ (é, nháy cong, …) về ký tự bàn phím thường */
function toTypeable(word: string): string {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nút bật/tắt dạng công tắc nhỏ, chỉ có biểu tượng (chú thích hiện khi rê chuột) */
function renderToggle(btn: HTMLElement, on: boolean, iconOn: string, iconOff: string, label: string) {
  btn.empty();
  btn.toggleClass("is-on", on);
  btn.setAttr("aria-pressed", String(on));
  btn.setAttr("aria-label", `${label}: ${on ? "đang bật" : "đang tắt"}`);
  setIcon(btn.createSpan("vf-autospeak-icon"), on ? iconOn : iconOff);
  btn.createSpan("vf-autospeak-switch");
}

/** Đảo lộn chữ cái trong từng từ, giữ nguyên dấu cách; từ dài hơn 2 chữ thì cố cho khác bản gốc */
function scrambleWords(text: string): string {
  return text
    .split(" ")
    .map((word) => {
      if (word.length < 2) return word;
      let out = word;
      for (let tries = 0; tries < 6 && out.toLowerCase() === word.toLowerCase(); tries++) out = shuffle([...word]).join("");
      return out;
    })
    .join(" ");
}

/**
 * Gợi ý khi ẩn chữ: `typed` chữ đầu là chữ thật; phần còn lại của từ đang gõ là các chữ cái chưa dùng
 * theo thứ tự đảo; các từ sau giữ nguyên bản đảo.
 */
function hintText(text: string, scramble: string, typed: number): string {
  let out = text.slice(0, typed);
  let start = 0;
  for (const word of text.split(" ")) {
    const end = start + word.length;
    if (end > typed) {
      const pool = [...scramble.slice(start, end)];
      // Bỏ ra khỏi bản đảo các chữ cái của từ này đã gõ đúng
      for (const ch of text.slice(start, Math.max(start, typed))) {
        const k = pool.findIndex((p) => p.toLowerCase() === ch.toLowerCase());
        if (k >= 0) pool.splice(k, 1);
      }
      out += pool.join("");
    }
    if (end < text.length && end >= typed) out += " ";
    start = end + 1;
  }
  return out;
}
