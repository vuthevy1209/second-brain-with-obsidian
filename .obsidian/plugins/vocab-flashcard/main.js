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
var import_obsidian10 = require("obsidian");

// src/editor-commands.ts
var import_obsidian2 = require("obsidian");

// src/parser.ts
var MULTI_COLUMN_RE = /^--- start-multi-column[^\n]*\n([\s\S]*?)^--- end-multi-column[^\n]*/gm;
var CALLOUT_RE = /^>[ \t]*\[!vocab\][+-]?[ \t]*(.*)\n?((?:^>.*(?:\n|$))*)/gim;
var IMAGE_RE = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/;
var POS_RE = /^\(([a-zA-Z. /-]{1,20})\)/;
var IPA_RE = /\/[^/\n]*[ɪʊəɛæʌɔɑɒθðʃʒŋˈˌːɜɚɝ][^/\n]*\//;
var HIGHLIGHT_RE = /==([^=]+)==|<mark[^>]*>([\s\S]*?)<\/mark>/;
var POS_LIST = ["n", "v", "adj", "adv", "prep", "conj", "pron", "det", "phr v", "phr", "idiom"];
var META_RE = new RegExp(`^\\((${POS_LIST.join("|")})\\)\\s*(\\/[^/\\n]+\\/)?\\s*$`);
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
  const standard = toStandardCard(raw, reading, sourcePath);
  if (standard) return standard;
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
function toStandardCard(raw, reading, sourcePath) {
  var _a, _b, _c, _d;
  const lines = raw.rest.split("\n");
  const meta = (_a = lines[0]) == null ? void 0 : _a.trim().match(META_RE);
  if (!meta) return null;
  const meaningAt = lines.findIndex((l, i) => i > 0 && l.trim());
  const highlight = (_b = lines[meaningAt]) == null ? void 0 : _b.match(/==([^=]+)==/);
  if (!highlight) return null;
  const word = stripHtml(raw.heading.replace(/<rt>[\s\S]*?<\/rt>/g, "")).replace(/\*\*|__|==|`/g, "").trim();
  if (!word) return null;
  const masked = stripMarkdown(highlight[1]).replace(new RegExp(escapeRegExp(word), "gi"), "___");
  return {
    word,
    // Bỏ dòng meta: modal đã hiện loại từ + IPA riêng
    body: lines.slice(meaningAt).join("\n").trim(),
    short: masked.length > 140 ? masked.slice(0, 137) + "..." : masked,
    image: (_d = (_c = raw.imageEmbed) == null ? void 0 : _c.match(IMAGE_RE)) == null ? void 0 : _d[1].trim(),
    pos: meta[1],
    ipa: meta[2],
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
var EXAMPLE_RE = /^>[ \t]*\[!example\][+-]?[ \t]*(.*)$/i;
function cardExamples(card) {
  var _a, _b;
  const examples = [];
  const lines = card.body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const en = stripMarkdown((_b = (_a = lines[i].trim().match(EXAMPLE_RE)) == null ? void 0 : _a[1]) != null ? _b : "");
    if (!en) continue;
    const vi = [];
    while (i + 1 < lines.length && /^>/.test(lines[i + 1].trim()) && !EXAMPLE_RE.test(lines[i + 1].trim())) {
      vi.push(lines[++i].trim().replace(/^>[ \t]?/, ""));
    }
    examples.push({ en, vi: stripMarkdown(vi.join(" ")) });
  }
  return examples;
}
function maskWord(markdown, word) {
  const parts = [word, ...word.split(/\s+/).filter((w) => w.length >= 4)];
  let masked = markdown;
  for (const part of parts) {
    masked = masked.replace(new RegExp(escapeRegExp(part), "gi"), (m) => "\uFF3F".repeat(Math.min(m.length, 8)));
  }
  return masked;
}

// src/ruby.ts
var import_obsidian = require("obsidian");
function addRubyMeaning(app, editor) {
  const selection = editor.getSelection();
  const word = selection.trim();
  if (!word) {
    new import_obsidian.Notice("H\xE3y b\xF4i \u0111en t\u1EEB ho\u1EB7c b\u1EA1n ch\u01B0a chuy\u1EC3n sang ch\u1EBF \u0111\u1ED9 ghi!");
    return;
  }
  const from = editor.getCursor("from");
  const to = editor.getCursor("to");
  new MeaningPrompt(app, word, (meaning) => {
    const { text, cursorOffset } = buildRuby(selection, meaning, editor.getLine(to.line).slice(to.ch));
    const start = editor.posToOffset(from);
    editor.replaceRange(text, from, to);
    editor.setCursor(editor.offsetToPos(start + cursorOffset));
    editor.focus();
  }).open();
}
function buildRuby(selection, meaning, after) {
  const lead = selection.match(/^\s*/)[0];
  let trail = selection.match(/\s*$/)[0];
  const ruby = `<ruby>${selection.trim()}<rt>${meaning}</rt></ruby>`;
  if (!trail && (after === "" || /^[\p{L}\p{N}]/u.test(after))) trail = " ";
  const end = lead.length + ruby.length;
  const skip = trail ? trail.length : after ? 1 : 0;
  return { text: lead + ruby + trail, cursorOffset: end + skip };
}
var MeaningPrompt = class extends import_obsidian.Modal {
  constructor(app, word, onSubmit) {
    super(app);
    this.word = word;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    this.modalEl.addClass("vf-ruby-prompt");
    this.titleEl.setText(`Ngh\u0129a c\u1EE7a "${this.word}":`);
    const input = this.contentEl.createEl("input", { type: "text", cls: "vf-ruby-input" });
    input.placeholder = "Nh\u1EADp ngh\u0129a r\u1ED3i b\u1EA5m Enter";
    input.addEventListener("keydown", (evt) => {
      if (evt.key !== "Enter" || evt.isComposing) return;
      evt.preventDefault();
      const meaning = input.value.trim();
      this.close();
      if (meaning) this.onSubmit(meaning);
    });
    window.setTimeout(() => input.focus());
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/editor-commands.ts
function registerEditorCommands(plugin) {
  plugin.addCommand({
    id: "insert-vocab-card",
    name: "Ch\xE8n th\u1EBB t\u1EEB v\u1EF1ng (vocab card)",
    icon: "brain",
    editorCallback: (editor) => insertVocabCard(editor)
  });
  plugin.addCommand({
    id: "add-ruby-meaning",
    name: "Th\xEAm ngh\u0129a l\xEAn tr\xEAn t\u1EEB (ruby)",
    icon: "languages",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "R" }],
    editorCallback: (editor) => addRubyMeaning(plugin.app, editor)
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
      if (!converted) return new import_obsidian2.Notice("Note n\xE0y kh\xF4ng c\xF3 th\u1EBB Multi-Column n\xE0o \u0111\u1EC3 chuy\u1EC3n.");
      editor.setValue(text);
      new import_obsidian2.Notice(summary(converted, skipped));
    }
  });
}
function insertVocabCard(editor) {
  const word = editor.getSelection().trim();
  const from = editor.getCursor("from");
  const before = editor.getLine(from.line).slice(0, from.ch);
  const prefix = before.trim() ? "\n\n" : "";
  const lines = [`> [!vocab] ${word}`, "> ![[]]", ">", "> (n) //", "> ===="];
  editor.replaceSelection(prefix + lines.join("\n") + "\n");
  const first = from.line + (prefix ? 2 : 0);
  const cursor = word ? { line: first + 4, ch: "> ==".length } : { line: first, ch: lines[0].length };
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
  editor.replaceSelection(`${prefix}> [!example] ${sentence}
${quote}> D\u1ECBch ngh\u0129a.`);
  const line = from.line + (prefix ? 3 : 1);
  const ch = quote.length + "> ".length;
  editor.setSelection({ line, ch }, { line, ch: ch + "D\u1ECBch ngh\u0129a.".length });
}
function summary(converted, skipped) {
  const rest = skipped ? `, gi\u1EEF nguy\xEAn ${skipped} kh\u1ED1i kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1 ## t\u1EEB` : "";
  return `\u0110\xE3 chuy\u1EC3n ${converted} th\u1EBB sang \u0111\u1ECBnh d\u1EA1ng [!vocab]${rest}.`;
}

// src/card-meta.ts
var POS_NAMES = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  prep: "preposition",
  conj: "conjunction",
  pron: "pronoun",
  det: "determiner",
  "phr v": "phrasal verb",
  phr: "phrase",
  idiom: "idiom"
};
var META_RE2 = new RegExp(`^\\((${POS_LIST.join("|")})\\)\\s*(\\/[^/\\n]+\\/)?$`);
function registerCardMeta(plugin) {
  plugin.registerMarkdownPostProcessor((el) => {
    const callouts = el.matches('.callout[data-callout="vocab"]') ? [el] : Array.from(el.querySelectorAll('.callout[data-callout="vocab"]'));
    for (const callout of callouts) decorateMeta(callout);
  });
}
function decorateMeta(callout) {
  var _a, _b, _c, _d;
  const content = callout.querySelector(":scope > .callout-content");
  if (!content || content.querySelector(":scope > .vf-meta")) return;
  for (const p of Array.from(content.querySelectorAll(":scope > p"))) {
    const first = p.firstChild;
    const match = (first == null ? void 0 : first.nodeType) === Node.TEXT_NODE ? (_a = first.textContent) == null ? void 0 : _a.trim().match(META_RE2) : null;
    if (!match) continue;
    const meta = createDiv({ cls: "vf-meta" });
    meta.createSpan({ cls: "vf-pos", text: POS_NAMES[match[1]], attr: { "data-pos": match[1] } });
    if (match[2]) meta.createSpan({ cls: "vf-ipa", text: match[2] });
    content.insertBefore(meta, p);
    first.remove();
    while (((_b = p.firstChild) == null ? void 0 : _b.nodeName) === "BR" || ((_c = p.firstChild) == null ? void 0 : _c.nodeType) === Node.TEXT_NODE && !((_d = p.firstChild.textContent) == null ? void 0 : _d.trim())) {
      p.firstChild.remove();
    }
    if (!p.hasChildNodes()) p.remove();
    return;
  }
}

// src/speaker.ts
var import_obsidian4 = require("obsidian");

// src/pronounce.ts
var import_obsidian3 = require("obsidian");
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
    const res = await (0, import_obsidian3.requestUrl)({
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
var LOOP_PAUSE_MS = 900;
var loopId = 0;
function stopSpeaking() {
  loopId++;
  speechSynthesis.cancel();
}
function speak(word) {
  stopSpeaking();
  speechSynthesis.speak(utterance(word, "en-US"));
}
function speakLoop(english, vietnamese) {
  stopSpeaking();
  const id = loopId;
  const parts = [utterance(english, "en-US"), ...vietnamese ? [utterance(vietnamese, "vi-VN")] : []];
  const play = (i) => {
    if (id !== loopId) return;
    if (i === parts.length) {
      window.setTimeout(() => play(0), LOOP_PAUSE_MS);
      return;
    }
    parts[i].onend = () => play(i + 1);
    parts[i].onerror = () => id === loopId && play(i + 1);
    speechSynthesis.speak(parts[i]);
  };
  play(0);
}
function utterance(text, lang) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  return u;
}

// src/speaker.ts
function registerCardSpeaker(plugin) {
  plugin.registerMarkdownPostProcessor((el) => {
    const callouts = el.matches('.callout[data-callout="vocab"]') ? [el] : Array.from(el.querySelectorAll('.callout[data-callout="vocab"]'));
    for (const callout of callouts) addSpeaker(callout);
  });
}
function addSpeaker(callout) {
  const title = callout.querySelector(":scope > .callout-title .callout-title-inner");
  if (!title || callout.querySelector(":scope > .vf-card-speak")) return;
  const word = cardWord(title);
  if (!word) return;
  const btn = callout.createEl("button", {
    cls: "vf-card-speak clickable-icon",
    attr: { "aria-label": `Nghe "${word}"`, type: "button" }
  });
  (0, import_obsidian4.setIcon)(btn, "volume-2");
  btn.addEventListener("mousedown", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  });
  btn.addEventListener("click", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    speak(word);
  });
}
function cardWord(title) {
  var _a;
  const clone = title.cloneNode(true);
  clone.querySelectorAll("rt, rp, .vf-card-speak").forEach((n) => n.remove());
  return ((_a = clone.textContent) != null ? _a : "").replace(/\s+/g, " ").trim();
}

// src/icons.ts
var PROGRESSION_ICON = "vf-progression";
var PROGRESSION_SVG = '<path fill="currentColor" transform="scale(0.1953125)" d="M463 20.3L315.6 75.65 368.5 109C274 228 137.3 301.3 21.8 329.2l32.72 59.6C184.3 346.5 321.7 270.2 410.2 135.4l40.3 25.4L463 20.3zm7.7 116.7l-4.8 54.8-51.3-32.4c-1.8 2.7-3.7 5.3-5.6 8V487h78V137h-16.3zM320.1 265c-12.7 11-25.8 21.4-39.1 31.2V487h78V265h-38.9zm-123.7 84c-14.4 7.6-28.8 14.6-43.4 21.2V487h78V349h-34.6zM25 393v94h78v-94h-5.68c-14.82 5.5-29.63 10.6-44.35 15.3l-7.06 2.2-9.6-17.5H25z"/>';

// src/modal.ts
var import_obsidian7 = require("obsidian");

// src/check.ts
var import_obsidian5 = require("obsidian");
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
      (0, import_obsidian5.setIcon)(listen, "headphones");
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

// src/modes.ts
var MODES = {
  flashcard: { label: "Flashcard", icon: "layers", desc: "L\u1EADt th\u1EBB xem t\u1EEB, \u1EA3nh v\xE0 ngh\u0129a" },
  quiz: { label: "Tr\u1EAFc nghi\u1EC7m", icon: "list-checks", desc: "Ch\u1ECDn \u0111\xE1p \xE1n \u0111\xFAng trong 4 l\u1EF1a ch\u1ECDn" },
  quizPro: { label: "Tr\u1EAFc nghi\u1EC7m n\xE2ng cao", icon: "list-todo", desc: "Nh\xECn \u1EA3nh + ngh\u0129a, ch\u1ECDn t\u1EEB ti\u1EBFng Anh" },
  typing: { label: "G\xF5 ch\u1EEF", icon: "keyboard", desc: "G\xF5 l\u1EA1i \u0111o\u1EA1n v\u0103n tr\u1ED9n t\u1EEB v\u1EF1ng" },
  typingPro: { label: "G\xF5 n\xE2ng cao", icon: "text-cursor-input", desc: "G\xF5 l\u1EA1i c\xE2u v\xED d\u1EE5 c\u1EE7a t\u1EEBng t\u1EEB" },
  check: { label: "Ki\u1EC3m tra", icon: "spell-check", desc: "Nh\xECn \u1EA3nh + ngh\u0129a, t\u1EF1 g\xF5 l\u1EA1i t\u1EEB" },
  dictation: { label: "Nghe ch\xE9p", icon: "headphones", desc: "Nghe ph\xE1t \xE2m r\u1ED3i g\xF5 l\u1EA1i t\u1EEB" },
  shooter: { label: "B\u1EAFn ch\u1EEF", icon: "plane", desc: "G\xF5 \u0111\xFAng t\u1EEB \u0111ang r\u01A1i \u0111\u1EC3 b\u1EAFn n\u1ED5, n\u1ED5 xong hi\u1EC7n ngh\u0129a" },
  match: { label: "Gh\xE9p th\u1EBB", icon: "layout-grid", desc: "L\u01B0\u1EDBi 4\xD74: gh\xE9p t\u1EEB ti\u1EBFng Anh v\u1EDBi ngh\u0129a c\u1EE7a n\xF3" }
};

// src/util.ts
function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// src/match.ts
var PAIRS = 8;
var MatchGame = class {
  constructor(root, cards, onFinish, onMatch = () => {
  }) {
    this.root = root;
    this.cards = cards;
    this.onFinish = onFinish;
    this.onMatch = onMatch;
    this.rounds = [];
    this.round = 0;
    this.left = 0;
    this.selected = null;
    /** Đang chờ hiệu ứng sai/đúng chạy xong thì không nhận bấm, tránh bấm dồn */
    this.busy = false;
    this.wrong = /* @__PURE__ */ new Set();
    this.timers = [];
  }
  start() {
    this.rounds = buildRounds(this.cards);
    this.round = 0;
    this.wrong.clear();
    if (!this.rounds.length) {
      this.root.empty();
      this.root.createDiv({ cls: "vf-done", text: "C\u1EA7n \xEDt nh\u1EA5t 2 t\u1EEB c\xF3 ph\u1EA7n ngh\u0129a \u0111\u1EC3 ch\u01A1i gh\xE9p th\u1EBB." });
      return;
    }
    this.renderRound();
  }
  destroy() {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
  }
  focus() {
  }
  later(fn, ms) {
    this.timers.push(window.setTimeout(fn, ms));
  }
  renderRound() {
    const cards = this.rounds[this.round];
    this.left = cards.length;
    this.selected = null;
    this.busy = false;
    this.root.empty();
    const wrap = this.root.createDiv("vf-match vf-enter");
    this.headEl = wrap.createDiv("vf-match-head");
    const grid = wrap.createDiv("vf-match-grid");
    const tiles = shuffle(cards.flatMap((card) => [
      { card, kind: "en" },
      { card, kind: "vi" }
    ]));
    for (const t of tiles) {
      const el = grid.createEl("button", { cls: `vf-match-tile is-${t.kind}` });
      el.createSpan({ cls: "vf-match-text", text: t.kind === "en" ? t.card.word : t.card.short });
      const tile = { ...t, el };
      el.onclick = () => this.pick(tile);
    }
    this.updateHead();
  }
  updateHead() {
    const done = this.rounds[this.round].length - this.left;
    this.headEl.setText(
      `L\u01B0\u1EE3t ${this.round + 1}/${this.rounds.length} \xB7 ${done}/${this.rounds[this.round].length} c\u1EB7p`
    );
  }
  pick(tile) {
    if (this.busy || tile.el.hasClass("is-matched")) return;
    const first = this.selected;
    if (first === tile) {
      tile.el.removeClass("is-selected");
      this.selected = null;
      return;
    }
    if (!first || first.kind === tile.kind) {
      first == null ? void 0 : first.el.removeClass("is-selected");
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
  nextRound() {
    this.round++;
    if (this.round < this.rounds.length) return this.renderRound();
    const total = new Set(this.rounds.flat()).size;
    this.onFinish(total, [...this.wrong]);
  }
};
var STEP = 4;
function buildRounds(cards) {
  const order = shuffle(cards.filter((c) => c.short && c.word));
  const n = order.length;
  if (n < 2) return [];
  const clash = (round, c) => round.some(
    (r) => r === c || r.word.toLowerCase() === c.word.toLowerCase() || r.short.toLowerCase() === c.short.toLowerCase()
  );
  const rounds = [];
  for (let i = 0; i < Math.ceil(n / STEP); i++) {
    const round = [];
    for (let k = 0; k < n && round.length < PAIRS; k++) {
      const c = order[(i * STEP + k) % n];
      if (!clash(round, c)) round.push(c);
    }
    rounds.push(round);
  }
  return rounds;
}

// src/shooter.ts
var import_obsidian6 = require("obsidian");
var LIVES = 6;
var MAX_ON_FIELD = 4;
var MAX_LEN = 30;
var SHIP_BOTTOM = 34;
var DANGER_GAP = 72;
var BULLET_LEN = 32;
var GAP_X = 56;
var GAP_Y = 110;
var ShooterGame = class {
  constructor(root, cards, onFinish, onClear = () => {
  }, imageUrl = () => null, settings = { lives: true, showWord: true, save: () => {
  } }) {
    this.root = root;
    this.cards = cards;
    this.onFinish = onFinish;
    this.onClear = onClear;
    this.imageUrl = imageUrl;
    this.settings = settings;
    this.queue = [];
    this.total = 0;
    this.active = [];
    this.target = null;
    this.missed = [];
    this.cleared = 0;
    this.score = 0;
    this.lives = LIVES;
    this.frame = null;
    this.lastTime = 0;
    this.spawnIn = 0;
    this.over = false;
    // ---------- Vòng lặp ----------
    this.loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1e3, 0.05);
      this.lastTime = now;
      if (this.over) return;
      this.spawnIn -= dt;
      if (this.spawnIn <= 0 && this.queue.length && this.active.length < MAX_ON_FIELD) {
        this.spawnIn = this.spawn() ? Math.max(3, 5.5 - this.cleared * 0.06) : 0.4;
      }
      const danger = this.fieldEl.clientHeight - DANGER_GAP;
      for (const w of [...this.active]) {
        w.y += w.speed * dt;
        w.el.style.transform = `translate(${w.x}px, ${w.y}px)`;
        if (w.y + w.el.offsetHeight >= danger) this.miss(w);
        if (this.over) return;
      }
      if (!this.over && !this.queue.length && !this.active.length) return this.finish();
      this.frame = requestAnimationFrame(this.loop);
    };
  }
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
    var _a;
    if (!this.over) (_a = this.inputEl) == null ? void 0 : _a.focus();
  }
  // ---------- Giao diện ----------
  render() {
    this.root.empty();
    this.wrapEl = this.root.createDiv("vf-shoot vf-enter");
    const hud = this.wrapEl.createDiv("vf-shoot-hud");
    this.scoreEl = hud.createDiv("vf-shoot-score");
    this.livesEl = hud.createDiv("vf-shoot-lives");
    const right = hud.createDiv("vf-shoot-hud-right");
    const toggle = (key) => () => {
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
    this.shipEl.innerHTML = '<svg viewBox="-24 -26 48 52" aria-hidden="true"><path d="M0-24 7-7 22 5v5L6 7 4 16l8 5v3L0 21l-12 3v-3l8-5-2-9-16 3V5L-7-7Z"/></svg>';
    this.inputEl = this.wrapEl.createEl("input", {
      cls: "vf-type-input",
      // type=password khiến hệ điều hành tắt bộ gõ tiếng Việt trong ô này
      type: "password",
      attr: { autocomplete: "off", autocapitalize: "off", spellcheck: "false" }
    });
    this.inputEl.addEventListener("keydown", (evt) => this.onKey(evt));
    this.inputEl.addEventListener("input", () => {
      const text = this.inputEl.value;
      this.inputEl.value = "";
      if (!this.over) for (const ch of text) this.handleChar(ch);
    });
    this.inputEl.addEventListener("blur", () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (this.over || !this.inputEl.isConnected || (active == null ? void 0 : active.closest(".vf-mode-picker, .vf-autospeak"))) return;
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
  updateHud() {
    this.scoreEl.setText(`${this.score} \u0111i\u1EC3m`);
    const on = this.settings.lives;
    this.livesEl.empty();
    for (let i = 0; i < LIVES; i++) {
      (0, import_obsidian6.setIcon)(this.livesEl.createSpan({ cls: i < this.lives ? "is-on" : "" }), "heart");
    }
    this.livesEl.toggleClass("is-hidden", !on);
    renderToggle(this.wordToggleEl, this.settings.showWord, "eye", "eye-off", "Hi\u1EC7n ch\u1EEF (t\u1EAFt: ch\u1EC9 \u1EA3nh + ch\u1EEF c\xE1i b\u1ECB \u0111\u1EA3o)");
    renderToggle(this.livesToggleEl, on, "heart", "heart-off", "T\xEDnh m\u1EA1ng");
    this.progressEl.setText(`${this.cleared + this.missed.length} / ${this.total}`);
  }
  /** Thả một từ mới từ mép trên; trả về false nếu chưa có chỗ trống (từ được giữ lại cho lần sau) */
  spawn() {
    const card = this.queue.shift();
    const text = toTypeable(card.word);
    const el = this.fieldEl.createDiv("vf-shoot-word");
    const url = this.imageUrl(card);
    if (url) el.createEl("img", { cls: "vf-shoot-image", attr: { src: url, alt: "" } });
    const textEl = el.createDiv("vf-shoot-text");
    const charEls = [...text].map((ch) => textEl.createSpan({ cls: "vf-shoot-char", text: ch }));
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const fieldW = this.fieldEl.clientWidth;
    const free = (x2) => this.active.every(
      (w2) => x2 + width + GAP_X <= w2.x || x2 >= w2.x + w2.el.offsetWidth + GAP_X || w2.y > height + GAP_Y
    );
    let x = null;
    for (let tries = 0; tries < 16 && x === null; tries++) {
      const pick = 16 + Math.random() * Math.max(0, fieldW - width - 32);
      if (free(pick)) x = pick;
    }
    if (x === null) {
      el.remove();
      this.queue.unshift(card);
      return false;
    }
    const w = {
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
      charEls
    };
    this.paintWord(w);
    el.style.transform = `translate(${w.x}px, ${w.y}px)`;
    this.active.push(w);
    return true;
  }
  // ---------- Gõ phím ----------
  onKey(evt) {
    if (this.over || evt.isComposing || evt.keyCode === 229) return;
    if (evt.key === "Tab") {
      evt.preventDefault();
      return this.nextTarget();
    }
    if (evt.key === "Backspace") {
      evt.preventDefault();
      return this.backspace(evt.altKey || evt.ctrlKey || evt.metaKey);
    }
    if (evt.metaKey || evt.ctrlKey || evt.altKey || evt.key.length !== 1) return;
    evt.preventDefault();
    this.handleChar(evt.key);
  }
  handleChar(ch) {
    var _a;
    const key = ch.toLowerCase();
    let w = this.target;
    if (!w) {
      const pick = this.active.filter((f) => f.text[0].toLowerCase() === key).sort((a, b) => b.y - a.y)[0];
      if (!pick) return this.wrongKey();
      this.setTarget(pick);
      w = pick;
    }
    if (((_a = w.text[w.input.length]) == null ? void 0 : _a.toLowerCase()) !== key) return this.wrongKey();
    w.input += w.text[w.input.length];
    this.paintWord(w);
    this.aimAndFire(w);
    if (w.input.toLowerCase() === w.text.toLowerCase()) this.explode(w);
  }
  backspace(wholeWord) {
    const w = this.target;
    if (!w) return;
    w.input = wholeWord ? "" : w.input.slice(0, -1);
    this.paintWord(w);
    if (!w.input) this.setTarget(null);
  }
  /** Tab: bỏ từ đang ngắm (xoá phần đã gõ), chuyển sang từ kế tiếp — từ thấp nhất trở lên rồi vòng lại */
  nextTarget() {
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
  setTarget(w) {
    if (this.target && this.target !== w) this.target.el.removeClass("is-target");
    this.target = w;
    if (!w) return this.caretEl.detach();
    w.el.addClass("is-target");
    w.textEl.appendChild(this.caretEl);
    this.caretEl.addClass("is-jump");
    this.placeCaret(w);
    void this.caretEl.offsetWidth;
    this.caretEl.removeClass("is-jump");
  }
  /** Đặt con trỏ trước chữ sắp gõ (gõ hết thì đứng sau chữ cuối) */
  placeCaret(w) {
    const i = w.input.length;
    const ch = w.charEls[Math.min(i, w.charEls.length - 1)];
    this.caretEl.style.left = `${i < w.charEls.length ? ch.offsetLeft : ch.offsetLeft + ch.offsetWidth}px`;
    this.caretEl.removeClass("is-blinking");
    void this.caretEl.offsetWidth;
    this.caretEl.addClass("is-blinking");
  }
  /**
   * Vẽ lại dòng chữ: phần đã gõ đúng hiện chữ thật (màu cam).
   * Ẩn chữ thì phần chưa gõ là gợi ý bị đảo: trong từ đang gõ chỉ còn các chữ cái chưa dùng, giữ thứ tự đảo.
   */
  paintWord(w) {
    const shown = this.settings.showWord ? w.text : hintText(w.text, w.scramble, w.input.length);
    w.charEls.forEach((el, i) => {
      el.setText(shown[i]);
      el.toggleClass("is-typed", i < w.input.length);
    });
    w.textEl.toggleClass("is-scrambled", !this.settings.showWord);
    if (w === this.target) this.placeCaret(w);
  }
  wrongKey() {
    var _a, _b;
    const el = (_b = (_a = this.target) == null ? void 0 : _a.textEl) != null ? _b : this.shipEl;
    el.removeClass("is-wrong");
    void el.offsetWidth;
    el.addClass("is-wrong");
  }
  // ---------- Bắn, nổ, lọt ----------
  center(w) {
    return {
      x: w.x + w.textEl.offsetLeft + w.textEl.offsetWidth / 2,
      y: w.y + w.textEl.offsetTop + w.textEl.offsetHeight / 2
    };
  }
  aimAndFire(w) {
    var _a;
    const shipX = this.fieldEl.clientWidth / 2;
    const shipY = this.fieldEl.clientHeight - SHIP_BOTTOM;
    const to = this.center(w);
    const angle = Math.atan2(to.x - shipX, shipY - to.y);
    this.shipEl.style.transform = `translateX(-50%) rotate(${angle * 180 / Math.PI}deg)`;
    const nose = { x: shipX + Math.sin(angle) * 24, y: shipY - Math.cos(angle) * 24 };
    const dx = to.x - nose.x;
    const dy = to.y - nose.y;
    const dist = Math.hypot(dx, dy);
    const rot = Math.atan2(dy, dx) * 180 / Math.PI;
    this.pop("vf-shoot-flash", nose.x, nose.y, 140, [
      { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(1.3)", opacity: 0 }
    ]);
    (_a = this.shipEl.querySelector("svg")) == null ? void 0 : _a.animate(
      [{ translate: "0 0" }, { translate: "0 4px" }, { translate: "0 0" }],
      { duration: 120, easing: "ease-out" }
    );
    const bullet = this.fieldEl.createDiv("vf-shoot-bullet");
    const at = (x, y) => `translate(${x - BULLET_LEN}px, ${y - 1.5}px) rotate(${rot}deg)`;
    const flight = bullet.animate([{ transform: at(nose.x, nose.y) }, { transform: at(to.x, to.y) }], {
      duration: Math.max(90, dist / 2.6),
      easing: "cubic-bezier(0.25, 0.6, 0.45, 1)"
    });
    flight.onfinish = () => {
      bullet.remove();
      this.pop("vf-shoot-impact", to.x, to.y, 260, [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0.9 },
        { transform: "translate(-50%, -50%) scale(1.6)", opacity: 0 }
      ]);
    };
  }
  /** Một hiệu ứng nhỏ tại (x, y), tự xoá khi chạy xong */
  pop(cls, x, y, duration, frames) {
    if (!this.fieldEl.isConnected) return;
    const el = this.fieldEl.createDiv(cls);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.animate(frames, { duration, easing: "ease-out", fill: "forwards" }).onfinish = () => el.remove();
  }
  explode(w) {
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
      const a = i / 10 * Math.PI * 2 + Math.random() * 0.4;
      const d = 34 + Math.random() * 26;
      const p = boom.createSpan("vf-shoot-spark");
      p.style.setProperty("--dx", `${Math.cos(a) * d}px`);
      p.style.setProperty("--dy", `${Math.sin(a) * d}px`);
    }
    window.setTimeout(() => boom.remove(), 650);
    if (w.card.short) {
      const tip = this.fieldEl.createDiv({ cls: "vf-shoot-meaning", text: w.card.short });
      const half = Math.min(tip.offsetWidth / 2, this.fieldEl.clientWidth / 2 - 12);
      tip.style.left = `${Math.min(Math.max(x, half + 12), this.fieldEl.clientWidth - half - 12)}px`;
      tip.style.top = `${Math.max(y, 24)}px`;
      window.setTimeout(() => tip.remove(), 2200);
    }
  }
  miss(w) {
    if (this.over) return;
    this.removeWord(w, true);
    this.missed.push(w.card);
    if (this.settings.lives) this.lives--;
    this.updateHud();
    this.fieldEl.removeClass("is-hit");
    void this.fieldEl.offsetWidth;
    this.fieldEl.addClass("is-hit");
    if (this.settings.lives && this.lives <= 0) this.finish();
  }
  removeWord(w, missed = false) {
    this.active.splice(this.active.indexOf(w), 1);
    if (this.target === w) this.setTarget(null);
    if (missed) {
      w.el.addClass("is-missed");
      window.setTimeout(() => w.el.remove(), 400);
    } else {
      w.el.remove();
    }
  }
  finish() {
    if (this.over) return;
    this.destroy();
    const missed = [...this.missed, ...this.active.map((w) => w.card), ...this.queue];
    window.setTimeout(() => this.onFinish(this.total, missed), this.lives <= 0 ? 600 : 300);
  }
};
function toTypeable(word) {
  return word.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...").replace(/\s+/g, " ").trim();
}
function renderToggle(btn, on, iconOn, iconOff, label) {
  btn.empty();
  btn.toggleClass("is-on", on);
  btn.setAttr("aria-pressed", String(on));
  btn.setAttr("aria-label", `${label}: ${on ? "\u0111ang b\u1EADt" : "\u0111ang t\u1EAFt"}`);
  (0, import_obsidian6.setIcon)(btn.createSpan("vf-autospeak-icon"), on ? iconOn : iconOff);
  btn.createSpan("vf-autospeak-switch");
}
function scrambleWords(text) {
  return text.split(" ").map((word) => {
    if (word.length < 2) return word;
    let out = word;
    for (let tries = 0; tries < 6 && out.toLowerCase() === word.toLowerCase(); tries++) out = shuffle([...word]).join("");
    return out;
  }).join(" ");
}
function hintText(text, scramble, typed) {
  let out = text.slice(0, typed);
  let start = 0;
  for (const word of text.split(" ")) {
    const end = start + word.length;
    if (end > typed) {
      const pool = [...scramble.slice(start, end)];
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

// src/typing.ts
var IDLE_MS = 600;
var CARET_SMOOTH_MS = 30;
var TypingTest = class {
  constructor(root, cards, renderCard, onStart = () => {
  }, onFinish = () => {
  }, onSpeak = () => {
  }, variant = "words", onPassageDone = () => {
  }) {
    this.root = root;
    this.cards = cards;
    this.renderCard = renderCard;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.onSpeak = onSpeak;
    this.variant = variant;
    this.onPassageDone = onPassageDone;
    this.passages = [];
    this.passageIndex = 0;
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
    /** Đang ở câu thứ mấy (chỉ Gõ nâng cao) */
    this.progressEl = null;
    /** Nút "Câu tiếp" hiện khi gõ xong một câu (chỉ Gõ nâng cao) */
    this.nextEl = null;
    /** Gõ xong câu, đang chờ bấm nút / Space / Enter để sang câu kế */
    this.awaitingNext = false;
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
    this.onStart();
    this.passages = this.variant === "examples" ? buildExamplePassages(this.cards) : [{ tokens: buildTokens(this.cards) }];
    this.passageIndex = 0;
    this.awaitingNext = false;
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
    this.wrapEl.toggleClass("is-sentence", this.variant === "examples");
    const main = layout.createDiv("vf-type-main");
    this.progressEl = this.variant === "examples" ? main.createDiv("vf-type-progress") : null;
    this.meaningEl = main.createDiv("vf-type-meaning");
    this.meaningEl.toggleClass("is-sentence", this.variant === "examples");
    const viewport = main.createDiv("vf-type-viewport");
    this.wordsEl = viewport.createDiv("vf-type-words");
    this.nextEl = this.variant === "examples" ? main.createDiv("vf-type-next") : null;
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
    this.renderPassage();
  }
  /** Vẽ đoạn đang gõ; khung bên trái chỉ đổi khi sang thẻ khác (2 câu ví dụ của cùng một từ giữ nguyên thẻ) */
  renderPassage() {
    var _a, _b, _c;
    const passage = this.passages[this.passageIndex];
    this.tokens = passage.tokens;
    this.typed = this.tokens.map(() => "");
    this.skipped = this.tokens.map(() => false);
    this.index = 0;
    this.awaitingNext = false;
    this.wrapEl.removeClass("is-done");
    (_a = this.nextEl) == null ? void 0 : _a.empty();
    this.wordsEl.empty();
    this.wordEls = this.tokens.map((t) => {
      const el = this.wordsEl.createSpan("vf-tword");
      for (const ch of t.text) el.createSpan({ cls: "vf-tchar", text: ch });
      return el;
    });
    this.caretEl = this.wordsEl.createDiv("vf-caret");
    if (this.variant === "examples") {
      (_b = this.progressEl) == null ? void 0 : _b.setText(`${this.passageIndex + 1} / ${this.passages.length}`);
      this.meaningEl.empty();
      if (passage.caption) this.meaningEl.createSpan({ cls: "vf-type-meaning-text", text: passage.caption });
      if (passage.speech) this.onSpeak(passage.speech, (_c = passage.caption) == null ? void 0 : _c.replace(/_+/g, "").trim());
    }
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
    if (this.variant === "examples") return;
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
    if (this.variant === "words") this.meaningEl.empty();
    if (!card) return;
    if (this.variant === "words") this.onSpeak(card.word);
    if (this.variant === "words" && card.short) this.meaningEl.createSpan({ cls: "vf-type-meaning-text", text: card.short });
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
    if (this.awaitingNext && evt.key === "Enter") {
      evt.preventDefault();
      return this.goNext();
    }
    if (evt.key === "Backspace") {
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
    if (this.awaitingNext) {
      if (ch === " ") this.goNext();
      return;
    }
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
      if (this.index === this.tokens.length - 1) return this.endPassage();
      this.advance();
      return this.typeChar(ch);
    }
    this.typed[this.index] = typed + ch;
    this.renderWord(this.index);
    if (this.index === this.tokens.length - 1 && this.typed[this.index] === text) return this.endPassage();
    this.updateCaret();
  }
  nextWord() {
    if (!this.typed[this.index]) return;
    if (this.index === this.tokens.length - 1) return this.endPassage();
    this.advance();
  }
  /** Hết một đoạn: còn câu thì sang câu kế, hết rồi thì kết thúc bài */
  endPassage() {
    if (this.variant === "words") return this.finish();
    this.awaitingNext = true;
    this.index = this.tokens.length;
    this.renderWord(this.tokens.length - 1);
    this.wrapEl.addClass("is-done");
    this.onPassageDone();
    if (!this.nextEl) return;
    this.nextEl.empty();
    const last = this.passageIndex === this.passages.length - 1;
    const button = this.nextEl.createEl("button", { cls: "mod-cta vf-type-next-button", text: last ? "Ho\xE0n th\xE0nh" : "C\xE2u ti\u1EBFp" });
    button.onclick = () => this.goNext();
  }
  goNext() {
    if (!this.awaitingNext) return;
    if (this.passageIndex === this.passages.length - 1) return this.finish();
    this.passageIndex++;
    this.renderPassage();
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
    this.onFinish();
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
  return shuffle(cards).flatMap((card) => tokenize(card.word, card));
}
function buildExamplePassages(cards) {
  const passages = [];
  for (const card of shuffle(cards)) {
    const examples = cardExamples(card);
    if (!examples.length) passages.push({ tokens: tokenize(card.word, card), caption: card.short, speech: card.word });
    for (const { en, vi } of examples) passages.push({ tokens: tokenize(en, card), caption: vi, speech: en });
  }
  return passages.filter((p) => p.tokens.length);
}
function tokenize(text, card) {
  return normalize(text).split(/\s+/).filter(Boolean).map((t) => ({ text: t, card }));
}
function normalize(text) {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, "-").replace(/…/g, "...").replace(/\u00a0/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// src/modal.ts
var SHORTCUTS = {
  flashcard: [["Space", "l\u1EADt"], ["\u2190 \u2192", "\u0111\u1ED5i th\u1EBB"], ["S", "ph\xE1t \xE2m"]],
  quiz: [["Enter", "c\xE2u ti\u1EBFp"], ["S", "ph\xE1t \xE2m"]],
  quizPro: [["Enter", "c\xE2u ti\u1EBFp"], ["S", "ph\xE1t \xE2m"]],
  typing: [["Tab", "b\xE0i m\u1EDBi"]],
  typingPro: [["Enter", "c\xE2u ti\u1EBFp"], ["Tab", "b\xE0i m\u1EDBi"]],
  check: [["Tab", "g\u1EE3i \xFD"], ["Enter", "t\u1EEB ti\u1EBFp"]],
  dictation: [["Tab", "g\u1EE3i \xFD"], ["Enter", "t\u1EEB ti\u1EBFp"]],
  shooter: [],
  match: []
};
var AUTO_SPEAK_MODES = ["typing", "typingPro", "quiz", "quizPro"];
var AUTO_SPEAK_KEY = "vocab-flashcard-auto-speak";
var SHOOTER_KEYS = { lives: "vocab-flashcard-shooter-lives", showWord: "vocab-flashcard-shooter-show-word" };
var KEYS = [" ", "Enter", "1", "2", "3", "4", "5", "6", "7", "8", "s", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
var LETTERS = ["A", "B", "C", "D"];
var StudyModal = class extends import_obsidian7.Modal {
  constructor(app, cards, tracker, folderScope) {
    var _a;
    super(app);
    this.cards = cards;
    this.tracker = tracker;
    this.folderScope = folderScope;
    this.renderer = new import_obsidian7.Component();
    this.mode = "flashcard";
    this.modeMenu = null;
    this.onOutsideClick = (evt) => {
      if (!this.pickerEl.contains(evt.target)) this.closeModeMenu();
    };
    this.autoSpeak = false;
    /** Phím tắt của màn hình hiện tại; đổi theo từng màn hình */
    this.keyHandler = null;
    /** Chế độ Gõ chữ / Kiểm tra đang chạy (tự xử lý bàn phím, cần dọn dẹp khi đổi chế độ) */
    this.session = null;
    /** Chỉ cho đóng khi bấm nút X, tránh lỡ tay bấm ra ngoài hoặc Esc */
    this.allowClose = false;
    this.extendOn = false;
    /** Lần nạp thư mục mới nhất, để bỏ kết quả của lần gõ cũ trả về muộn */
    this.extendSeq = 0;
    this.countEl = null;
    this.gridEl = null;
    this.baseCards = cards;
    this.extendPath = (_a = folderScope == null ? void 0 : folderScope.folder) != null ? _a : "";
  }
  onOpen() {
    this.renderer.load();
    this.modalEl.addClass("vf-modal");
    const topbar = this.topbarEl = this.contentEl.createDiv("vf-topbar");
    this.pickerEl = topbar.createDiv("vf-mode-picker");
    this.modeButton = this.pickerEl.createEl("button", { cls: "vf-mode-button" });
    this.modeButton.onclick = () => this.modeMenu ? this.closeModeMenu() : this.openModeMenu();
    this.autoSpeak = this.app.loadLocalStorage(AUTO_SPEAK_KEY) === true;
    this.autoSpeakEl = topbar.createEl("button", { cls: "vf-autospeak" });
    this.autoSpeakEl.addEventListener("mousedown", (evt) => evt.preventDefault());
    this.autoSpeakEl.onclick = () => {
      this.autoSpeak = !this.autoSpeak;
      this.app.saveLocalStorage(AUTO_SPEAK_KEY, this.autoSpeak);
      if (!this.autoSpeak) stopSpeaking();
      this.renderAutoSpeak();
    };
    this.renderAutoSpeak();
    this.shortcutsEl = topbar.createDiv("vf-shortcuts");
    this.bindCloseButton();
    for (const type of ["keydown", "mousedown", "wheel"]) {
      this.modalEl.addEventListener(type, () => this.tracker.activity(), { capture: true, passive: true });
    }
    this.bodyEl = this.contentEl.createDiv("vf-body");
    for (const key of KEYS) {
      this.scope.register([], key, (evt) => {
        var _a, _b;
        if ((_b = (_a = evt.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, ".vf-extend-path")) return true;
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
    this.tracker.end();
    (_a = this.session) == null ? void 0 : _a.destroy();
    this.session = null;
    this.modalEl.removeClass("vf-modal-wide");
    this.topbarEl.addClass("is-home");
    this.bodyEl.empty();
    const home = this.bodyEl.createDiv("vf-home vf-enter");
    home.createDiv({ cls: "vf-home-title", text: "Ch\u1ECDn ch\u1EBF \u0111\u1ED9 h\u1ECDc" });
    this.countEl = home.createDiv("vf-home-subtitle");
    const grid = this.gridEl = home.createDiv("vf-home-grid");
    modes.forEach((mode, i) => {
      const { label, icon, desc } = MODES[mode];
      const item = grid.createDiv("vf-home-item");
      const head = item.createDiv("vf-home-item-head");
      (0, import_obsidian7.setIcon)(head.createSpan("vf-home-item-icon"), icon);
      head.createEl("kbd", { text: String(i + 1) });
      item.createDiv({ cls: "vf-home-item-label", text: label });
      item.createDiv({ cls: "vf-home-item-desc", text: desc });
      item.onclick = () => this.cards.length && this.switchMode(mode);
    });
    if (this.folderScope) this.renderExtend(home);
    this.updateCount();
    this.keyHandler = (key) => {
      const mode = modes[Number(key) - 1];
      if (mode && this.cards.length) this.switchMode(mode);
    };
  }
  /** Ô "Mở rộng" ở cuối màn hình chọn chế độ: tick vào thì học cả thư mục trong đường dẫn */
  renderExtend(home) {
    const box = home.createDiv("vf-extend");
    const toggle = box.createEl("label", { cls: "vf-extend-toggle" });
    const check = toggle.createEl("input", { type: "checkbox" });
    check.checked = this.extendOn;
    toggle.createSpan({ cls: "vf-extend-label", text: "M\u1EDF r\u1ED9ng" });
    toggle.createSpan({ cls: "vf-extend-sub", text: "h\u1ECDc c\u1EA3 th\u01B0 m\u1EE5c thay v\xEC ch\u1EC9 note n\xE0y" });
    const field = box.createDiv("vf-extend-field");
    field.toggle(this.extendOn);
    const row = field.createDiv("vf-extend-row");
    (0, import_obsidian7.setIcon)(row.createSpan("vf-extend-icon"), "folder-open");
    const input = row.createEl("input", {
      type: "text",
      cls: "vf-extend-path",
      attr: { spellcheck: "false", placeholder: "(c\u1EA3 vault)" }
    });
    input.value = this.extendPath;
    check.onchange = () => {
      this.extendOn = check.checked;
      field.toggle(this.extendOn);
      if (this.extendOn) input.focus();
      void this.applyExtend();
    };
    let timer = null;
    input.addEventListener("input", () => {
      this.extendPath = input.value;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => void this.applyExtend(), 200);
    });
    if (this.extendOn) void this.applyExtend();
  }
  /** Nạp lại bộ thẻ theo trạng thái Mở rộng và đường dẫn đang nhập */
  async applyExtend() {
    var _a;
    const seq = ++this.extendSeq;
    if (!this.extendOn || !this.folderScope) {
      this.cards = this.baseCards;
      return this.updateCount();
    }
    const folder = this.extendPath.trim().replace(/^\/+|\/+$/g, "");
    (_a = this.countEl) == null ? void 0 : _a.setText("\u0110ang \u0111\u1ECDc th\u01B0 m\u1EE5c\u2026");
    const cards = await this.folderScope.load(folder);
    if (seq !== this.extendSeq) return;
    this.cards = cards != null ? cards : [];
    this.updateCount(cards === null ? "Kh\xF4ng t\xECm th\u1EA5y th\u01B0 m\u1EE5c n\xE0y" : void 0);
  }
  updateCount(error) {
    var _a, _b, _c;
    (_a = this.countEl) == null ? void 0 : _a.setText(error != null ? error : `${this.cards.length} t\u1EEB v\u1EF1ng${this.extendOn ? " trong th\u01B0 m\u1EE5c" : ""}`);
    (_b = this.countEl) == null ? void 0 : _b.toggleClass("is-error", !!error);
    (_c = this.gridEl) == null ? void 0 : _c.toggleClass("is-disabled", this.cards.length === 0);
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
    (0, import_obsidian7.setIcon)(btn, "x");
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
    this.tracker.end();
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    (_a = this.session) == null ? void 0 : _a.destroy();
    stopSpeaking();
    this.renderer.unload();
    this.contentEl.empty();
  }
  switchMode(mode) {
    var _a;
    this.tracker.begin(mode);
    stopSpeaking();
    this.setActiveMode(mode);
    (_a = this.session) == null ? void 0 : _a.destroy();
    this.session = null;
    if (mode === "typing" || mode === "typingPro") {
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
        () => this.tracker.begin(mode),
        () => {
          this.tracker.end();
          stopSpeaking();
        },
        // Bật Tự đọc: Gõ chữ đọc từ mới; Gõ nâng cao đọc câu ví dụ rồi câu dịch, lặp lại tới khi sang câu khác
        (text, translation) => {
          if (!this.autoSpeak) return;
          if (mode === "typingPro") speakLoop(text, translation != null ? translation : "");
          else speak(text);
        },
        // Gõ nâng cao: gõ từng câu ví dụ thay vì đoạn văn trộn từ
        mode === "typingPro" ? "examples" : "words",
        // Gõ xong câu thì thôi đọc lặp
        () => stopSpeaking()
      );
      this.session = typing;
      return typing.start();
    }
    if (mode === "shooter") return this.startShooter(this.cards);
    if (mode === "match") return this.startMatch(this.cards);
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
      (0, import_obsidian7.setIcon)(item.createSpan("vf-mode-item-icon"), icon);
      item.createSpan({ cls: "vf-mode-item-label", text: label });
      if (mode === this.mode) (0, import_obsidian7.setIcon)(item.createSpan("vf-mode-item-check"), "check");
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
    (0, import_obsidian7.setIcon)(this.modeButton.createSpan("vf-mode-button-icon"), MODES[mode].icon);
    this.modeButton.createSpan({ cls: "vf-mode-button-label", text: MODES[mode].label });
    (0, import_obsidian7.setIcon)(this.modeButton.createSpan("vf-mode-button-chevron"), "chevron-down");
    this.modalEl.toggleClass("vf-modal-wide", mode === "typing" || mode === "typingPro" || mode === "check" || mode === "quizPro" || mode === "shooter" || mode === "match");
    this.modalEl.toggleClass("vf-modal-quiz", mode === "quiz");
    this.autoSpeakEl.toggle(AUTO_SPEAK_MODES.includes(mode));
    this.shortcutsEl.empty();
    for (const [key, label] of SHORTCUTS[mode]) {
      const item = this.shortcutsEl.createSpan("vf-shortcut");
      item.createEl("kbd", { text: key });
      item.appendText(label);
    }
  }
  renderAutoSpeak() {
    const btn = this.autoSpeakEl;
    btn.empty();
    btn.toggleClass("is-on", this.autoSpeak);
    btn.setAttr("aria-pressed", String(this.autoSpeak));
    btn.setAttr("aria-label", this.autoSpeak ? "\u0110ang t\u1EF1 \u0111\u1ECDc t\u1EEB, b\u1EA5m \u0111\u1EC3 t\u1EAFt" : "B\u1EA5m \u0111\u1EC3 t\u1EF1 \u0111\u1ECDc t\u1EEB");
    (0, import_obsidian7.setIcon)(btn.createSpan("vf-autospeak-icon"), this.autoSpeak ? "volume-2" : "volume-x");
    btn.createSpan({ cls: "vf-autospeak-label", text: "T\u1EF1 \u0111\u1ECDc" });
    btn.createSpan("vf-autospeak-switch");
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
    this.tracker.end();
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
        if (correct && this.autoSpeak) speak(q.card.word);
        if (!correct) {
          buttons[i].addClass("is-wrong");
          wrong.push(q.card);
        }
        buttons.forEach((b) => b.disabled = true);
        const contentEl = revealEl.createDiv("vf-reveal-content");
        this.renderImage(q.card, contentEl.createDiv("vf-reveal-media"));
        const textEl = contentEl.createDiv("vf-reveal-text");
        if (!q.askWord) {
          this.renderSpeaker(promptEl, q.card.word);
          const headEl = textEl.createDiv("vf-reveal-head");
          headEl.createDiv({ cls: "vf-word", text: q.card.word });
          this.renderPronunciation(headEl, q.card);
        }
        this.renderBody(q.card, textEl);
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
        if (correct && this.autoSpeak) speak(q.card.word);
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
  // ---------- Bắn chữ ----------
  startShooter(cards) {
    var _a;
    this.keyHandler = null;
    (_a = this.session) == null ? void 0 : _a.destroy();
    const game = new ShooterGame(
      this.bodyEl,
      cards,
      (total, missed) => {
        this.session = null;
        this.showResults(total, missed, "shooter", () => this.startShooter(missed), "Ch\u01A1i l\u1EA1i t\u1EEB b\u1ECB l\u1ECDt");
      },
      (card) => this.autoSpeak && speak(card.word),
      (card) => this.imageUrl(card),
      {
        lives: this.app.loadLocalStorage(SHOOTER_KEYS.lives) !== false,
        showWord: this.app.loadLocalStorage(SHOOTER_KEYS.showWord) !== false,
        save: (key, on) => this.app.saveLocalStorage(SHOOTER_KEYS[key], on)
      }
    );
    this.session = game;
    game.start();
  }
  // ---------- Ghép thẻ ----------
  startMatch(cards) {
    var _a;
    this.keyHandler = null;
    (_a = this.session) == null ? void 0 : _a.destroy();
    const game = new MatchGame(
      this.bodyEl,
      cards,
      (total, wrong) => {
        this.session = null;
        this.showResults(total, wrong, "match", () => this.startMatch(wrong), "Gh\xE9p l\u1EA1i t\u1EEB sai");
      },
      // Ghép đúng thì đọc từ tiếng Anh của cặp đó
      (card) => speak(card.word)
    );
    this.session = game;
    game.start();
  }
  // ---------- Kết quả (trắc nghiệm / kiểm tra) ----------
  showResults(total, wrong, mode, retryWrong, retryWrongLabel) {
    this.tracker.end();
    this.keyHandler = null;
    this.bodyEl.empty();
    const score = total - wrong.length;
    const done = this.bodyEl.createDiv("vf-done vf-enter");
    done.createDiv({ cls: "vf-done-title", text: `${score} / ${total}` });
    const actions = done.createDiv("vf-done-actions");
    actions.createEl("button", { text: "L\xE0m l\u1EA1i t\u1EA5t c\u1EA3", cls: wrong.length ? "" : "mod-cta" }).onclick = () => this.switchMode(mode);
    if (wrong.length) {
      actions.createEl("button", { text: retryWrongLabel, cls: "mod-cta" }).onclick = () => {
        this.tracker.begin(mode);
        retryWrong();
      };
      const list = done.createDiv("vf-wrong-list");
      for (const c of wrong) this.renderNoteCard(c, list);
    }
  }
  // ---------- Chung ----------
  renderSpeaker(parent, word) {
    const btn = parent.createEl("button", { cls: "vf-speak clickable-icon", attr: { "aria-label": "Ph\xE1t \xE2m (S)" } });
    (0, import_obsidian7.setIcon)(btn, "volume-2");
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
    const src = this.imageUrl(card);
    if (src) el.createEl("img", { cls: "vf-image", attr: { src } });
  }
  /** Đường dẫn hiển thị được của ảnh trong thẻ (null nếu thẻ không có ảnh hoặc không tìm thấy file) */
  imageUrl(card) {
    if (!card.image) return null;
    const file = this.app.metadataCache.getFirstLinkpathDest(card.image, card.sourcePath);
    return file ? this.app.vault.getResourcePath(file) : null;
  }
  renderBody(card, el) {
    if (!card.body) return;
    import_obsidian7.MarkdownRenderer.render(this.app, card.body, el.createDiv("vf-markdown"), card.sourcePath, this.renderer);
  }
};
var POS_SHORT = { noun: "n", verb: "v", adjective: "adj", adverb: "adv", preposition: "prep" };
function shortPos(pos) {
  var _a;
  return pos ? (_a = POS_SHORT[pos]) != null ? _a : pos : void 0;
}

// src/stats-view.ts
var import_obsidian8 = require("obsidian");

// src/tracker.ts
var IDLE_PAUSE_MS = 6e4;
var SAVE_EVERY_MS = 3e4;
var TICK_MS = 1e3;
function dayKey(time) {
  const d = new Date(time);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dayMs(day) {
  return day ? Object.values(day.byMode).reduce((s, m) => {
    var _a;
    return s + ((_a = m == null ? void 0 : m.ms) != null ? _a : 0);
  }, 0) : 0;
}
function loadStudyData(raw) {
  var _a;
  const data = { version: 2, days: {} };
  const days = raw == null ? void 0 : raw.days;
  for (const [key, day] of Object.entries(days != null ? days : {})) {
    const byMode = {};
    for (const [mode, stat] of Object.entries((_a = day.byMode) != null ? _a : {})) {
      if (stat == null ? void 0 : stat.ms) byMode[mode] = { ms: stat.ms };
    }
    if (Object.keys(byMode).length) data.days[key] = { byMode };
  }
  return data;
}
function yearOf(key) {
  return key.slice(0, 4);
}
function splitByYear(data, only) {
  const years = /* @__PURE__ */ new Map();
  for (const [key, day] of Object.entries(data.days)) {
    const year = yearOf(key);
    if (only && !only.has(year)) continue;
    if (!years.has(year)) years.set(year, { version: 2, days: {} });
    years.get(year).days[key] = day;
  }
  for (const year of only != null ? only : []) if (!years.has(year)) years.set(year, { version: 2, days: {} });
  return years;
}
var StudyTracker = class {
  constructor(data, persist, now = () => Date.now(), autoTick = true) {
    this.data = data;
    this.persist = persist;
    this.now = now;
    this.autoTick = autoTick;
    this.current = null;
    this.timer = null;
    this.lastSave = 0;
    this.listeners = /* @__PURE__ */ new Set();
    /** Các năm có thay đổi chưa ghi; chỉ những file năm này được ghi lại */
    this.dirtyYears = /* @__PURE__ */ new Set();
  }
  get mode() {
    var _a, _b;
    return (_b = (_a = this.current) == null ? void 0 : _a.mode) != null ? _b : null;
  }
  /** Đang đo nhưng quá 60s chưa thao tác */
  get paused() {
    const cur = this.current;
    return !!cur && this.now() - cur.lastActivity >= IDLE_PAUSE_MS;
  }
  begin(mode) {
    this.end();
    const t = this.now();
    this.current = { mode, countedUntil: t, lastActivity: t };
    this.lastSave = t;
    if (this.autoTick) this.timer = setInterval(() => this.tick(), TICK_MS);
  }
  /** Gọi mỗi lần bấm phím / click trong modal */
  activity() {
    const cur = this.current;
    if (!cur) return;
    const t = this.now();
    this.count(t);
    cur.countedUntil = Math.max(cur.countedUntil, t);
    cur.lastActivity = t;
  }
  /** Cộng dồn tới hiện tại (đồng hồ gọi mỗi giây) và lưu định kỳ */
  tick() {
    if (!this.current) return;
    const t = this.now();
    this.count(t);
    if (t - this.lastSave >= SAVE_EVERY_MS) this.save();
  }
  /** Học xong / đổi chế độ / đóng modal: chốt thời gian và lưu */
  end() {
    if (!this.current) return;
    this.count(this.now());
    this.current = null;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.save();
  }
  /** Cộng khoảng [countedUntil, t] nhưng không quá mốc tạm dừng; học qua nửa đêm thì chia đúng 2 ngày */
  count(t) {
    var _a, _b, _c, _d, _e;
    const cur = this.current;
    const until = Math.min(t, cur.lastActivity + IDLE_PAUSE_MS);
    let from = cur.countedUntil;
    if (until <= from) return;
    while (from < until) {
      const d = new Date(from);
      const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      const to = Math.min(until, nextDay);
      const key = dayKey(from);
      const day = (_b = (_a = this.data.days)[key]) != null ? _b : _a[key] = { byMode: {} };
      ((_e = (_c = day.byMode)[_d = cur.mode]) != null ? _e : _c[_d] = { ms: 0 }).ms += to - from;
      this.dirtyYears.add(yearOf(key));
      from = to;
    }
    cur.countedUntil = until;
  }
  save() {
    this.lastSave = this.now();
    this.listeners.forEach((cb) => cb());
    if (!this.dirtyYears.size) return;
    const years = splitByYear(this.data, this.dirtyYears);
    this.dirtyYears = /* @__PURE__ */ new Set();
    void this.persist(years);
  }
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
};

// src/stats-view.ts
var STATS_VIEW_TYPE = "vocab-stats";
var DAY_MS = 864e5;
var VOCAB_CARD_RE = /^>[ \t]*\[!vocab\]/gim;
var WEEKS = 53;
var WEEKDAYS = ["CN", "Th\u1EE9 2", "Th\u1EE9 3", "Th\u1EE9 4", "Th\u1EE9 5", "Th\u1EE9 6", "Th\u1EE9 7"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var RANGES = [
  { label: "7 ng\xE0y", days: 7 },
  { label: "30 ng\xE0y", days: 30 },
  { label: "N\u0103m nay", days: 0 }
];
var StatsView = class extends import_obsidian8.ItemView {
  constructor(leaf, tracker) {
    super(leaf);
    this.tracker = tracker;
    /** Mặc định mở ở "7 ngày" */
    this.rangeIndex = 0;
    /** Năm đang xem trên heatmap; null = "Gần đây" (53 tuần tính tới hôm nay) */
    this.year = null;
    /** Bấm ra ngoài thì đóng menu chọn năm */
    this.closeYearMenu = null;
    this.unsubscribe = null;
    /** Tổng số thẻ từ vựng trong vault; null khi đang đếm */
    this.vocabCount = null;
    this.recount = (0, import_obsidian8.debounce)(() => this.countVocab(), 2e3, true);
  }
  getViewType() {
    return STATS_VIEW_TYPE;
  }
  getDisplayText() {
    return "Ho\u1EA1t \u0111\u1ED9ng h\u1ECDc t\u1EADp";
  }
  getIcon() {
    return PROGRESSION_ICON;
  }
  async onOpen() {
    this.unsubscribe = this.tracker.onChange(() => this.render());
    for (const evt of ["modify", "create", "delete", "rename"]) {
      this.registerEvent(this.app.vault.on(evt, () => this.recount()));
    }
    this.render();
    void this.countVocab();
  }
  /** Đếm mọi thẻ `> [!vocab]` trong vault (cả thẻ chưa điền nghĩa), đúng theo định dạng thẻ đã định nghĩa */
  async countVocab() {
    var _a, _b;
    let count = 0;
    for (const file of this.app.vault.getMarkdownFiles()) {
      count += (_b = (_a = (await this.app.vault.cachedRead(file)).match(VOCAB_CARD_RE)) == null ? void 0 : _a.length) != null ? _b : 0;
    }
    this.vocabCount = count;
    this.render();
  }
  async onClose() {
    var _a, _b;
    (_a = this.unsubscribe) == null ? void 0 : _a.call(this);
    (_b = this.closeYearMenu) == null ? void 0 : _b.call(this);
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("vf-stats");
    this.renderHeatmap(root.createDiv("vf-stats-card"));
    const row = root.createDiv("vf-stats-row");
    this.renderSummary(row.createDiv("vf-stats-summary"));
    this.renderModeShare(row.createDiv("vf-stats-card vf-stats-share"));
    this.renderModeTime(root.createDiv("vf-stats-card"));
  }
  // ---------- Heatmap ----------
  renderHeatmap(card) {
    const { days } = this.tracker.data;
    const head = card.createDiv("vf-stats-head");
    head.createDiv({ cls: "vf-stats-title", text: "Ho\u1EA1t \u0111\u1ED9ng h\u1ECDc t\u1EADp" });
    const thisYear = (/* @__PURE__ */ new Date()).getFullYear();
    const years = [.../* @__PURE__ */ new Set([thisYear, ...Object.keys(days).map((k) => Number(k.slice(0, 4)))])].sort((a, b) => b - a);
    this.renderYearPicker(head, [null, ...years]);
    const today = startOfDay(Date.now());
    let start;
    let first;
    let last;
    if (this.year === null) {
      start = addDays(today, -(7 * (WEEKS - 1) + new Date(today).getDay()));
      first = start;
      last = today;
    } else {
      first = new Date(this.year, 0, 1).getTime();
      last = new Date(this.year, 11, 31).getTime();
      start = addDays(first, -new Date(first).getDay());
    }
    const weeks = Math.floor(daysBetween(start, last) / 7) + 1;
    const wrap = card.createDiv("vf-heatmap");
    const months = wrap.createDiv("vf-heatmap-months");
    const body = wrap.createDiv("vf-heatmap-body");
    const labels = body.createDiv("vf-heatmap-weekdays");
    ["", "Mon", "", "Wed", "", "Fri", ""].forEach((t) => labels.createDiv({ text: t }));
    const grid = body.createDiv("vf-heatmap-grid");
    for (const el of [months, grid]) el.style.gridTemplateColumns = `repeat(${weeks}, minmax(0, 1fr))`;
    let lastMonth = -1;
    let lastLabelCol = -10;
    for (let w = 0; w < weeks; w++) {
      const col = grid.createDiv("vf-heatmap-col");
      const weekStart = addDays(start, w * 7);
      const month = new Date(Math.max(weekStart, first)).getMonth();
      const label = months.createDiv("vf-heatmap-month");
      if (month !== lastMonth && w - lastLabelCol >= 3) {
        label.setText(MONTHS[month]);
        lastLabelCol = w;
      }
      lastMonth = month;
      for (let d = 0; d < 7; d++) {
        const time = addDays(weekStart, d);
        const cell = col.createDiv("vf-heatmap-cell");
        if (time > today || time < first || time > last) {
          cell.addClass("is-future");
          continue;
        }
        const ms = dayMs(days[dayKey(time)]);
        cell.dataset.level = String(level(ms));
        const date = new Date(time);
        cell.dataset.tip = `${ms ? formatDuration(ms) : "Kh\xF4ng h\u1ECDc"} \xB7 ${WEEKDAYS[date.getDay()]}, ${date.toLocaleDateString("vi-VN")}`;
      }
    }
    const tip = wrap.createDiv("vf-heatmap-tip");
    grid.addEventListener("mouseover", (evt) => {
      const cell = evt.target.closest(".vf-heatmap-cell[data-tip]");
      if (!cell) return;
      tip.setText(cell.dataset.tip);
      tip.addClass("is-visible");
      const box = wrap.getBoundingClientRect();
      const rect = cell.getBoundingClientRect();
      const half = tip.offsetWidth / 2;
      const center = rect.left - box.left + rect.width / 2;
      const left = Math.min(Math.max(center, half), box.width - half);
      tip.style.left = `${left}px`;
      tip.style.top = `${rect.top - box.top - 8}px`;
      tip.style.setProperty("--vf-tip-arrow", `${center - left}px`);
    });
    grid.addEventListener("mouseleave", () => tip.removeClass("is-visible"));
    const legend = card.createDiv("vf-heatmap-legend");
    legend.createSpan({ text: "\xCDt" });
    for (let i = 0; i <= 4; i++) legend.createDiv({ cls: "vf-heatmap-cell", attr: { "data-level": String(i) } });
    legend.createSpan({ text: "Nhi\u1EC1u" });
  }
  /** Dropdown chọn năm, cùng kiểu với menu chọn chế độ trong modal */
  renderYearPicker(parent, options) {
    const label = (y) => y === null ? "G\u1EA7n \u0111\xE2y" : String(y);
    const picker = parent.createDiv("vf-mode-picker vf-year-picker");
    const button = picker.createEl("button", { cls: "vf-mode-button" });
    (0, import_obsidian8.setIcon)(button.createSpan("vf-mode-button-icon"), "calendar");
    button.createSpan({ cls: "vf-mode-button-label", text: label(this.year) });
    (0, import_obsidian8.setIcon)(button.createSpan("vf-mode-button-chevron"), "chevron-down");
    let menu = null;
    const close = () => {
      if (!menu) return;
      const el = menu;
      menu = null;
      button.removeClass("is-open");
      document.removeEventListener("mousedown", onOutside, true);
      this.closeYearMenu = null;
      el.addClass("is-closing");
      window.setTimeout(() => el.remove(), 120);
    };
    const onOutside = (evt) => {
      if (!picker.contains(evt.target)) close();
    };
    button.onclick = () => {
      if (menu) return close();
      menu = picker.createDiv("vf-mode-menu");
      button.addClass("is-open");
      for (const year of options) {
        const item = menu.createDiv("vf-mode-item");
        item.toggleClass("is-active", year === this.year);
        (0, import_obsidian8.setIcon)(item.createSpan("vf-mode-item-icon"), year === null ? "history" : "calendar");
        item.createSpan({ cls: "vf-mode-item-label", text: label(year) });
        if (year === this.year) (0, import_obsidian8.setIcon)(item.createSpan("vf-mode-item-check"), "check");
        item.onclick = () => {
          close();
          if (year === this.year) return;
          this.year = year;
          this.render();
        };
      }
      document.addEventListener("mousedown", onOutside, true);
      this.closeYearMenu = close;
    };
  }
  // ---------- Tóm tắt ----------
  renderSummary(el) {
    const { days } = this.tracker.data;
    const items = [
      [`${currentStreak(days)} ng\xE0y`, "Chu\u1ED7i hi\u1EC7n t\u1EA1i"],
      [`${longestStreak(days)} ng\xE0y`, "Chu\u1ED7i d\xE0i nh\u1EA5t"],
      [this.vocabCount === null ? "\u2026" : this.vocabCount.toLocaleString("vi-VN"), "Th\u1EBB t\u1EEB v\u1EF1ng"],
      // Tổng của toàn bộ dữ liệu (mọi năm), không đổi theo năm đang chọn
      [formatDuration(Object.values(days).reduce((s, d) => s + dayMs(d), 0)), "T\u1ED5ng th\u1EDDi gian h\u1ECDc"]
    ];
    for (const [value, label] of items) {
      const box = el.createDiv("vf-stats-box");
      box.createDiv({ cls: "vf-stats-box-value", text: value });
      box.createDiv({ cls: "vf-stats-box-label", text: label });
    }
  }
  // ---------- Tỉ lệ thời gian giữa các chế độ: biểu đồ tròn ----------
  /** Dựa trên toàn bộ dữ liệu (mọi năm), không phụ thuộc năm đang chọn */
  renderModeShare(card) {
    var _a;
    card.createDiv("vf-stats-head").createDiv({ cls: "vf-stats-title", text: "T\u1EC9 l\u1EC7 theo ch\u1EBF \u0111\u1ED9" });
    const modes = Object.keys(MODES);
    const totals = new Map(modes.map((m) => [m, 0]));
    for (const day of Object.values(this.tracker.data.days)) {
      for (const [m, s] of Object.entries(day.byMode)) totals.set(m, ((_a = totals.get(m)) != null ? _a : 0) + s.ms);
    }
    const sum = [...totals.values()].reduce((a, b) => a + b, 0);
    if (!sum) {
      card.createDiv({ cls: "vf-stats-empty", text: "Ch\u01B0a c\xF3 th\u1EDDi gian h\u1ECDc." });
      return;
    }
    const body = card.createDiv("vf-share-body");
    const chart = body.createDiv("vf-share-chart");
    const SVG = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    chart.appendChild(svg);
    const tip = chart.createDiv("vf-share-tip");
    const cx = 100;
    const cy = 100;
    const r = 96;
    const point = (angle2) => `${cx + r * Math.cos(angle2)} ${cy + r * Math.sin(angle2)}`;
    const used = modes.filter((m) => totals.get(m));
    let angle = -Math.PI / 2;
    for (const mode of used) {
      const share = totals.get(mode) / sum;
      const end = angle + share * 2 * Math.PI;
      const slice = used.length === 1 ? document.createElementNS(SVG, "circle") : document.createElementNS(SVG, "path");
      if (used.length === 1) {
        slice.setAttribute("cx", String(cx));
        slice.setAttribute("cy", String(cy));
        slice.setAttribute("r", String(r));
      } else {
        const large = end - angle > Math.PI ? 1 : 0;
        slice.setAttribute("d", `M ${cx} ${cy} L ${point(angle)} A ${r} ${r} 0 ${large} 1 ${point(end)} Z`);
      }
      slice.setAttribute("class", "vf-share-slice");
      slice.setAttribute("data-mode", mode);
      const pct = share * 100;
      const text = `${MODES[mode].label} \xB7 ${pct < 1 ? "<1" : Math.round(pct)}%`;
      slice.addEventListener("mousemove", (evt) => {
        const box = chart.getBoundingClientRect();
        tip.setText(text);
        tip.style.left = `${evt.clientX - box.left}px`;
        tip.style.top = `${evt.clientY - box.top - 10}px`;
        tip.addClass("is-visible");
      });
      slice.addEventListener("mouseleave", () => tip.removeClass("is-visible"));
      svg.appendChild(slice);
      angle = end;
    }
    const legend = body.createDiv("vf-share-legend");
    for (const mode of modes) {
      const row = legend.createDiv("vf-share-row");
      row.toggleClass("is-empty", !totals.get(mode));
      row.createSpan({ cls: "vf-chart-swatch", attr: { "data-mode": mode } });
      row.createSpan({ cls: "vf-share-name", text: MODES[mode].label });
    }
  }
  // ---------- Thời gian theo chế độ: biểu đồ cột chồng ----------
  /** Mỗi cột là 1 ngày (7/30 ngày) hoặc 1 tháng (năm nay); các đoạn trong cột là thời gian từng chế độ */
  renderModeTime(card) {
    var _a, _b;
    const head = card.createDiv("vf-stats-head");
    head.createDiv({ cls: "vf-stats-title", text: "Th\u1EDDi gian theo ch\u1EBF \u0111\u1ED9" });
    const tabs = head.createDiv("vf-stats-tabs");
    RANGES.forEach((range, i) => {
      const label = !range.days && this.year && this.year !== (/* @__PURE__ */ new Date()).getFullYear() ? `N\u0103m ${this.year}` : range.label;
      const btn = tabs.createEl("button", { text: label });
      btn.toggleClass("is-active", i === this.rangeIndex);
      btn.onclick = () => {
        this.rangeIndex = i;
        this.render();
      };
    });
    const modes = Object.keys(MODES);
    const buckets = buildBuckets(
      this.tracker.data.days,
      RANGES[this.rangeIndex].days,
      (_a = this.year) != null ? _a : (/* @__PURE__ */ new Date()).getFullYear()
    );
    const totals = new Map(modes.map((m) => [m, 0]));
    for (const b of buckets) for (const m of modes) totals.set(m, totals.get(m) + ((_b = b.ms[m]) != null ? _b : 0));
    const maxMs = Math.max(0, ...buckets.map((b) => b.total));
    if (!maxMs) {
      card.createDiv({ cls: "vf-stats-empty", text: "Ch\u01B0a c\xF3 th\u1EDDi gian h\u1ECDc trong kho\u1EA3ng n\xE0y." });
      return;
    }
    const { step, top } = niceScale(maxMs);
    const chart = card.createDiv("vf-chart");
    const yAxis = chart.createDiv("vf-chart-yaxis");
    const plot = chart.createDiv("vf-chart-plot");
    for (let v = 0; v <= top; v += step) {
      const pct = v / top * 100;
      plot.createDiv("vf-chart-grid").style.bottom = `${pct}%`;
      const label = yAxis.createDiv({ cls: "vf-chart-ylabel", text: formatShort(v) });
      label.style.bottom = `${pct}%`;
    }
    const cols = plot.createDiv("vf-chart-cols");
    const tooltip = plot.createDiv("vf-chart-tooltip");
    const xAxis = chart.createDiv("vf-chart-xaxis");
    const labelEvery = buckets.length > 12 ? 5 : 1;
    buckets.forEach((b, i) => {
      var _a2;
      const col = cols.createDiv("vf-chart-col");
      const stack = col.createDiv("vf-chart-stack");
      stack.style.height = `${b.total / top * 100}%`;
      for (const m of modes) {
        const ms = (_a2 = b.ms[m]) != null ? _a2 : 0;
        if (!ms) continue;
        const seg = stack.createDiv({ cls: "vf-chart-seg", attr: { "data-mode": m } });
        seg.style.flexGrow = String(ms);
      }
      const x = xAxis.createDiv("vf-chart-xlabel");
      if (i % labelEvery === 0 || i === buckets.length - 1) x.setText(b.short);
      col.onmouseenter = () => {
        var _a3;
        tooltip.empty();
        tooltip.createDiv({ cls: "vf-chart-tooltip-title", text: b.long });
        for (const m of modes) {
          const ms = (_a3 = b.ms[m]) != null ? _a3 : 0;
          if (!ms) continue;
          const row = tooltip.createDiv("vf-chart-tooltip-row");
          row.createSpan({ cls: "vf-chart-swatch", attr: { "data-mode": m } });
          row.createSpan({ text: MODES[m].label });
          row.createSpan({ cls: "vf-chart-tooltip-value", text: formatPrecise(ms) });
        }
        const total = tooltip.createDiv("vf-chart-tooltip-row vf-chart-tooltip-total");
        total.createSpan({ text: "T\u1ED5ng" });
        total.createSpan({ cls: "vf-chart-tooltip-value", text: b.total ? formatPrecise(b.total) : "Kh\xF4ng h\u1ECDc" });
        const center = (i + 0.5) / buckets.length * 100;
        tooltip.style.left = center > 50 ? "" : `calc(${center}% + 14px)`;
        tooltip.style.right = center > 50 ? `calc(${100 - center}% + 14px)` : "";
        tooltip.addClass("is-visible");
      };
      col.onmouseleave = () => tooltip.removeClass("is-visible");
    });
    const legend = card.createDiv("vf-chart-legend");
    for (const m of modes) {
      const ms = totals.get(m);
      const item = legend.createDiv("vf-chart-legend-item");
      item.toggleClass("is-empty", !ms);
      item.createSpan({ cls: "vf-chart-swatch", attr: { "data-mode": m } });
      item.createSpan({ cls: "vf-chart-legend-label", text: MODES[m].label });
      item.createSpan({ cls: "vf-chart-legend-value", text: formatPrecise(ms) });
    }
  }
};
function buildBuckets(data, days, year) {
  const buckets = [];
  const add = (bucket, stat) => {
    var _a;
    if (!stat) return;
    for (const [m, s] of Object.entries(stat.byMode)) {
      bucket.ms[m] = ((_a = bucket.ms[m]) != null ? _a : 0) + s.ms;
      bucket.total += s.ms;
    }
  };
  const today = startOfDay(Date.now());
  if (days) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(addDays(today, -i));
      const bucket = {
        short: `${d.getDate()}/${d.getMonth() + 1}`,
        long: `${WEEKDAYS[d.getDay()]}, ${d.toLocaleDateString("vi-VN")}`,
        total: 0,
        ms: {}
      };
      add(bucket, data[dayKey(d.getTime())]);
      buckets.push(bucket);
    }
    return buckets;
  }
  const now = new Date(today);
  const lastMonth = year === now.getFullYear() ? now.getMonth() : 11;
  for (let month = 0; month <= lastMonth; month++) {
    buckets.push({ short: `Th${month + 1}`, long: `Th\xE1ng ${month + 1}/${year}`, total: 0, ms: {} });
  }
  for (const [key, stat] of Object.entries(data)) {
    const [y, m] = key.split("-").map(Number);
    if (y === year && buckets[m - 1]) add(buckets[m - 1], stat);
  }
  return buckets;
}
function niceScale(maxMs) {
  var _a;
  const steps = [5, 10, 15, 30, 60, 120, 180, 300, 600, 1200, 1800, 3e3, 6e3].map((m) => m * 6e4);
  const step = (_a = steps.find((s) => maxMs / s <= 4)) != null ? _a : steps[steps.length - 1];
  return { step, top: Math.ceil(maxMs / step) * step };
}
function formatShort(ms) {
  const minutes = Math.round(ms / 6e4);
  if (!minutes) return "0";
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m}` : `${h}h`;
}
var FULL_DAY_MS = 20 * 6e4;
function level(ms) {
  if (ms <= 0) return 0;
  if (ms >= FULL_DAY_MS) return 4;
  return 1 + Math.floor(ms / FULL_DAY_MS * 3);
}
function addDays(time, days) {
  const d = new Date(time);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}
function daysBetween(from, to) {
  return Math.round((to - from) / DAY_MS);
}
function startOfDay(time) {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function studied(days, time) {
  return dayMs(days[dayKey(time)]) > 0;
}
function currentStreak(days) {
  let t = startOfDay(Date.now());
  if (!studied(days, t)) t = addDays(t, -1);
  let streak = 0;
  while (studied(days, t)) {
    streak++;
    t = addDays(t, -1);
  }
  return streak;
}
function longestStreak(days) {
  const keys = Object.keys(days).filter((k) => dayMs(days[k]) > 0).sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const key of keys) {
    run = prev && dayKey(addDays((/* @__PURE__ */ new Date(`${prev}T00:00:00`)).getTime(), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}
function formatPrecise(ms) {
  const total = Math.round(ms / 1e3);
  if (ms > 0 && total === 0) return "<1s";
  if (total < 60) return `${total}s`;
  if (total < 3600) {
    const m2 = Math.floor(total / 60);
    const s = total % 60;
    return s ? `${m2}p${s}s` : `${m2}p`;
  }
  const h = Math.floor(total / 3600);
  const m = Math.floor(total % 3600 / 60);
  return m ? `${h}h${m}p` : `${h}h`;
}
function formatDuration(ms) {
  const minutes = Math.round(ms / 6e4);
  if (ms > 0 && minutes < 1) return "<1 ph\xFAt";
  if (minutes < 60) return `${minutes} ph\xFAt`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} gi\u1EDD ${m} ph\xFAt` : `${h} gi\u1EDD`;
}

// src/storage.ts
var import_obsidian9 = require("obsidian");
var YEAR_FILE = /^(\d{4})\.json$/;
var StudyStorage = class {
  constructor(adapter, pluginDir) {
    this.adapter = adapter;
    this.pluginDir = pluginDir;
    /** Ghi tuần tự để 2 lần lưu sát nhau không ghi đè lẫn nhau */
    this.queue = Promise.resolve();
  }
  get dir() {
    return `${this.pluginDir}/data`;
  }
  async loadAll() {
    const merged = { version: 2, days: {} };
    if (await this.adapter.exists(this.dir)) {
      const names = (await this.adapter.list(this.dir)).files.map((p) => p.split("/").pop());
      const years = new Set(names.map((n) => {
        var _a;
        return (_a = n.replace(/\.tmp$/, "").match(YEAR_FILE)) == null ? void 0 : _a[1];
      }).filter(Boolean));
      for (const year of years) {
        const data = await this.readYear(year, names);
        if (data) Object.assign(merged.days, data.days);
      }
    }
    await this.migrateLegacy(merged);
    return merged;
  }
  /**
   * Đọc một năm. Còn bản .tmp nghĩa là lần ghi trước bị ngắt giữa chừng; .tmp luôn được ghi xong
   * trước khi đụng tới file chính nên nó là bản mới nhất → ưu tiên .tmp, hỏng thì mới dùng file chính.
   * File không đọc được thì đổi tên thành .broken-<thời điểm> để lần lưu sau không ghi đè mất.
   */
  async readYear(year, names) {
    const candidates = [`${year}.json.tmp`, `${year}.json`].filter((n) => names.includes(n));
    let data = null;
    for (const name of candidates) {
      const path = `${this.dir}/${name}`;
      try {
        data = loadStudyData(JSON.parse(await this.adapter.read(path)));
        break;
      } catch (err) {
        const backup = `${path}.broken-${Date.now()}`;
        console.error(`[vocab-flashcard] Kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c data/${name}, gi\u1EEF l\u1EA1i \u1EDF ${backup}`, err);
        new import_obsidian9.Notice(`Vocab Flashcard: data/${name} b\u1ECB h\u1ECFng, \u0111\xE3 gi\u1EEF l\u1EA1i b\u1EA3n sao ${backup.split("/").pop()}.`);
        await this.adapter.rename(path, backup);
      }
    }
    return data;
  }
  /**
   * data.json cũ (một file cho tất cả) → gộp vào các file năm rồi xoá.
   * Ngày có ở cả hai nơi thì lấy số phút lớn hơn của từng chế độ, để không bị cộng trùng.
   */
  async migrateLegacy(merged) {
    var _a, _b, _c, _d;
    const legacy = `${this.pluginDir}/data.json`;
    if (!await this.adapter.exists(legacy)) return;
    let old;
    try {
      old = loadStudyData(JSON.parse(await this.adapter.read(legacy)));
    } catch (err) {
      console.error("[vocab-flashcard] data.json c\u0169 b\u1ECB h\u1ECFng, gi\u1EEF nguy\xEAn file", err);
      return;
    }
    const touched = /* @__PURE__ */ new Set();
    for (const [key, day] of Object.entries(old.days)) {
      const target = (_b = (_a = merged.days)[key]) != null ? _b : _a[key] = { byMode: {} };
      for (const [mode, stat] of Object.entries(day.byMode)) {
        const cur = (_d = (_c = target.byMode[mode]) == null ? void 0 : _c.ms) != null ? _d : 0;
        if (stat.ms > cur) target.byMode[mode] = { ms: stat.ms };
      }
      touched.add(yearOf(key));
    }
    await this.saveYears(splitByYear(merged, touched));
    await this.adapter.remove(legacy);
  }
  saveYears(years) {
    this.queue = this.queue.then(() => this.writeYears(years)).catch((err) => {
      console.error("[vocab-flashcard] L\u01B0u th\u1EDDi gian h\u1ECDc th\u1EA5t b\u1EA1i", err);
    });
    return this.queue;
  }
  /** Ghi ra file tạm rồi đổi tên đè lên file chính, để tắt máy giữa chừng không làm hỏng file */
  async writeYears(years) {
    if (!await this.adapter.exists(this.dir)) await this.adapter.mkdir(this.dir);
    for (const [year, data] of years) {
      const file = `${this.dir}/${year}.json`;
      const tmp = `${file}.tmp`;
      await this.adapter.write(tmp, JSON.stringify(data));
      if (await this.adapter.exists(file)) await this.adapter.remove(file);
      await this.adapter.rename(tmp, file);
    }
  }
};

// src/main.ts
var VocabFlashcardPlugin = class extends import_obsidian10.Plugin {
  constructor() {
    super(...arguments);
    this.modal = null;
  }
  async onload() {
    const storage = new StudyStorage(this.app.vault.adapter, this.manifest.dir);
    try {
      this.tracker = new StudyTracker(await storage.loadAll(), (years) => storage.saveYears(years));
    } catch (err) {
      console.error("[vocab-flashcard] Kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u th\u1EDDi gian h\u1ECDc", err);
      new import_obsidian10.Notice("Vocab Flashcard: kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u th\u1EDDi gian h\u1ECDc, l\u1EA7n n\xE0y s\u1EBD kh\xF4ng l\u01B0u th\u1EDDi gian.");
      this.tracker = new StudyTracker({ version: 2, days: {} }, async () => {
      });
    }
    (0, import_obsidian10.addIcon)(PROGRESSION_ICON, PROGRESSION_SVG);
    this.registerView(STATS_VIEW_TYPE, (leaf) => new StatsView(leaf, this.tracker));
    this.addRibbonIcon(PROGRESSION_ICON, "Ho\u1EA1t \u0111\u1ED9ng h\u1ECDc t\u1EADp", () => this.openStats());
    this.addCommand({
      id: "open-study-stats",
      name: "Xem ho\u1EA1t \u0111\u1ED9ng h\u1ECDc t\u1EADp",
      callback: () => this.openStats()
    });
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
        else new import_obsidian10.Notice("H\xE3y m\u1EDF m\u1ED9t note tr\u01B0\u1EDBc.");
      }
    });
    registerEditorCommands(this);
    registerCardSpeaker(this);
    registerCardMeta(this);
  }
  studyActiveFile() {
    const file = this.app.workspace.getActiveFile();
    if (file) this.study(file);
    else new import_obsidian10.Notice("H\xE3y m\u1EDF m\u1ED9t note tr\u01B0\u1EDBc.");
  }
  async study(target) {
    const cards = await this.loadCards(target);
    if (cards.length === 0) {
      new import_obsidian10.Notice("Kh\xF4ng t\xECm th\u1EA5y t\u1EEB v\u1EF1ng n\xE0o (c\u1EA7n th\u1EBB > [!vocab] t\u1EEB, ho\u1EB7c kh\u1ED1i Multi-Column c\xF3 ## t\u1EEB).");
      return;
    }
    const folder = target instanceof import_obsidian10.TFolder ? target : target.parent;
    this.modal = new StudyModal(this.app, cards, this.tracker, {
      folder: folder && !folder.isRoot() ? folder.path : "",
      load: async (path) => {
        const found = path ? this.app.vault.getAbstractFileByPath(path) : this.app.vault.getRoot();
        return found instanceof import_obsidian10.TFolder ? this.loadCards(found) : null;
      }
    });
    this.modal.open();
  }
  async loadCards(target) {
    const cards = [];
    for (const file of collectMarkdownFiles(target)) {
      cards.push(...parseVocab(await this.app.vault.cachedRead(file), file.path));
    }
    return cards;
  }
  /** Mở tab "Hoạt động học tập" (đã mở rồi thì chuyển sang tab đó) */
  async openStats() {
    const existing = this.app.workspace.getLeavesOfType(STATS_VIEW_TYPE)[0];
    if (existing) {
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      await existing.loadIfDeferred();
      return;
    }
    await this.app.workspace.getLeaf("tab").setViewState({ type: STATS_VIEW_TYPE, active: true });
  }
  // Modal chặn Esc/bấm ra ngoài, nên khi tắt hoặc tải lại plugin phải tự đóng nó
  onunload() {
    var _a;
    (_a = this.modal) == null ? void 0 : _a.forceClose();
    this.modal = null;
  }
};
function collectMarkdownFiles(target) {
  if (target instanceof import_obsidian10.TFile) return target.extension === "md" ? [target] : [];
  if (target instanceof import_obsidian10.TFolder) return target.children.flatMap(collectMarkdownFiles);
  return [];
}
