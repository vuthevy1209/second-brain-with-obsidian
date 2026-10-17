"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => VocabFlashcardPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/editor-commands.ts
var import_obsidian = require("obsidian");

// src/parser.ts
var MULTI_COLUMN_RE = /^--- start-multi-column[^\n]*\n([\s\S]*?)^--- end-multi-column[^\n]*/gm;
var CALLOUT_RE = /^>[ \t]*\[!vocab\][+-]?[ \t]*(.*)\n?((?:^>.*(?:\n|$))*)/gim;
var IMAGE_RE = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/;
var POS_RE = /^\(([a-zA-Z. /-]{1,20})\)/;
var IPA_RE = /\/[^/\n]*[ɪʊəɛæʌɔɑɒθðʃʒŋˈˌːɜɚɝ][^/\n]*\//;
var HIGHLIGHT_RE = /==([^=]+)==|<mark[^>]*>([\s\S]*?)<\/mark>/;
function parseVocab(markdown, sourcePath) {
  const raws = [...findCallouts(markdown), ...findMultiColumns(markdown)].sort((a, b) => a.start - b.start);
  return raws.map((raw) => toCard(raw, sourcePath)).filter((c) => c !== null);
}
function splitImageColumn(column) {
  var _a;
  const content = column.replace(/```column-settings[\s\S]*?```/, "");
  const imageEmbed = (_a = content.match(IMAGE_RE)) == null ? void 0 : _a[0];
  const extra = (imageEmbed ? content.replace(imageEmbed, "") : content).trim();
  return { imageEmbed, extra };
}
function findMultiColumns(markdown) {
  const raws = [];
  for (const match of markdown.matchAll(MULTI_COLUMN_RE)) {
    const parts = match[1].split(/^--- column-break ---\s*$/m);
    if (parts.length < 2) continue;
    const second = parts.slice(1).join("\n");
    const heading = second.match(/^#{1,6}\s+(.+)$/m);
    if (!heading || heading.index === void 0) continue;
    raws.push({
      start: match.index,
      end: match.index + match[0].length,
      heading: heading[1],
      ...splitImageColumn(parts[0]),
      rest: second.slice(heading.index + heading[0].length).trim()
    });
  }
  return raws;
}
function findCallouts(markdown) {
  const raws = [];
  for (const match of markdown.matchAll(CALLOUT_RE)) {
    const lines = match[2].split("\n").map((l) => l.replace(/^>[ \t]?/, ""));
    const imageLine = lines.findIndex((l) => IMAGE_RE.test(l) && l.replace(IMAGE_RE, "").trim() === "");
    const imageEmbed = imageLine >= 0 ? lines[imageLine].match(IMAGE_RE)[0] : void 0;
    if (imageLine >= 0) lines.splice(imageLine, 1);
    raws.push({
      start: match.index,
      end: match.index + match[0].length,
      heading: match[1],
      imageEmbed,
      rest: lines.join("\n").trim()
    });
  }
  return raws;
}
function toCard(raw, sourcePath) {
  var _a, _b, _c, _d, _e;
  const reading = ((_a = raw.heading.match(/<rt>([\s\S]*?)<\/rt>/)) == null ? void 0 : _a[1].trim()) || void 0;
  const [rawWord, ...inlineMeaning] = stripHtml(raw.heading.replace(/<rt>[\s\S]*?<\/rt>/g, "")).split(":");
  const word = rawWord.replace(/\*\*|__|==|`/g, "").trim();
  const body = [inlineMeaning.join(":").trim(), raw.rest].filter(Boolean).join("\n\n");
  const image = (_c = (_b = raw.imageEmbed) == null ? void 0 : _b.match(IMAGE_RE)) == null ? void 0 : _c[1].trim();
  if (!word || !body && !image) return null;
  return {
    word,
    body,
    short: body ? shortMeaning(body, word) : "",
    image,
    pos: (_d = body.match(POS_RE)) == null ? void 0 : _d[1].trim().toLowerCase(),
    ipa: (_e = body.match(IPA_RE)) == null ? void 0 : _e[0],
    reading,
    sourcePath
  };
}
function vocabCallout(heading, imageEmbed, body) {
  const lines = [`> [!vocab] ${heading.trim()}`];
  if (imageEmbed) lines.push(`> ${imageEmbed}`, ">");
  if (body.trim()) {
    for (const line of body.trim().replace(/\n{3,}/g, "\n\n").split("\n")) {
      lines.push(line.trim() ? `> ${line}` : ">");
    }
  }
  return lines.join("\n");
}
function findUntitledMultiColumns(markdown, titled) {
  var _a;
  const raws = [];
  for (const match of markdown.matchAll(MULTI_COLUMN_RE)) {
    if (titled.some((r) => r.start === match.index)) continue;
    const parts = match[1].split(/^--- column-break ---\s*$/m);
    if (parts.length < 2) continue;
    const text = parts.slice(1).join("\n").trim();
    const [first, ...others] = text.split("\n");
    if (!(first == null ? void 0 : first.trim())) continue;
    const colon = first.indexOf(":");
    let heading;
    let rest;
    if (first.length <= 60 || colon > 0 && colon <= 40) {
      heading = first.trim();
      rest = others.join("\n").trim();
    } else {
      const bold = (_a = first.match(/\*\*([^*]+)\*\*/)) == null ? void 0 : _a[1].replace(/["“”]/g, "").trim();
      if (!bold) continue;
      heading = bold;
      rest = text;
    }
    raws.push({
      start: match.index,
      end: match.index + match[0].length,
      heading,
      ...splitImageColumn(parts[0]),
      rest
    });
  }
  return raws;
}
function convertMultiColumn(markdown) {
  const titled = findMultiColumns(markdown);
  const raws = [...titled, ...findUntitledMultiColumns(markdown, titled)].sort((a, b) => a.start - b.start);
  const total = [...markdown.matchAll(MULTI_COLUMN_RE)].length;
  let text = markdown;
  for (const raw of [...raws].reverse()) {
    let callout = vocabCallout(raw.heading, raw.imageEmbed, [raw.rest, raw.extra].filter(Boolean).join("\n\n"));
    if (!text.slice(raw.end).startsWith("\n\n")) callout += "\n";
    text = text.slice(0, raw.start) + callout + text.slice(raw.end);
  }
  return { text, converted: raws.length, skipped: total - raws.length };
}
function shortMeaning(body, word) {
  var _a, _b;
  const highlight = body.match(HIGHLIGHT_RE);
  const firstLine = (_a = body.split("\n").find((l) => l.trim() && !IMAGE_RE.test(l))) != null ? _a : "";
  const text = stripMarkdown(highlight ? (_b = highlight[1]) != null ? _b : highlight[2] : firstLine);
  const masked = text.replace(new RegExp(escapeRegExp(word), "gi"), "___");
  return masked.length > 140 ? masked.slice(0, 137) + "..." : masked;
}
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function stripHtml(text) {
  return text.replace(/<[^>]+>/g, "");
}
function stripMarkdown(text) {
  return stripHtml(text).replace(/^\s*[-*]\s+/, "").replace(/\*\*|__|==|[*_`]/g, "").replace(/\s+/g, " ").trim();
}
function maskWord(markdown, word) {
  const parts = [word, ...word.split(/\s+/).filter((w) => w.length >= 4)];
  let masked = markdown;
  for (const part of parts) {
    masked = masked.replace(new RegExp(escapeRegExp(part), "gi"), (m) => "\uFF3F".repeat(Math.min(m.length, 8)));
  }
  return masked;
}

// src/editor-commands.ts
function registerEditorCommands(plugin) {
  plugin.addCommand({
    id: "insert-vocab-card",
    name: "Ch\xE8n th\u1EBB t\u1EEB v\u1EF1ng (vocab card)",
    icon: "brain",
    editorCallback: (editor) => insertVocabCard(editor)
  });
  plugin.addCommand({
    id: "insert-example",
    name: "Ch\xE8n c\xE2u v\xED d\u1EE5 (example)",
    icon: "quote",
    editorCallback: (editor) => insertExample(editor)
  });
  plugin.addCommand({
    id: "convert-multi-column",
    name: "Chuy\u1EC3n th\u1EBB Multi-Column trong note sang th\u1EBB t\u1EEB v\u1EF1ng",
    icon: "replace",
    editorCallback: (editor) => {
      const { text, converted, skipped } = convertMultiColumn(editor.getValue());
      if (!converted) return new import_obsidian.Notice("Note n\xE0y kh\xF4ng c\xF3 th\u1EBB Multi-Column n\xE0o \u0111\u1EC3 chuy\u1EC3n.");
      editor.setValue(text);
      new import_obsidian.Notice(summary(converted, skipped));
    }
  });
  plugin.registerEvent(
    plugin.app.workspace.on("file-menu", (menu, file) => {
      menu.addItem(
        (item) => item.setTitle("Chuy\u1EC3n th\u1EBB Multi-Column sang th\u1EBB t\u1EEB v\u1EF1ng").setIcon("replace").onClick(() => convertFiles(plugin, file))
      );
    })
  );
}
function insertVocabCard(editor) {
  const word = editor.getSelection().trim();
  const from = editor.getCursor("from");
  const before = editor.getLine(from.line).slice(0, from.ch);
  const prefix = before.trim() ? "\n\n" : "";
  const lines = [`> [!vocab] ${word}`, "> ![[]]", ">", "> (n) ===="];
  editor.replaceSelection(prefix + lines.join("\n") + "\n");
  const first = from.line + (prefix ? 2 : 0);
  const cursor = word ? { line: first + 3, ch: "> (n) ==".length } : { line: first, ch: lines[0].length };
  editor.setCursor(cursor);
}
function insertExample(editor) {
  const sentence = editor.getSelection().trim() || "C\xE2u v\xED d\u1EE5 ti\u1EBFng Anh.";
  const from = editor.getCursor("from");
  const lineText = editor.getLine(from.line);
  const quote = /^>\s?/.test(lineText) ? "> " : "";
  const before = lineText.slice(0, from.ch).replace(/^>\s?/, "");
  const prefix = before.trim() ? `
${quote}
${quote}` : "";
  editor.replaceSelection(`${prefix}**${sentence}**  
${quote}D\u1ECBch ngh\u0129a.`);
  const line = from.line + (prefix ? 3 : 1);
  editor.setSelection({ line, ch: quote.length }, { line, ch: quote.length + "D\u1ECBch ngh\u0129a.".length });
}
async function convertFiles(plugin, target) {
  let converted = 0;
  let skipped = 0;
  let files = 0;
  for (const file of collectMarkdownFiles(target)) {
    await plugin.app.vault.process(file, (md) => {
      const result = convertMultiColumn(md);
      if (!result.converted) return md;
      converted += result.converted;
      skipped += result.skipped;
      files++;
      return result.text;
    });
  }
  new import_obsidian.Notice(converted ? `${summary(converted, skipped)} (${files} file)` : "Kh\xF4ng c\xF3 th\u1EBB Multi-Column n\xE0o \u0111\u1EC3 chuy\u1EC3n.");
}
function summary(converted, skipped) {
  const rest = skipped ? `, gi\u1EEF nguy\xEAn ${skipped} kh\u1ED1i kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1 ## t\u1EEB` : "";
  return `\u0110\xE3 chuy\u1EC3n ${converted} th\u1EBB sang \u0111\u1ECBnh d\u1EA1ng [!vocab]${rest}.`;
}
function collectMarkdownFiles(target) {
  if (target instanceof import_obsidian.TFile) return target.extension === "md" ? [target] : [];
  if (target instanceof import_obsidian.TFolder) return target.children.flatMap(collectMarkdownFiles);
  return [];
}

// src/modal.ts
var import_obsidian4 = require("obsidian");

// src/check.ts
var import_obsidian3 = require("obsidian");

// src/pronounce.ts
var import_obsidian2 = require("obsidian");
var cache = /* @__PURE__ */ new Map();
function lookupPronunciation(word) {
  const key = word.toLowerCase();
  let result = cache.get(key);
  if (!result) {
    result = fetchPronunciation(key);
    cache.set(key, result);
  }
  return result;
}
async function fetchPronunciation(word) {
  var _a, _b, _c, _d, _e;
  try {
    const res = await (0, import_obsidian2.requestUrl)({
      url: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      throw: false
    });
    if (res.status !== 200) return {};
    const entry = (_a = res.json) == null ? void 0 : _a[0];
    const ipa = (entry == null ? void 0 : entry.phonetic) || ((_c = (_b = entry == null ? void 0 : entry.phonetics) == null ? void 0 : _b.find((p) => p.text)) == null ? void 0 : _c.text);
    return { ipa, pos: (_e = (_d = entry == null ? void 0 : entry.meanings) == null ? void 0 : _d[0]) == null ? void 0 : _e.partOfSpeech };
  } catch (e) {
    return {};
  }
}
function speak(word) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

// src/check.ts
var CORRECT_FLASH_MS = 220;
var CheckTest = class {
  constructor(root, cards, renderClue, onFinish) {
    this.root = root;
    this.cards = cards;
    this.renderClue = renderClue;
    this.onFinish = onFinish;
    this.queue = [];
    this.index = 0;
    this.typed = "";
    /** Vị trí nào trong `typed` là chữ do gợi ý điền vào */
    this.hinted = [];
    this.usedHint = false;
    this.state = "typing";
    this.wrong = [];
    this.finished = false;
    this.advanceTimer = null;
    /** Ký tự keydown vừa xử lý; sự kiện input lặp lại đúng ký tự đó thì bỏ qua (tránh gõ 1 ra 2) */
    this.keydownChar = null;
    this.sideEl = null;
  }
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
    var _a;
    if (!this.finished) (_a = this.inputEl) == null ? void 0 : _a.focus();
  }
  get card() {
    return this.queue[this.index];
  }
  // ---------- Giao diện ----------
  render() {
    this.root.empty();
    this.wrapEl = this.root.createDiv("vf-check");
    let main;
    if (this.renderClue) {
      const layout = this.wrapEl.createDiv("vf-check-layout");
      this.sideEl = layout.createDiv("vf-type-side");
      main = layout.createDiv("vf-check-main");
    } else {
      this.sideEl = null;
      main = this.wrapEl.createDiv("vf-check-main vf-dictation");
      const listen = main.createEl("button", { cls: "vf-listen", attr: { "aria-label": "Nghe" } });
      (0, import_obsidian3.setIcon)(listen, "headphones");
      listen.onclick = () => speak(this.card.word);
    }
    this.slotsEl = main.createDiv("vf-slots");
    this.answerEl = main.createDiv("vf-check-answer");
    const actions = main.createDiv("vf-check-actions");
    this.hintBtn = actions.createEl("button", { text: "G\u1EE3i \xFD" });
    this.nextBtn = actions.createEl("button", { text: "T\u1EEB ti\u1EBFp", cls: "mod-cta" });
    this.hintBtn.onclick = () => this.hint();
    this.nextBtn.onclick = () => this.next();
    this.inputEl = this.wrapEl.createEl("input", {
      cls: "vf-type-input",
      // type=password khiến hệ điều hành tắt bộ gõ tiếng Việt trong ô này
      type: "password",
      attr: { autocomplete: "off", autocapitalize: "off", spellcheck: "false" }
    });
    this.inputEl.addEventListener("keydown", (evt) => this.onKey(evt));
    this.inputEl.addEventListener("input", (evt) => this.onInput(evt));
    this.inputEl.addEventListener("blur", () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (this.finished || !this.inputEl.isConnected || (active == null ? void 0 : active.closest(".vf-mode-picker"))) return;
        this.inputEl.focus();
      });
    });
    this.wrapEl.addEventListener("mousedown", (evt) => {
      if (!evt.target.closest("a")) evt.preventDefault();
      this.inputEl.focus();
    });
    requestAnimationFrame(() => this.inputEl.focus());
  }
  showCard() {
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
  renderSlots() {
    const word = this.card.word;
    this.slotsEl.empty();
    let wordEl = this.slotsEl.createSpan("vf-slot-word");
    for (let i = 0; i < word.length; i++) {
      if (word[i] === " ") {
        wordEl = this.slotsEl.createSpan("vf-slot-word");
        continue;
      }
      const slot = wordEl.createSpan("vf-slot");
      const ch = this.typed[i];
      if (ch !== void 0) slot.setText(ch);
      slot.toggleClass("is-hinted", !!this.hinted[i]);
      slot.toggleClass("is-current", this.state === "typing" && i === this.cursor());
      if (this.state === "wrong" && ch !== void 0) {
        slot.addClass(same(ch, word[i]) ? "is-right" : "is-off");
      }
    }
  }
  /** Vị trí ô đang chờ gõ (bỏ qua dấu cách) */
  cursor() {
    let i = this.typed.length;
    while (this.card.word[i] === " ") i++;
    return i;
  }
  updateButtons() {
    this.hintBtn.toggle(this.state === "typing");
    this.nextBtn.toggle(this.state === "wrong");
  }
  // ---------- Xử lý phím ----------
  onKey(evt) {
    this.keydownChar = null;
    if (this.finished) return;
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
  onInput(evt) {
    if (evt.isComposing) return;
    const text = this.inputEl.value;
    this.inputEl.value = "";
    const duplicate = text === this.keydownChar;
    this.keydownChar = null;
    if (duplicate) return;
    for (const ch of text) this.typeChar(ch);
  }
  typeChar(ch, fromHint = false) {
    if (this.state !== "typing") return;
    const word = this.card.word;
    if (ch === " ") {
      if (word[this.typed.length] === " ") this.typed += " ";
      return this.renderSlots();
    }
    while (word[this.typed.length] === " ") this.typed += " ";
    if (this.typed.length >= word.length) return;
    this.hinted[this.typed.length] = fromHint;
    this.typed += ch;
    if (this.typed.length >= word.length) return this.submit();
    this.renderSlots();
  }
  backspace(wholeWord) {
    if (this.state !== "typing" || !this.typed) return;
    if (wholeWord) {
      this.typed = "";
      this.hinted = [];
    } else {
      this.typed = this.typed.slice(0, -1);
      this.typed = this.typed.replace(/ +$/, "");
      this.hinted.length = this.typed.length;
    }
    this.renderSlots();
  }
  /** Gợi ý: điền đúng chữ tại con trỏ */
  hint() {
    if (this.state !== "typing") return;
    const pos = this.cursor();
    const ch = this.card.word[pos];
    if (ch === void 0) return;
    this.usedHint = true;
    this.typeChar(ch, true);
  }
  // ---------- Chấm điểm ----------
  submit() {
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
    this.answerEl.createDiv({ cls: "vf-check-answer-label", text: "\u0110\xE1p \xE1n" });
    this.answerEl.createDiv({ cls: "vf-check-answer-word", text: word });
    if (!this.renderClue && this.card.short) {
      this.answerEl.createDiv({ cls: "vf-check-answer-meaning", text: this.card.short });
    }
    this.updateButtons();
  }
  next() {
    if (this.advanceTimer !== null) window.clearTimeout(this.advanceTimer);
    this.advanceTimer = null;
    if (this.state === "typing") return;
    this.index++;
    if (this.index < this.queue.length) return this.showCard();
    this.finished = true;
    this.onFinish(this.queue.length, this.wrong);
  }
};
function same(a, b) {
  return a !== void 0 && a.toLowerCase() === b.toLowerCase();
}

// src/util.ts
function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// src/typing.ts
var IDLE_MS = 600;
var CARET_SMOOTH_MS = 30;
var TypingTest = class {
  constructor(root, cards, renderCard) {
    this.root = root;
    this.cards = cards;
    this.renderCard = renderCard;
    this.tokens = [];
    this.typed = [];
    /** Từ bị bỏ qua vì gõ tiếp mà quên Space — tính là sai dù các chữ đã đúng */
    this.skipped = [];
    this.index = 0;
    this.finished = false;
    this.idleTimer = null;
    // Vị trí con trỏ đang vẽ và vị trí đích; mỗi khung hình tiến dần về đích
    this.caretX = 0;
    this.caretY = 0;
    this.caretTargetX = 0;
    this.caretTargetY = 0;
    this.caretFrame = null;
    this.caretLastTime = 0;
    this.sideCard = null;
    this.resizeObserver = null;
    /** Ký tự keydown vừa xử lý; sự kiện input lặp lại đúng ký tự đó thì bỏ qua (tránh gõ 1 ra 2) */
    this.keydownChar = null;
    this.wordEls = [];
    /**
     * Làm mượt kiểu "đuổi theo": mỗi khung hình đi một phần quãng đường còn lại.
     * Gõ nhanh thì đích đổi liên tục nhưng con trỏ vẫn trôi liền mạch, không bị giật như transition CSS.
     */
    this.stepCaret = (now) => {
      const dt = Math.min(now - this.caretLastTime, 50);
      this.caretLastTime = now;
      const k = 1 - Math.exp(-dt / CARET_SMOOTH_MS);
      this.caretX += (this.caretTargetX - this.caretX) * k;
      this.caretY += (this.caretTargetY - this.caretY) * k;
      const done = Math.abs(this.caretTargetX - this.caretX) < 0.3 && Math.abs(this.caretTargetY - this.caretY) < 0.3;
      if (done) {
        this.caretX = this.caretTargetX;
        this.caretY = this.caretTargetY;
        this.caretFrame = null;
      } else {
        this.caretFrame = requestAnimationFrame(this.stepCaret);
      }
      this.paintCaret();
    };
  }
  start() {
    this.tokens = buildTokens(this.cards);
    this.typed = this.tokens.map(() => "");
    this.skipped = this.tokens.map(() => false);
    this.index = 0;
    this.finished = false;
    this.sideCard = null;
    this.render();
  }
  destroy() {
    var _a;
    if (this.idleTimer !== null) window.clearTimeout(this.idleTimer);
    if (this.caretFrame !== null) cancelAnimationFrame(this.caretFrame);
    this.caretFrame = null;
    (_a = this.resizeObserver) == null ? void 0 : _a.disconnect();
  }
  /** Đưa focus về ô gõ (dùng khi đóng dropdown chọn chế độ) */
  focus() {
    var _a;
    if (!this.finished) (_a = this.inputEl) == null ? void 0 : _a.focus();
  }
  // ---------- Giao diện ----------
  render() {
    var _a;
    this.root.empty();
    this.wrapEl = this.root.createDiv("vf-type vf-enter");
    const layout = this.wrapEl.createDiv("vf-type-layout");
    this.sideEl = layout.createDiv("vf-type-side");
    const main = layout.createDiv("vf-type-main");
    const viewport = main.createDiv("vf-type-viewport");
    this.wordsEl = viewport.createDiv("vf-type-words");
    this.wordEls = this.tokens.map((t) => {
      const el = this.wordsEl.createSpan("vf-tword");
      for (const ch of t.text) el.createSpan({ cls: "vf-tchar", text: ch });
      return el;
    });
    this.caretEl = this.wordsEl.createDiv("vf-caret");
    this.inputEl = this.wrapEl.createEl("input", {
      cls: "vf-type-input",
      // type=password khiến hệ điều hành tắt bộ gõ tiếng Việt trong ô này
      type: "password",
      attr: { autocomplete: "off", autocapitalize: "off", spellcheck: "false" }
    });
    this.inputEl.addEventListener("keydown", (evt) => this.onKey(evt));
    this.inputEl.addEventListener("input", (evt) => this.onInput(evt));
    this.inputEl.addEventListener("blur", () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (this.finished || !this.inputEl.isConnected || (active == null ? void 0 : active.closest(".vf-mode-picker"))) return;
        this.inputEl.focus();
      });
    });
    this.wrapEl.addEventListener("mousedown", (evt) => {
      if (!evt.target.closest("a")) evt.preventDefault();
      this.inputEl.focus();
    });
    (_a = this.resizeObserver) == null ? void 0 : _a.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.updateCaret(true));
    this.resizeObserver.observe(viewport);
    this.updateSide();
    requestAnimationFrame(() => {
      this.inputEl.focus();
      this.updateCaret(true);
    });
  }
  renderWord(i) {
    const el = this.wordEls[i];
    const text = this.tokens[i].text;
    const typed = this.typed[i];
    const length = text.length;
    while (el.children.length > length) el.lastElementChild.remove();
    while (el.children.length < length) el.createSpan("vf-tchar");
    for (let c = 0; c < length; c++) {
      const span = el.children[c];
      span.setText(text[c]);
      const state = c >= typed.length ? "" : typed[c] === text[c] ? "correct" : "wrong";
      for (const cls of ["correct", "wrong"]) span.toggleClass(cls, cls === state);
    }
    el.toggleClass("error", i < this.index && !this.isCorrect(i));
  }
  /** snap = nhảy thẳng tới chỗ (lúc mới vẽ / đổi kích thước), còn lại thì trượt mượt */
  updateCaret(snap = false) {
    const wordEl = this.wordEls[this.index];
    if (!wordEl) return;
    const chars = wordEl.children;
    const pos = this.typed[this.index].length;
    const left = pos < chars.length ? chars[pos].offsetLeft : chars.length ? chars[chars.length - 1].offsetLeft + chars[chars.length - 1].offsetWidth : wordEl.offsetLeft;
    const top = wordEl.offsetTop + (wordEl.offsetHeight - this.caretEl.offsetHeight) / 2;
    this.moveCaret(left, top, snap);
    const line = Math.round(wordEl.offsetTop / wordEl.offsetHeight);
    this.wordsEl.style.transform = `translateY(-${Math.max(0, line - 1) * wordEl.offsetHeight}px)`;
  }
  moveCaret(x, y, snap) {
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
  paintCaret() {
    this.caretEl.style.transform = `translate3d(${this.caretX}px, ${this.caretY}px, 0)`;
  }
  updateSide() {
    var _a, _b;
    const card = (_b = (_a = this.tokens[this.index]) == null ? void 0 : _a.card) != null ? _b : null;
    if (card === this.sideCard) return;
    this.sideCard = card;
    this.sideEl.empty();
    if (!card) return;
    const cardEl = this.sideEl.createDiv("vf-type-card");
    const headEl = cardEl.createDiv("vf-type-card-head");
    headEl.createDiv({ cls: "vf-type-card-word", text: card.word });
    this.renderCard(card, headEl, cardEl.createDiv("vf-type-card-content"));
  }
  /** Đang gõ thì con trỏ đứng yên, dừng một lúc mới nhấp nháy lại */
  markTyping() {
    this.wrapEl.addClass("is-typing");
    if (this.idleTimer !== null) window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => this.wrapEl.removeClass("is-typing"), IDLE_MS);
  }
  // ---------- Xử lý phím ----------
  onKey(evt) {
    this.keydownChar = null;
    if (this.finished) return;
    if (evt.isComposing || evt.keyCode === 229) return;
    if (evt.key === "Tab") {
      evt.preventDefault();
      return this.start();
    }
    if (evt.key === "Backspace") {
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
  onInput(evt) {
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
  handleChar(ch) {
    this.markTyping();
    if (ch === " ") this.nextWord();
    else this.typeChar(ch);
  }
  isCorrect(i) {
    return this.typed[i] === this.tokens[i].text && !this.skipped[i];
  }
  typeChar(ch) {
    const text = this.tokens[this.index].text;
    const typed = this.typed[this.index];
    if (typed.length >= text.length) {
      this.skipped[this.index] = true;
      if (this.index === this.tokens.length - 1) return this.finish();
      this.advance();
      return this.typeChar(ch);
    }
    this.typed[this.index] = typed + ch;
    this.renderWord(this.index);
    if (this.index === this.tokens.length - 1 && this.typed[this.index] === text) return this.finish();
    this.updateCaret();
  }
  nextWord() {
    if (!this.typed[this.index]) return;
    if (this.index === this.tokens.length - 1) return this.finish();
    this.advance();
  }
  advance() {
    this.index++;
    this.renderWord(this.index - 1);
    this.updateCaret();
    this.updateSide();
  }
  /** Giống Monkeytype: chỉ được lùi về từ trước nếu từ đó gõ sai */
  backspace(wholeWord) {
    if (!this.typed[this.index]) {
      const prev = this.index - 1;
      if (prev < 0 || this.isCorrect(prev)) return;
      this.index = prev;
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
  finish() {
    var _a;
    this.finished = true;
    if (this.caretFrame !== null) cancelAnimationFrame(this.caretFrame);
    this.caretFrame = null;
    (_a = this.resizeObserver) == null ? void 0 : _a.disconnect();
    this.root.empty();
    const done = this.root.createDiv("vf-type-finished vf-enter");
    const again = done.createEl("button", { text: "G\xF5 l\u1EA1i", cls: "mod-cta" });
    again.onclick = () => this.start();
    again.addEventListener("keydown", (evt) => {
      if (evt.key === "Tab") {
        evt.preventDefault();
        this.start();
      }
    });
    again.focus();
  }
};
function buildTokens(cards) {
  const tokens = [];
  for (const card of shuffle(cards)) {
    const words = card.word.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').split(/\s+/).filter(Boolean);
    for (const text of words) tokens.push({ text, card });
  }
  return tokens;
}

// src/modal.ts
var MODES = {
  flashcard: { label: "Flashcard", icon: "layers", desc: "L\u1EADt th\u1EBB xem t\u1EEB, \u1EA3nh v\xE0 ngh\u0129a" },
  quiz: { label: "Tr\u1EAFc nghi\u1EC7m", icon: "list-checks", desc: "Ch\u1ECDn \u0111\xE1p \xE1n \u0111\xFAng trong 4 l\u1EF1a ch\u1ECDn" },
  quizPro: { label: "Tr\u1EAFc nghi\u1EC7m n\xE2ng cao", icon: "list-todo", desc: "Nh\xECn \u1EA3nh + ngh\u0129a, ch\u1ECDn t\u1EEB ti\u1EBFng Anh" },
  typing: { label: "G\xF5 ch\u1EEF", icon: "keyboard", desc: "G\xF5 l\u1EA1i \u0111o\u1EA1n v\u0103n tr\u1ED9n t\u1EEB v\u1EF1ng" },
  check: { label: "Ki\u1EC3m tra", icon: "spell-check", desc: "Nh\xECn \u1EA3nh + ngh\u0129a, t\u1EF1 g\xF5 l\u1EA1i t\u1EEB" },
  dictation: { label: "Nghe ch\xE9p", icon: "headphones", desc: "Nghe ph\xE1t \xE2m r\u1ED3i g\xF5 l\u1EA1i t\u1EEB" }
};
var SHORTCUTS = {
  flashcard: [["Space", "l\u1EADt"], ["\u2190 \u2192", "\u0111\u1ED5i th\u1EBB"], ["S", "ph\xE1t \xE2m"]],
  quiz: [["Enter", "c\xE2u ti\u1EBFp"], ["S", "ph\xE1t \xE2m"]],
  quizPro: [["Enter", "c\xE2u ti\u1EBFp"], ["S", "ph\xE1t \xE2m"]],
  typing: [["Tab", "b\xE0i m\u1EDBi"]],
  check: [["Tab", "g\u1EE3i \xFD"], ["Enter", "t\u1EEB ti\u1EBFp"]],
  dictation: [["Tab", "g\u1EE3i \xFD"], ["Enter", "t\u1EEB ti\u1EBFp"]]
};
var KEYS = [" ", "Enter", "1", "2", "3", "4", "5", "6", "s", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
var LETTERS = ["A", "B", "C", "D"];
var StudyModal = class extends import_obsidian4.Modal {
  constructor(app, cards) {
    super(app);
    this.cards = cards;
    this.renderer = new import_obsidian4.Component();
    this.mode = "flashcard";
    this.modeMenu = null;
    this.onOutsideClick = (evt) => {
      if (!this.pickerEl.contains(evt.target)) this.closeModeMenu();
    };
    /** Phím tắt của màn hình hiện tại; đổi theo từng màn hình */
    this.keyHandler = null;
    /** Chế độ Gõ chữ / Kiểm tra đang chạy (tự xử lý bàn phím, cần dọn dẹp khi đổi chế độ) */
    this.session = null;
    /** Chỉ cho đóng khi bấm nút X, tránh lỡ tay bấm ra ngoài hoặc Esc */
    this.allowClose = false;
  }
  onOpen() {
    this.renderer.load();
    this.modalEl.addClass("vf-modal");
    const topbar = this.topbarEl = this.contentEl.createDiv("vf-topbar");
    this.pickerEl = topbar.createDiv("vf-mode-picker");
    this.modeButton = this.pickerEl.createEl("button", { cls: "vf-mode-button" });
    this.modeButton.onclick = () => this.modeMenu ? this.closeModeMenu() : this.openModeMenu();
    this.shortcutsEl = topbar.createDiv("vf-shortcuts");
    this.bindCloseButton();
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
  showHome() {
    var _a;
    const modes = Object.keys(MODES);
    (_a = this.session) == null ? void 0 : _a.destroy();
    this.session = null;
    this.modalEl.removeClass("vf-modal-wide");
    this.topbarEl.addClass("is-home");
    this.bodyEl.empty();
    const home = this.bodyEl.createDiv("vf-home vf-enter");
    home.createDiv({ cls: "vf-home-title", text: "Ch\u1ECDn ch\u1EBF \u0111\u1ED9 h\u1ECDc" });
    home.createDiv({ cls: "vf-home-subtitle", text: `${this.cards.length} t\u1EEB v\u1EF1ng` });
    const grid = home.createDiv("vf-home-grid");
    modes.forEach((mode, i) => {
      const { label, icon, desc } = MODES[mode];
      const item = grid.createDiv("vf-home-item");
      const head = item.createDiv("vf-home-item-head");
      (0, import_obsidian4.setIcon)(head.createSpan("vf-home-item-icon"), icon);
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
  bindCloseButton() {
    const native = this.modalEl.querySelector(
      ":scope > .modal-header-button, :scope > .modal-close-button"
    );
    if (native) {
      const btn2 = native.cloneNode(true);
      native.replaceWith(btn2);
      btn2.addEventListener("click", () => this.forceClose());
      return;
    }
    const btn = this.modalEl.createDiv({ cls: "vf-close clickable-icon", attr: { "aria-label": "\u0110\xF3ng" } });
    (0, import_obsidian4.setIcon)(btn, "x");
    btn.addEventListener("click", () => this.forceClose());
  }
  /** Đóng thật sự: dùng cho nút X và khi plugin bị tắt */
  forceClose() {
    this.allowClose = true;
    super.close();
  }
  close() {
    if (this.allowClose) return super.close();
    if (this.modeMenu) return this.closeModeMenu();
    this.modalEl.removeClass("vf-blocked");
    void this.modalEl.offsetWidth;
    this.modalEl.addClass("vf-blocked");
  }
  onClose() {
    var _a;
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    (_a = this.session) == null ? void 0 : _a.destroy();
    speechSynthesis.cancel();
    this.renderer.unload();
    this.contentEl.empty();
  }
  switchMode(mode) {
    var _a;
    this.setActiveMode(mode);
    (_a = this.session) == null ? void 0 : _a.destroy();
    this.session = null;
    if (mode === "typing") {
      this.keyHandler = null;
      const typing = new TypingTest(this.bodyEl, this.cards, (card, headEl, bodyEl) => {
        this.renderSpeaker(headEl, card.word);
        this.renderPronunciation(headEl, card);
        this.renderAnswer(card, bodyEl);
      });
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
    const quizCards = this.cards.filter((c) => c.short);
    if (quizCards.length < 2) {
      this.keyHandler = null;
      this.bodyEl.empty();
      this.bodyEl.createDiv({ cls: "vf-done", text: "C\u1EA7n \xEDt nh\u1EA5t 2 t\u1EEB c\xF3 ph\u1EA7n ngh\u0129a \u0111\u1EC3 l\xE0m tr\u1EAFc nghi\u1EC7m." });
      return;
    }
    this.startQuiz(shuffle(quizCards));
  }
  openModeMenu() {
    const menu = this.modeMenu = this.pickerEl.createDiv("vf-mode-menu");
    this.modeButton.addClass("is-open");
    menu.addEventListener("mousedown", (evt) => evt.preventDefault());
    for (const [mode, { label, icon }] of Object.entries(MODES)) {
      const item = menu.createDiv({ cls: "vf-mode-item" });
      item.toggleClass("is-active", mode === this.mode);
      (0, import_obsidian4.setIcon)(item.createSpan("vf-mode-item-icon"), icon);
      item.createSpan({ cls: "vf-mode-item-label", text: label });
      if (mode === this.mode) (0, import_obsidian4.setIcon)(item.createSpan("vf-mode-item-check"), "check");
      item.onclick = () => {
        this.closeModeMenu();
        if (mode !== this.mode) this.switchMode(mode);
      };
    }
    document.addEventListener("mousedown", this.onOutsideClick, true);
  }
  closeModeMenu() {
    var _a;
    const menu = this.modeMenu;
    if (!menu) return;
    this.modeMenu = null;
    this.modeButton.removeClass("is-open");
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    menu.addClass("is-closing");
    window.setTimeout(() => menu.remove(), 120);
    (_a = this.session) == null ? void 0 : _a.focus();
  }
  setActiveMode(mode) {
    this.mode = mode;
    this.topbarEl.removeClass("is-home");
    this.modeButton.empty();
    (0, import_obsidian4.setIcon)(this.modeButton.createSpan("vf-mode-button-icon"), MODES[mode].icon);
    this.modeButton.createSpan({ cls: "vf-mode-button-label", text: MODES[mode].label });
    (0, import_obsidian4.setIcon)(this.modeButton.createSpan("vf-mode-button-chevron"), "chevron-down");
    this.modalEl.toggleClass("vf-modal-wide", mode === "typing" || mode === "check" || mode === "quizPro");
    this.shortcutsEl.empty();
    for (const [key, label] of SHORTCUTS[mode]) {
      const item = this.shortcutsEl.createSpan("vf-shortcut");
      item.createEl("kbd", { text: key });
      item.appendText(label);
    }
  }
  // ---------- Flashcard ----------
  startFlashcards(cards) {
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
      let flipped = false;
      const flip = (axis) => {
        if (!flipped) flipper.dataset.axis = axis;
        flipped = !flipped;
        flipper.toggleClass("is-flipped", flipped);
      };
      const go = (step) => {
        if (index + step < 0) return;
        index += step;
        show();
      };
      scene.onclick = (evt) => {
        if (!evt.target.closest(".vf-speak, a")) flip("y");
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
  showFlashcardDone(total) {
    this.keyHandler = (key) => key === "Enter" && this.switchMode("flashcard");
    const done = this.bodyEl.createDiv("vf-done vf-enter");
    done.createDiv({ cls: "vf-done-title", text: "Ho\xE0n th\xE0nh!" });
    done.createDiv({ cls: "vf-done-text", text: `B\u1EA1n \u0111\xE3 xem h\u1EBFt ${total} th\u1EBB.` });
    const actions = done.createDiv("vf-done-actions");
    actions.createEl("button", { text: "H\u1ECDc l\u1EA1i" }).onclick = () => this.switchMode("flashcard");
    actions.createEl("button", { text: "L\xE0m tr\u1EAFc nghi\u1EC7m", cls: "mod-cta" }).onclick = () => this.switchMode("quiz");
  }
  // ---------- Trắc nghiệm ----------
  startQuiz(cards) {
    const questions = cards.map((card) => this.buildQuestion(card));
    const wrong = [];
    let index = 0;
    const show = () => {
      this.bodyEl.empty();
      const q = questions[index];
      if (!q)
        return this.showResults(questions.length, wrong, "quiz", () => this.startQuiz(shuffle(wrong)), "L\xE0m l\u1EA1i c\xE2u sai");
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
      const nextBtn = footer.createEl("button", { cls: "mod-cta", text: "C\xE2u ti\u1EBFp" });
      nextBtn.hide();
      const choose = (i) => {
        if (answered || !q.options[i]) return;
        answered = true;
        const correct = q.options[i] === q.card;
        buttons[q.options.indexOf(q.card)].addClass("is-correct");
        if (!correct) {
          buttons[i].addClass("is-wrong");
          wrong.push(q.card);
        }
        buttons.forEach((b) => b.disabled = true);
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
      buttons.forEach((b, i) => b.onclick = () => choose(i));
      nextBtn.onclick = next;
      this.keyHandler = (key) => {
        if (key === "Enter") next();
        else if (key === "s") (q.askWord || answered) && speak(q.card.word);
      };
    };
    show();
  }
  // ---------- Trắc nghiệm nâng cao ----------
  /** Bố cục 50/50: trái là ảnh + nghĩa (đã che từ), phải là 4 từ tiếng Anh xếp dọc */
  startQuizPro(cards) {
    const questions = cards.map((card) => ({ ...this.buildQuestion(card), askWord: false }));
    const wrong = [];
    let index = 0;
    const show = () => {
      this.bodyEl.empty();
      const q = questions[index];
      if (!q)
        return this.showResults(questions.length, wrong, "quizPro", () => this.startQuizPro(shuffle(wrong)), "L\xE0m l\u1EA1i c\xE2u sai");
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
      const nextBtn = footer.createEl("button", { cls: "mod-cta", text: "C\xE2u ti\u1EBFp" });
      nextBtn.hide();
      const choose = (i) => {
        if (answered) return;
        answered = true;
        const correct = q.options[i] === q.card;
        buttons[q.options.indexOf(q.card)].addClass("is-correct");
        if (!correct) {
          buttons[i].addClass("is-wrong");
          wrong.push(q.card);
        }
        buttons.forEach((b) => b.disabled = true);
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
      buttons.forEach((b, i) => b.onclick = () => choose(i));
      nextBtn.onclick = next;
      this.keyHandler = (key) => {
        if (key === "Enter") next();
        else if (key === "s" && answered) speak(q.card.word);
      };
    };
    show();
  }
  /** Gợi ý không lộ đáp án: loại từ, ảnh, nghĩa (che từ tiếng Anh trong câu ví dụ) */
  renderClue(card, el) {
    if (card.pos) el.createDiv({ cls: "vf-pos vf-check-pos", text: card.pos });
    this.renderImage(card, el);
    this.renderBody({ ...card, body: maskWord(card.body, card.word) }, el);
  }
  showNotEnough() {
    this.keyHandler = null;
    this.bodyEl.empty();
    this.bodyEl.createDiv({ cls: "vf-done", text: "C\u1EA7n \xEDt nh\u1EA5t 2 t\u1EEB \u0111\u1EC3 l\xE0m tr\u1EAFc nghi\u1EC7m." });
  }
  buildQuestion(card) {
    const distractors = shuffle(
      this.cards.filter(
        (c) => c !== card && c.short && c.word.toLowerCase() !== card.word.toLowerCase() && c.short !== card.short
      )
    );
    const options = [card];
    for (const c of distractors) {
      if (options.length >= 4) break;
      if (options.some((o) => o.short === c.short || o.word === c.word)) continue;
      options.push(c);
    }
    return { card, askWord: Math.random() < 0.5, options: shuffle(options) };
  }
  // ---------- Kiểm tra ----------
  /** dictation = Nghe chép: cùng logic gõ lại, nhưng chỉ có nút nghe thay cho ảnh + nghĩa */
  startCheck(cards, dictation = false) {
    var _a;
    this.keyHandler = null;
    (_a = this.session) == null ? void 0 : _a.destroy();
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
          "L\xE0m l\u1EA1i t\u1EEB sai"
        );
      }
    );
    this.session = check;
    check.start();
  }
  // ---------- Kết quả (trắc nghiệm / kiểm tra) ----------
  showResults(total, wrong, mode, retryWrong, retryWrongLabel) {
    this.keyHandler = null;
    this.bodyEl.empty();
    const score = total - wrong.length;
    const done = this.bodyEl.createDiv("vf-done vf-enter");
    done.createDiv({ cls: "vf-done-title", text: `${score} / ${total}` });
    const actions = done.createDiv("vf-done-actions");
    actions.createEl("button", { text: "L\xE0m l\u1EA1i t\u1EA5t c\u1EA3", cls: wrong.length ? "" : "mod-cta" }).onclick = () => this.switchMode(mode);
    if (wrong.length) {
      actions.createEl("button", { text: retryWrongLabel, cls: "mod-cta" }).onclick = retryWrong;
      const list = done.createDiv("vf-wrong-list");
      for (const c of wrong) this.renderNoteCard(c, list);
    }
  }
  // ---------- Chung ----------
  renderSpeaker(parent, word) {
    const btn = parent.createEl("button", { cls: "vf-speak clickable-icon", attr: { "aria-label": "Ph\xE1t \xE2m (S)" } });
    (0, import_obsidian4.setIcon)(btn, "volume-2");
    btn.onclick = (evt) => {
      evt.stopPropagation();
      speak(word);
    };
  }
  /** Từ loại + IPA lấy từ note; thiếu thì tra thêm từ điển online */
  renderPronunciation(parent, card) {
    const row = parent.createDiv("vf-pron");
    const posEl = row.createSpan("vf-pos");
    const ipaEl = row.createSpan("vf-ipa");
    const fill = (pos, ipa) => {
      posEl.setText(pos != null ? pos : "");
      posEl.toggle(!!pos);
      ipaEl.setText(ipa != null ? ipa : "");
      ipaEl.toggle(!!ipa);
    };
    fill(card.pos, card.ipa);
    if (card.reading) parent.createDiv({ cls: "vf-reading", text: card.reading });
    if (!card.pos || !card.ipa) {
      lookupPronunciation(card.word).then((p) => {
        var _a, _b;
        return fill((_a = card.pos) != null ? _a : shortPos(p.pos), (_b = card.ipa) != null ? _b : p.ipa);
      });
    }
  }
  renderAnswer(card, el) {
    this.renderImage(card, el);
    this.renderBody(card, el);
  }
  /** Thẻ giống khối multi-column trong note: ảnh bên trái, từ + nghĩa bên phải */
  renderNoteCard(card, parent) {
    const cardEl = parent.createDiv("vf-note-card");
    if (card.image) this.renderImage(card, cardEl.createDiv("vf-note-card-image"));
    else cardEl.addClass("is-text-only");
    const text = cardEl.createDiv("vf-note-card-text");
    text.createDiv({ cls: "vf-note-card-word", text: card.word });
    this.renderBody(card, text);
  }
  renderImage(card, el) {
    if (!card.image) return;
    const file = this.app.metadataCache.getFirstLinkpathDest(card.image, card.sourcePath);
    if (file) el.createEl("img", { cls: "vf-image", attr: { src: this.app.vault.getResourcePath(file) } });
  }
  renderBody(card, el) {
    if (!card.body) return;
    import_obsidian4.MarkdownRenderer.render(this.app, card.body, el.createDiv("vf-markdown"), card.sourcePath, this.renderer);
  }
};
var POS_SHORT = { noun: "n", verb: "v", adjective: "adj", adverb: "adv", preposition: "prep" };
function shortPos(pos) {
  var _a;
  return pos ? (_a = POS_SHORT[pos]) != null ? _a : pos : void 0;
}

// src/main.ts
var VocabFlashcardPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    this.modal = null;
  }
  async onload() {
    this.addRibbonIcon("brain", "H\u1ECDc t\u1EEB v\u1EF1ng trong note hi\u1EC7n t\u1EA1i", () => this.studyActiveFile());
    this.addCommand({
      id: "study-current-note",
      name: "H\u1ECDc t\u1EEB v\u1EF1ng trong note hi\u1EC7n t\u1EA1i",
      callback: () => this.studyActiveFile()
    });
    this.addCommand({
      id: "study-current-folder",
      name: "H\u1ECDc t\u1EEB v\u1EF1ng trong c\u1EA3 th\u01B0 m\u1EE5c c\u1EE7a note hi\u1EC7n t\u1EA1i",
      callback: () => {
        var _a;
        const folder = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.parent;
        if (folder) this.study(folder);
        else new import_obsidian5.Notice("H\xE3y m\u1EDF m\u1ED9t note tr\u01B0\u1EDBc.");
      }
    });
    registerEditorCommands(this);
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem(
          (item) => item.setTitle("H\u1ECDc t\u1EEB v\u1EF1ng").setIcon("brain").onClick(() => this.study(file))
        );
      })
    );
  }
  studyActiveFile() {
    const file = this.app.workspace.getActiveFile();
    if (file) this.study(file);
    else new import_obsidian5.Notice("H\xE3y m\u1EDF m\u1ED9t note tr\u01B0\u1EDBc.");
  }
  async study(target) {
    const files = collectMarkdownFiles2(target);
    const cards = [];
    for (const file of files) {
      cards.push(...parseVocab(await this.app.vault.cachedRead(file), file.path));
    }
    if (cards.length === 0) {
      new import_obsidian5.Notice("Kh\xF4ng t\xECm th\u1EA5y t\u1EEB v\u1EF1ng n\xE0o (c\u1EA7n th\u1EBB > [!vocab] t\u1EEB, ho\u1EB7c kh\u1ED1i Multi-Column c\xF3 ## t\u1EEB).");
      return;
    }
    this.modal = new StudyModal(this.app, cards);
    this.modal.open();
  }
  // Modal chặn Esc/bấm ra ngoài, nên khi tắt hoặc tải lại plugin phải tự đóng nó
  onunload() {
    var _a;
    (_a = this.modal) == null ? void 0 : _a.forceClose();
    this.modal = null;
  }
};
function collectMarkdownFiles2(target) {
  if (target instanceof import_obsidian5.TFile) return target.extension === "md" ? [target] : [];
  if (target instanceof import_obsidian5.TFolder) return target.children.flatMap(collectMarkdownFiles2);
  return [];
}
