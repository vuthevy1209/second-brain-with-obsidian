import { VocabCard } from "./parser";
import { shuffle } from "./util";

/** Số cặp mỗi lượt: lưới 4×4 = 8 từ tiếng Anh + 8 nghĩa tiếng Việt */
const PAIRS = 8;

interface Tile {
  card: VocabCard;
  kind: "en" | "vi";
  el: HTMLElement;
}

/**
 * Chế độ "Ghép thẻ": lưới 4×4 gồm 8 từ tiếng Anh và 8 nghĩa, xếp lẫn lộn.
 * Chọn một ô rồi chọn ô bên kia: đúng cặp thì cả hai biến mất (và đọc từ), sai thì lóe đỏ nhẹ.
 * Hết 8 cặp thì sang lượt mới với 8 từ tiếp theo.
 */
export class MatchGame {
  private rounds: VocabCard[][] = [];
  private round = 0;
  private left = 0;
  private selected: Tile | null = null;
  /** Đang chờ hiệu ứng sai/đúng chạy xong thì không nhận bấm, tránh bấm dồn */
  private busy = false;
  private wrong = new Set<VocabCard>();
  private timers: number[] = [];
  private headEl!: HTMLElement;

  constructor(
    private root: HTMLElement,
    private cards: VocabCard[],
    /** Ghép xong mọi lượt: tổng số từ và các từ từng ghép sai */
    private onFinish: (total: number, wrong: VocabCard[]) => void,
    /** Ghép đúng một cặp (dùng để đọc từ) */
    private onMatch: (card: VocabCard) => void = () => {}
  ) {}

  start() {
    this.rounds = buildRounds(this.cards);
    this.round = 0;
    this.wrong.clear();
    if (!this.rounds.length) {
      this.root.empty();
      this.root.createDiv({ cls: "vf-done", text: "Cần ít nhất 2 từ có phần nghĩa để chơi ghép thẻ." });
      return;
    }
    this.renderRound();
  }

  destroy() {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
  }

  focus() {}

  private later(fn: () => void, ms: number) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private renderRound() {
    const cards = this.rounds[this.round];
    this.left = cards.length;
    this.selected = null;
    this.busy = false;

    this.root.empty();
    const wrap = this.root.createDiv("vf-match vf-enter");
    this.headEl = wrap.createDiv("vf-match-head");
    const grid = wrap.createDiv("vf-match-grid");

    const tiles = shuffle(cards.flatMap((card) => [
      { card, kind: "en" as const },
      { card, kind: "vi" as const },
    ]));
    for (const t of tiles) {
      const el = grid.createEl("button", { cls: `vf-match-tile is-${t.kind}` });
      el.createSpan({ cls: "vf-match-text", text: t.kind === "en" ? t.card.word : t.card.short });
      const tile: Tile = { ...t, el };
      el.onclick = () => this.pick(tile);
    }
    this.updateHead();
  }

  private updateHead() {
    const done = this.rounds[this.round].length - this.left;
    this.headEl.setText(
      `Lượt ${this.round + 1}/${this.rounds.length} · ${done}/${this.rounds[this.round].length} cặp`
    );
  }

  private pick(tile: Tile) {
    if (this.busy || tile.el.hasClass("is-matched")) return;
    const first = this.selected;
    // Bấm lại ô đang chọn thì bỏ chọn; bấm ô cùng loại thì đổi sang ô đó
    if (first === tile) {
      tile.el.removeClass("is-selected");
      this.selected = null;
      return;
    }
    if (!first || first.kind === tile.kind) {
      first?.el.removeClass("is-selected");
      tile.el.addClass("is-selected");
      this.selected = tile;
      return;
    }

    this.selected = null;
    this.busy = true;
    if (first.card === tile.card) {
      for (const t of [first, tile]) {
        t.el.removeClass("is-selected");
        t.el.addClass("is-matched");
      }
      this.onMatch(tile.card);
      this.left--;
      this.updateHead();
      this.later(() => {
        this.busy = false;
        if (this.left === 0) this.nextRound();
      }, 380);
    } else {
      // Sai: cả hai lóe đỏ nhẹ; ghi lại cả hai từ để học lại
      this.wrong.add(first.card);
      this.wrong.add(tile.card);
      tile.el.addClass("is-selected");
      for (const t of [first, tile]) t.el.addClass("is-wrong");
      this.later(() => {
        for (const t of [first, tile]) t.el.removeClass("is-wrong", "is-selected");
        this.busy = false;
      }, 480);
    }
  }

  private nextRound() {
    this.round++;
    if (this.round < this.rounds.length) return this.renderRound();
    // Từ bù ở lượt cuối là từ đã ra trước đó: chỉ đếm mỗi từ một lần
    const total = new Set(this.rounds.flat()).size;
    this.onFinish(total, [...this.wrong]);
  }
}

/** Mỗi lượt mở ra 4 từ mới; số lượt = tổng số từ / 4 (làm tròn lên) */
const STEP = 4;

/**
 * Chia thẻ thành các lượt 8 cặp (lưới 4×4), số lượt = tổng số từ / 4 làm tròn lên.
 * Xếp ngẫu nhiên các từ thành một vòng rồi trượt cửa sổ 8 từ, mỗi lượt dịch 4 từ (tới cuối thì vòng
 * lại đầu): mỗi từ ra đúng 2 lượt liền nhau. Trong cùng một lượt không để hai thẻ trùng từ hoặc trùng
 * nghĩa (không phân biệt được cặp nào đúng) — gặp thẻ trùng thì bỏ qua, lấy thẻ kế tiếp trong vòng.
 */
function buildRounds(cards: VocabCard[]): VocabCard[][] {
  const order = shuffle(cards.filter((c) => c.short && c.word));
  const n = order.length;
  if (n < 2) return [];
  const clash = (round: VocabCard[], c: VocabCard) =>
    round.some(
      (r) => r === c || r.word.toLowerCase() === c.word.toLowerCase() || r.short.toLowerCase() === c.short.toLowerCase()
    );

  const rounds: VocabCard[][] = [];
  for (let i = 0; i < Math.ceil(n / STEP); i++) {
    const round: VocabCard[] = [];
    for (let k = 0; k < n && round.length < PAIRS; k++) {
      const c = order[(i * STEP + k) % n];
      if (!clash(round, c)) round.push(c);
    }
    rounds.push(round);
  }
  return rounds;
}
