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
  default: () => PaperNotebookPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/export-pdf.ts
var import_obsidian = require("obsidian");

// src/encode.ts
var XY_SCALE = 100;
var P_SCALE = 100;
function encodePoints(points) {
  const out = [];
  let px = 0;
  let py = 0;
  let pp = 0;
  for (const [x2, y2, p2] of points) {
    const qx = Math.round(x2 * XY_SCALE);
    const qy = Math.round(y2 * XY_SCALE);
    const qp = Math.round(p2 * P_SCALE);
    out.push(qx - px, qy - py, qp - pp);
    px = qx;
    py = qy;
    pp = qp;
  }
  return out.join(",");
}
function decodePoints(encoded) {
  if (!encoded) return [];
  const nums = encoded.split(",").map(Number);
  const points = [];
  let x2 = 0;
  let y2 = 0;
  let p2 = 0;
  for (let i2 = 0; i2 + 2 < nums.length; i2 += 3) {
    x2 += nums[i2];
    y2 += nums[i2 + 1];
    p2 += nums[i2 + 2];
    points.push([x2 / XY_SCALE, y2 / XY_SCALE, p2 / P_SCALE]);
  }
  return points;
}

// src/model.ts
var PAGE_W = 210;
var PAGE_H = 297;
var TEMPLATES = [
  { id: "blank", label: "Gi\u1EA5y tr\u1EAFng" },
  { id: "lined", label: "K\u1EBB ngang" },
  { id: "grid", label: "\xD4 vu\xF4ng" },
  { id: "dot", label: "Ch\u1EA5m" }
];
function newId() {
  return Math.random().toString(36).slice(2, 10);
}
function newPage(template) {
  return { id: newId(), template, elements: [] };
}
function newDoc(template) {
  return { version: 1, pages: [newPage(template)] };
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
var HISTORY_LIMIT = 200;
var NotebookStore = class {
  constructor(doc) {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
    this.doc = doc;
  }
  load(doc) {
    this.doc = doc;
    this.undoStack = [];
    this.redoStack = [];
  }
  onChange(listener) {
    this.listeners.push(listener);
  }
  page(pageId) {
    return this.doc.pages.find((p2) => p2.id === pageId);
  }
  pageIndex(pageId) {
    return this.doc.pages.findIndex((p2) => p2.id === pageId);
  }
  element(pageId, elementId) {
    var _a;
    return (_a = this.page(pageId)) == null ? void 0 : _a.elements.find((e2) => e2.id === elementId);
  }
  get canUndo() {
    return this.undoStack.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }
  /** Áp dụng một nhóm operation như một bước undo */
  commit(ops) {
    if (ops.length === 0) return;
    const change = { pages: /* @__PURE__ */ new Set(), structure: false };
    const inverse = this.applyAll(ops, change);
    this.undoStack.push({ ops, inverse });
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
    this.emit(change);
  }
  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;
    const change = { pages: /* @__PURE__ */ new Set(), structure: false };
    this.applyAll(entry.inverse, change);
    this.redoStack.push(entry);
    this.emit(change);
  }
  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return;
    const change = { pages: /* @__PURE__ */ new Set(), structure: false };
    entry.inverse = this.applyAll(entry.ops, change);
    this.undoStack.push(entry);
    this.emit(change);
  }
  applyAll(ops, change) {
    const inverse = [];
    for (const op of ops) {
      const inv = this.apply(op, change);
      if (inv) inverse.unshift(inv);
    }
    return inverse;
  }
  emit(change) {
    for (const l2 of this.listeners) l2(change);
  }
  /** Áp dụng một operation, trả về operation ngược lại để undo */
  apply(op, change) {
    var _a;
    const pages = this.doc.pages;
    switch (op.type) {
      case "addPage": {
        const index = Math.max(0, Math.min(op.index, pages.length));
        pages.splice(index, 0, clone(op.page));
        change.structure = true;
        return { type: "removePage", index };
      }
      case "removePage": {
        if (pages.length <= 1) return null;
        const [page] = pages.splice(op.index, 1);
        if (!page) return null;
        change.structure = true;
        return { type: "addPage", index: op.index, page };
      }
      case "movePage": {
        const [page] = pages.splice(op.from, 1);
        if (!page) return null;
        pages.splice(op.to, 0, page);
        change.structure = true;
        return { type: "movePage", from: op.to, to: op.from };
      }
      case "setTemplate": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const prev = page.template;
        page.template = op.template;
        change.pages.add(page.id);
        change.structure = true;
        return { type: "setTemplate", pageId: page.id, template: prev };
      }
      case "addElement": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const index = (_a = op.index) != null ? _a : page.elements.length;
        page.elements.splice(index, 0, clone(op.element));
        change.pages.add(page.id);
        return { type: "removeElement", pageId: page.id, elementId: op.element.id };
      }
      case "removeElement": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const index = page.elements.findIndex((e2) => e2.id === op.elementId);
        if (index < 0) return null;
        const [element] = page.elements.splice(index, 1);
        change.pages.add(page.id);
        return { type: "addElement", pageId: page.id, element, index };
      }
      case "updateElement": {
        const page = this.page(op.pageId);
        if (!page) return null;
        const index = page.elements.findIndex((e2) => e2.id === op.element.id);
        if (index < 0) return null;
        const prev = page.elements[index];
        page.elements[index] = clone(op.element);
        change.pages.add(page.id);
        return { type: "updateElement", pageId: page.id, element: prev };
      }
    }
  }
};

// src/format.ts
var DATA_HEADING = "## Notebook Data\n```json\n";
var FILES_HEADING = "## Files\n";
var FRONTMATTER_KEY = "notebook-plugin";
function isNotebookPath(path) {
  return path.toLowerCase().endsWith(".notebook.md");
}
function notebookTitle(basename) {
  return basename.replace(/\.notebook$/i, "");
}
function parseNotebook(text, defaultTemplate) {
  var _a;
  text = text.replace(/\r\n/g, "\n");
  let frontmatter = "";
  let body = text;
  const fm = /^---\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/.exec(text);
  if (fm) {
    frontmatter = (_a = fm[1]) != null ? _a : "";
    body = text.slice(fm[0].length);
  }
  const start = body.lastIndexOf(DATA_HEADING);
  if (start < 0) {
    if (body.trim() !== "" && body.trim() !== "%%") {
      throw new Error("Kh\xF4ng t\xECm th\u1EA5y ph\u1EA7n ## Notebook Data trong file.");
    }
    return { doc: newDoc(defaultTemplate), frontmatter };
  }
  const jsonStart = start + DATA_HEADING.length;
  const jsonEnd = body.indexOf("\n```", jsonStart);
  const raw = JSON.parse(body.slice(jsonStart, jsonEnd < 0 ? void 0 : jsonEnd));
  const doc = normalizeDoc(raw, defaultTemplate);
  const links = parseFileLinks(body.slice(0, start));
  for (const page of doc.pages) {
    for (const el2 of page.elements) {
      if (el2.type === "image" && links.has(el2.id)) el2.src = links.get(el2.id);
    }
  }
  return { doc, frontmatter };
}
function parseFileLinks(text) {
  const links = /* @__PURE__ */ new Map();
  const at = text.lastIndexOf(FILES_HEADING);
  if (at < 0) return links;
  const re2 = /^- ([\w-]+): !?\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/gm;
  const section = text.slice(at);
  let m2;
  while (m2 = re2.exec(section)) links.set(m2[1], m2[2].trim());
  return links;
}
function normalizeDoc(raw, defaultTemplate) {
  const templates = new Set(TEMPLATES.map((t2) => t2.id));
  const pages = [];
  for (const p2 of Array.isArray(raw == null ? void 0 : raw.pages) ? raw.pages : []) {
    const elements = [];
    for (const e2 of Array.isArray(p2 == null ? void 0 : p2.elements) ? p2.elements : []) {
      const el2 = normalizeElement(e2);
      if (el2) elements.push(el2);
    }
    pages.push({
      id: typeof (p2 == null ? void 0 : p2.id) === "string" ? p2.id : newId(),
      template: templates.has(p2 == null ? void 0 : p2.template) ? p2.template : defaultTemplate,
      elements
    });
  }
  if (pages.length === 0) return newDoc(defaultTemplate);
  return { version: 1, pages };
}
function num(v2, fallback) {
  return typeof v2 === "number" && isFinite(v2) ? v2 : fallback;
}
function normalizeElement(e2) {
  const id = typeof (e2 == null ? void 0 : e2.id) === "string" ? e2.id : newId();
  switch (e2 == null ? void 0 : e2.type) {
    case "stroke":
      return {
        id,
        type: "stroke",
        tool: e2.tool === "highlighter" ? "highlighter" : "pen",
        color: typeof e2.color === "string" ? e2.color : "#1a1a1a",
        size: num(e2.size, 0.6),
        realPressure: !!e2.realPressure,
        points: typeof e2.points === "string" ? decodePoints(e2.points) : []
      };
    case "text":
      return {
        id,
        type: "text",
        x: num(e2.x, 20),
        y: num(e2.y, 20),
        w: num(e2.w, PAGE_W - 40),
        fontSize: num(e2.fontSize, 11),
        color: typeof e2.color === "string" ? e2.color : "#1a1a1a",
        md: typeof e2.md === "string" ? e2.md : ""
      };
    case "image":
      if (typeof e2.src !== "string") return null;
      return { id, type: "image", x: num(e2.x, 20), y: num(e2.y, 20), w: num(e2.w, 80), h: num(e2.h, 60), src: e2.src };
  }
  return null;
}
function serializeNotebook(doc, frontmatter) {
  const fm = frontmatter.trim();
  const fmLines = fm ? fm.split("\n") : [];
  if (!fmLines.some((l2) => l2.startsWith(FRONTMATTER_KEY + ":"))) fmLines.unshift(`${FRONTMATTER_KEY}: 1`);
  const out = ["---", ...fmLines, "---", ""];
  const textParts = [];
  const fileLines = [];
  doc.pages.forEach((page, i2) => {
    const texts = page.elements.filter((e2) => e2.type === "text" && e2.md.trim() !== "");
    if (texts.length > 0) {
      textParts.push(`### Trang ${i2 + 1}`, "");
      for (const t2 of texts) if (t2.type === "text") textParts.push(t2.md.trim(), "");
    }
    for (const e2 of page.elements) if (e2.type === "image") fileLines.push(`- ${e2.id}: [[${e2.src}]]`);
  });
  out.push("## Text", "");
  if (textParts.length > 0) out.push(...textParts);
  if (fileLines.length > 0) out.push(FILES_HEADING.trim(), ...fileLines, "");
  const data = {
    version: 1,
    pages: doc.pages.map((p2) => ({
      id: p2.id,
      template: p2.template,
      elements: p2.elements.map((e2) => e2.type === "stroke" ? { ...e2, points: encodePoints(e2.points) } : e2)
    }))
  };
  out.push("%%", DATA_HEADING + JSON.stringify(data), "```", "%%", "");
  return out.join("\n");
}

// node_modules/perfect-freehand/dist/esm/index.mjs
var { PI: e } = Math;
var t = e + 1e-4;
var n = 0.5;
var r = [1, 1];
function i(e2, t2, n2, r2 = (e3) => e3) {
  return e2 * r2(0.5 - t2 * (0.5 - n2));
}
var { min: a } = Math;
function o(e2, t2, n2) {
  let r2 = a(1, t2 / n2);
  return a(1, e2 + (a(1, 1 - r2) - e2) * (r2 * 0.275));
}
function s(e2) {
  return [-e2[0], -e2[1]];
}
function c(e2, t2) {
  return [e2[0] + t2[0], e2[1] + t2[1]];
}
function l(e2, t2, n2) {
  return e2[0] = t2[0] + n2[0], e2[1] = t2[1] + n2[1], e2;
}
function u(e2, t2) {
  return [e2[0] - t2[0], e2[1] - t2[1]];
}
function d(e2, t2, n2) {
  return e2[0] = t2[0] - n2[0], e2[1] = t2[1] - n2[1], e2;
}
function f(e2, t2) {
  return [e2[0] * t2, e2[1] * t2];
}
function p(e2, t2, n2) {
  return e2[0] = t2[0] * n2, e2[1] = t2[1] * n2, e2;
}
function m(e2, t2) {
  return [e2[0] / t2, e2[1] / t2];
}
function h(e2) {
  return [e2[1], -e2[0]];
}
function g(e2, t2) {
  let n2 = t2[0];
  return e2[0] = t2[1], e2[1] = -n2, e2;
}
function ee(e2, t2) {
  return e2[0] * t2[0] + e2[1] * t2[1];
}
function _(e2, t2) {
  return e2[0] === t2[0] && e2[1] === t2[1];
}
function v(e2) {
  return Math.hypot(e2[0], e2[1]);
}
function y(e2, t2) {
  let n2 = e2[0] - t2[0], r2 = e2[1] - t2[1];
  return n2 * n2 + r2 * r2;
}
function b(e2) {
  return m(e2, v(e2));
}
function x(e2, t2) {
  return Math.hypot(e2[1] - t2[1], e2[0] - t2[0]);
}
function S(e2, t2, n2) {
  let r2 = Math.sin(n2), i2 = Math.cos(n2), a2 = e2[0] - t2[0], o2 = e2[1] - t2[1], s2 = a2 * i2 - o2 * r2, c2 = a2 * r2 + o2 * i2;
  return [s2 + t2[0], c2 + t2[1]];
}
function C(e2, t2, n2, r2) {
  let i2 = Math.sin(r2), a2 = Math.cos(r2), o2 = t2[0] - n2[0], s2 = t2[1] - n2[1], c2 = o2 * a2 - s2 * i2, l2 = o2 * i2 + s2 * a2;
  return e2[0] = c2 + n2[0], e2[1] = l2 + n2[1], e2;
}
function w(e2, t2, n2) {
  return c(e2, f(u(t2, e2), n2));
}
function te(e2, t2, n2, r2) {
  let i2 = n2[0] - t2[0], a2 = n2[1] - t2[1];
  return e2[0] = t2[0] + i2 * r2, e2[1] = t2[1] + a2 * r2, e2;
}
function T(e2, t2, n2) {
  return c(e2, f(t2, n2));
}
var E = [0, 0];
var D = [0, 0];
var O = [0, 0];
function k(e2, n2) {
  let r2 = T(e2, b(h(u(e2, c(e2, [1, 1])))), -n2), i2 = [], a2 = 1 / 13;
  for (let n3 = a2; n3 <= 1; n3 += a2) i2.push(S(r2, e2, t * 2 * n3));
  return i2;
}
function A(e2, n2, r2) {
  let i2 = [], a2 = 1 / r2;
  for (let r3 = a2; r3 <= 1; r3 += a2) i2.push(S(n2, e2, t * r3));
  return i2;
}
function j(e2, t2, n2) {
  let r2 = u(t2, n2), i2 = f(r2, 0.5), a2 = f(r2, 0.51);
  return [u(e2, i2), u(e2, a2), c(e2, a2), c(e2, i2)];
}
function M(e2, n2, r2, i2) {
  let a2 = [], o2 = T(e2, n2, r2), s2 = 1 / i2;
  for (let n3 = s2; n3 < 1; n3 += s2) a2.push(S(o2, e2, t * 3 * n3));
  return a2;
}
function ne(e2, t2, n2) {
  return [c(e2, f(t2, n2)), c(e2, f(t2, n2 * 0.99)), u(e2, f(t2, n2 * 0.99)), u(e2, f(t2, n2))];
}
function N(e2, t2, n2) {
  return e2 === false || e2 === void 0 ? 0 : e2 === true ? Math.max(t2, n2) : e2;
}
function re(e2, t2, n2) {
  return e2.slice(0, 10).reduce((e3, r2) => {
    let i2 = r2.pressure;
    return t2 && (i2 = o(e3, r2.distance, n2)), (e3 + i2) / 2;
  }, e2[0].pressure);
}
function P(e2, n2 = {}) {
  let { size: r2 = 16, smoothing: a2 = 0.5, thinning: f2 = 0.5, simulatePressure: m2 = true, easing: _2 = (e3) => e3, start: v2 = {}, end: b2 = {}, last: x2 = false } = n2, { cap: S2 = true, easing: w2 = (e3) => e3 * (2 - e3) } = v2, { cap: T2 = true, easing: P2 = (e3) => --e3 * e3 * e3 + 1 } = b2;
  if (e2.length === 0 || r2 <= 0) return [];
  let F2 = e2[e2.length - 1].runningLength, I2 = N(v2.taper, r2, F2), L2 = N(b2.taper, r2, F2), R2 = (r2 * a2) ** 2, z2 = [], B = [], V = re(e2, m2, r2), H = i(r2, f2, e2[e2.length - 1].pressure, _2), U, W = e2[0].vector, G = e2[0].point, K = G, q = G, J = K, Y = false;
  for (let n3 = 0; n3 < e2.length; n3++) {
    let { pressure: a3 } = e2[n3], { point: s2, vector: h2, distance: v3, runningLength: b3 } = e2[n3], x3 = n3 === e2.length - 1;
    if (!x3 && F2 - b3 < 3) continue;
    f2 ? (m2 && (a3 = o(V, v3, r2)), H = i(r2, f2, a3, _2)) : H = r2 / 2, U === void 0 && (U = H);
    let S3 = b3 < I2 ? w2(b3 / I2) : 1, T3 = F2 - b3 < L2 ? P2((F2 - b3) / L2) : 1;
    H = Math.max(0.01, H * Math.min(S3, T3));
    let k2 = (x3 ? e2[n3] : e2[n3 + 1]).vector, A2 = x3 ? 1 : ee(h2, k2), j2 = ee(h2, W) < 0 && !Y, M2 = A2 !== null && A2 < 0;
    if (j2 || M2) {
      g(E, W), p(E, E, H);
      for (let e3 = 0; e3 <= 1; e3 += 0.07692307692307693) d(D, s2, E), C(D, D, s2, t * e3), q = [D[0], D[1]], z2.push(q), l(O, s2, E), C(O, O, s2, t * -e3), J = [O[0], O[1]], B.push(J);
      G = q, K = J, M2 && (Y = true);
      continue;
    }
    if (Y = false, x3) {
      g(E, h2), p(E, E, H), z2.push(u(s2, E)), B.push(c(s2, E));
      continue;
    }
    te(E, k2, h2, A2), g(E, E), p(E, E, H), d(D, s2, E), q = [D[0], D[1]], (n3 <= 1 || y(G, q) > R2) && (z2.push(q), G = q), l(O, s2, E), J = [O[0], O[1]], (n3 <= 1 || y(K, J) > R2) && (B.push(J), K = J), V = a3, W = h2;
  }
  let X = [e2[0].point[0], e2[0].point[1]], Z = e2.length > 1 ? [e2[e2.length - 1].point[0], e2[e2.length - 1].point[1]] : c(e2[0].point, [1, 1]), Q = [], $ = [];
  if (e2.length === 1) {
    if (!(I2 || L2) || x2) return k(X, U || H);
  } else {
    I2 || L2 && e2.length === 1 || (S2 ? Q.push(...A(X, B[0], 13)) : Q.push(...j(X, z2[0], B[0])));
    let t2 = h(s(e2[e2.length - 1].vector));
    L2 || I2 && e2.length === 1 ? $.push(Z) : T2 ? $.push(...M(Z, t2, H, 29)) : $.push(...ne(Z, t2, H));
  }
  return z2.concat($, B.reverse(), Q);
}
var F = [0, 0];
function I(e2) {
  return e2 != null && e2 >= 0;
}
function L(e2, t2 = {}) {
  var _a;
  let { streamline: i2 = 0.5, size: a2 = 16, last: o2 = false } = t2;
  if (e2.length === 0) return [];
  let s2 = 0.15 + (1 - i2) * 0.85, l2 = Array.isArray(e2[0]) ? e2 : e2.map(({ x: e3, y: t3, pressure: r2 = n }) => [e3, t3, r2]);
  if (l2.length === 2) {
    let e3 = l2[1];
    l2 = l2.slice(0, -1);
    for (let t3 = 1; t3 < 5; t3++) l2.push(w(l2[0], e3, t3 / 4));
  }
  l2.length === 1 && (l2 = [...l2, [...c(l2[0], r), ...l2[0].slice(2)]]);
  let u2 = [{ point: [l2[0][0], l2[0][1]], pressure: I(l2[0][2]) ? l2[0][2] : 0.25, vector: [...r], distance: 0, runningLength: 0 }], f2 = false, p2 = 0, m2 = u2[0], h2 = l2.length - 1;
  for (let e3 = 1; e3 < l2.length; e3++) {
    let t3 = o2 && e3 === h2 ? [l2[e3][0], l2[e3][1]] : w(m2.point, l2[e3], s2);
    if (_(m2.point, t3)) continue;
    let r2 = x(t3, m2.point);
    if (p2 += r2, e3 < h2 && !f2) {
      if (p2 < a2) continue;
      f2 = true;
    }
    d(F, m2.point, t3), m2 = { point: t3, pressure: I(l2[e3][2]) ? l2[e3][2] : n, vector: b(F), distance: r2, runningLength: p2 }, u2.push(m2);
  }
  return u2[0].vector = ((_a = u2[1]) == null ? void 0 : _a.vector) || [0, 0], u2;
}
function R(e2, t2 = {}) {
  return P(L(e2, t2), t2);
}
var z = R;

// src/render/ink.ts
var HIGHLIGHTER_OPACITY = 0.35;
var INK_SCALE = 10;
function strokePathData(points, tool, size, realPressure, complete = true) {
  if (points.length === 0) return "";
  const scaled = points.map(([x2, y2, p2]) => [x2 * INK_SCALE, y2 * INK_SCALE, p2]);
  const outline = z(scaled, {
    size: size * INK_SCALE,
    thinning: tool === "highlighter" ? 0 : realPressure ? 0.6 : 0.45,
    smoothing: 0.5,
    streamline: 0.4,
    simulatePressure: tool !== "highlighter" && !realPressure,
    start: { cap: true, taper: false },
    end: { cap: true, taper: false },
    last: complete
  });
  return outlineToPath(outline.map(([x2, y2]) => [x2 / INK_SCALE, y2 / INK_SCALE]));
}
function outlineToPath(points) {
  const len = points.length;
  if (len < 4) return "";
  const r2 = (n2) => Math.round(n2 * 1e3) / 1e3;
  let a2 = points[0];
  let b2 = points[1];
  const c2 = points[2];
  let d2 = `M${r2(a2[0])},${r2(a2[1])} Q${r2(b2[0])},${r2(b2[1])} ${r2((b2[0] + c2[0]) / 2)},${r2((b2[1] + c2[1]) / 2)} T`;
  for (let i2 = 2; i2 < len - 1; i2++) {
    a2 = points[i2];
    b2 = points[i2 + 1];
    d2 += `${r2((a2[0] + b2[0]) / 2)},${r2((a2[1] + b2[1]) / 2)} `;
  }
  return d2 + "Z";
}
function strokeSvg(el2) {
  const d2 = strokePathData(el2.points, el2.tool, el2.size, el2.realPressure);
  const opacity = el2.tool === "highlighter" ? ` fill-opacity="${HIGHLIGHTER_OPACITY}"` : "";
  return `<path data-id="${el2.id}" d="${d2}" fill="${escapeAttr(el2.color)}"${opacity}/>`;
}
function escapeAttr(s2) {
  return s2.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function strokeBounds(el2) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x2, y2] of el2.points) {
    if (x2 < minX) minX = x2;
    if (y2 < minY) minY = y2;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }
  const pad2 = el2.size / 2;
  return { x: minX - pad2, y: minY - pad2, w: maxX - minX + el2.size, h: maxY - minY + el2.size };
}

// src/render/templates.ts
var LINE_GAP = 8;
var LINE_TOP = 28;
var MARGIN_X = 25;
var GRID_GAP = 5;
var DOT_GAP = 5;
function paperRhythm(template) {
  switch (template) {
    case "lined":
      return { gap: LINE_GAP, first: LINE_TOP, inset: 1.2, marginX: MARGIN_X };
    case "grid":
      return { gap: GRID_GAP, first: GRID_GAP, inset: 0.9, snapX: GRID_GAP };
    case "dot":
      return { gap: DOT_GAP, first: DOT_GAP, inset: 0.9, snapX: DOT_GAP };
    default:
      return null;
  }
}
function textLineHeight(fontSizePt, rhythm) {
  if (!rhythm) return null;
  const needed = fontSizePt * 0.3528 * 1.1;
  return rhythm.gap * Math.max(1, Math.ceil(needed / rhythm.gap - 1e-6));
}
function fmt(n2) {
  return String(Math.round(n2 * 100) / 100);
}
function templateSvg(template) {
  const parts = [`<rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>`];
  if (template === "lined") {
    let d2 = "";
    for (let y2 = LINE_TOP; y2 < PAGE_H - 16; y2 += LINE_GAP) d2 += `M0 ${fmt(y2)}H${PAGE_W}`;
    parts.push(`<path d="${d2}" stroke="#c5d3e6" stroke-width="0.2" fill="none"/>`);
    parts.push(`<path d="M${MARGIN_X} 0V${PAGE_H}" stroke="#eba5a5" stroke-width="0.25" fill="none"/>`);
  } else if (template === "grid") {
    let d2 = "";
    for (let x2 = GRID_GAP; x2 < PAGE_W; x2 += GRID_GAP) d2 += `M${fmt(x2)} 0V${PAGE_H}`;
    for (let y2 = GRID_GAP; y2 < PAGE_H; y2 += GRID_GAP) d2 += `M0 ${fmt(y2)}H${PAGE_W}`;
    parts.push(`<path d="${d2}" stroke="#dbe3ec" stroke-width="0.15" fill="none"/>`);
  } else if (template === "dot") {
    let d2 = "";
    for (let y2 = DOT_GAP; y2 < PAGE_H; y2 += DOT_GAP) {
      for (let x2 = DOT_GAP; x2 < PAGE_W; x2 += DOT_GAP) d2 += `M${fmt(x2)} ${fmt(y2)}h0.01`;
    }
    parts.push(`<path d="${d2}" stroke="#aeb8c4" stroke-width="0.6" stroke-linecap="round" fill="none"/>`);
  }
  return parts.join("");
}

// src/render/page.ts
var SVG_NS = "http://www.w3.org/2000/svg";
function svgLayer(cls) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", `pn-layer ${cls}`);
  svg.setAttribute("viewBox", `0 0 ${PAGE_W} ${PAGE_H}`);
  svg.setAttribute("preserveAspectRatio", "none");
  return svg;
}
function createPageLayers() {
  const root = createDiv({ cls: "pn-page" });
  const bg = svgLayer("pn-bg");
  const images = createDiv({ cls: "pn-layer pn-images" });
  const highlights = svgLayer("pn-highlights");
  const texts = createDiv({ cls: "pn-layer pn-texts" });
  const number = createDiv({ cls: "pn-page-number" });
  const ink = svgLayer("pn-ink");
  root.append(bg, images, highlights, texts, number, ink);
  return { root, bg, images, highlights, texts, number, ink };
}
function setPageNumber(layers, n2) {
  layers.number.setText(n2 === null ? "" : String(n2));
}
var caches = /* @__PURE__ */ new WeakMap();
async function renderPage(layers, page, ctx, hidden) {
  var _a;
  let cache = caches.get(layers);
  if (!cache) {
    cache = { nodes: /* @__PURE__ */ new Map() };
    caches.set(layers, cache);
  }
  if (cache.template !== page.template) {
    layers.bg.innerHTML = templateSvg(page.template);
    cache.template = page.template;
  }
  const rhythm = paperRhythm(page.template);
  const pen = [];
  const hl = [];
  for (const el2 of page.elements) {
    if (el2.type !== "stroke" || (hidden == null ? void 0 : hidden.has(el2.id))) continue;
    (el2.tool === "highlighter" ? hl : pen).push(strokeSvg(el2));
  }
  layers.ink.innerHTML = pen.join("");
  layers.highlights.innerHTML = hl.join("");
  const seen = /* @__PURE__ */ new Set();
  const jobs = [];
  for (const el2 of page.elements) {
    if (el2.type === "stroke") continue;
    seen.add(el2.id);
    const key = el2.type === "text" ? `t:${el2.md}` : `i:${el2.src}`;
    const cached = cache.nodes.get(el2.id);
    if (cached && cached.key === key) {
      if (el2.type === "text") positionText(cached.node, el2, textLineHeight(el2.fontSize, rhythm));
      else positionImage(cached.node, el2);
      cached.node.toggleClass("pn-hidden", !!(hidden == null ? void 0 : hidden.has(el2.id)));
      continue;
    }
    cached == null ? void 0 : cached.node.remove();
    const node = el2.type === "text" ? createTextNode(el2, rhythm) : createImageNode(el2);
    node.toggleClass("pn-hidden", !!(hidden == null ? void 0 : hidden.has(el2.id)));
    (el2.type === "text" ? layers.texts : layers.images).appendChild(node);
    cache.nodes.set(el2.id, { key, node });
    if (el2.type === "text") jobs.push(ctx.renderMarkdown(el2.md, node.querySelector(".pn-md")));
    else jobs.push(loadImage(node, el2, ctx));
  }
  for (const [id, entry] of cache.nodes) {
    if (!seen.has(id)) {
      entry.node.remove();
      cache.nodes.delete(id);
    }
  }
  for (const el2 of page.elements) {
    const entry = cache.nodes.get(el2.id);
    if (entry) (_a = entry.node.parentElement) == null ? void 0 : _a.appendChild(entry.node);
  }
  await Promise.all(jobs);
}
function positionText(node, el2, lineHeight) {
  node.style.left = `${el2.x}mm`;
  node.style.top = `${el2.y}mm`;
  node.style.width = "";
  node.style.maxWidth = `${el2.w}mm`;
  node.style.fontSize = `${el2.fontSize}pt`;
  node.style.lineHeight = lineHeight ? `${lineHeight}mm` : "";
  if (lineHeight) node.style.setProperty("--pn-lh", `${lineHeight}mm`);
  else node.style.removeProperty("--pn-lh");
  node.style.color = el2.color;
  node.style.transform = "";
}
function createTextNode(el2, rhythm) {
  const node = createDiv({ cls: "pn-text", attr: { "data-id": el2.id } });
  positionText(node, el2, textLineHeight(el2.fontSize, rhythm));
  node.createDiv({ cls: "pn-md" });
  return node;
}
function positionImage(node, el2) {
  node.style.left = `${el2.x}mm`;
  node.style.top = `${el2.y}mm`;
  node.style.width = `${el2.w}mm`;
  node.style.height = `${el2.h}mm`;
  node.style.transform = "";
}
function createImageNode(el2) {
  const img = document.createElement("img");
  img.className = "pn-image";
  img.setAttribute("data-id", el2.id);
  img.draggable = false;
  positionImage(img, el2);
  return img;
}
async function loadImage(img, el2, ctx) {
  const url = await ctx.imageUrl(el2.src);
  if (!url) {
    img.addClass("pn-image-missing");
    img.alt = `Kh\xF4ng t\xECm th\u1EA5y \u1EA3nh: ${el2.src}`;
    return;
  }
  await new Promise((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

// src/export-pdf.ts
var EXPORT_CSS = `
@page { size: 210mm 297mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body > .pn-page {
  position: relative !important;
  transform: none !important;
  box-shadow: none !important;
  break-after: page;
  page-break-after: always;
}
body > .pn-page:last-child { break-after: auto; page-break-after: auto; }
`;
var MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  avif: "image/avif"
};
async function exportNotebookPdf(plugin, file, doc) {
  var _a;
  const { app } = plugin;
  const html = await buildHtml(plugin, file, doc);
  const pdf = await printToPdf(html);
  const folder = plugin.settings.exportFolder || ((_a = file.parent) == null ? void 0 : _a.path) || "";
  const path = (0, import_obsidian.normalizePath)(`${folder ? folder + "/" : ""}${notebookTitle(file.basename)}.pdf`);
  if (folder && !app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
  const data = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength);
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof import_obsidian.TFile) {
    await app.vault.modifyBinary(existing, data);
    return existing;
  }
  return app.vault.createBinary(path, data);
}
async function buildHtml(plugin, file, doc) {
  const { app } = plugin;
  const holder = document.body.createDiv({ cls: "pn-export-holder" });
  const component = new import_obsidian.Component();
  component.load();
  const ctx = {
    // Ảnh nhúng thẳng vào HTML dạng base64, giữ nguyên độ phân giải gốc
    imageUrl: async (src) => {
      var _a, _b;
      const f2 = (_a = app.metadataCache.getFirstLinkpathDest(src, file.path)) != null ? _a : app.vault.getAbstractFileByPath(src);
      if (!(f2 instanceof import_obsidian.TFile)) return null;
      const mime = (_b = MIME[f2.extension.toLowerCase()]) != null ? _b : "application/octet-stream";
      return `data:${mime};base64,${(0, import_obsidian.arrayBufferToBase64)(await app.vault.readBinary(f2))}`;
    },
    renderMarkdown: (md, el2) => import_obsidian.MarkdownRenderer.render(app, md, el2, file.path, component)
  };
  try {
    for (const [i2, page] of doc.pages.entries()) {
      const layers = createPageLayers();
      setPageNumber(layers, plugin.settings.showPageNumbers ? i2 + 1 : null);
      holder.appendChild(layers.root);
      await renderPage(layers, page, ctx);
    }
    await new Promise((r2) => window.setTimeout(r2, 100));
    const css = await app.vault.adapter.read(`${plugin.manifest.dir}/styles.css`);
    const extra = Array.from(document.querySelectorAll("style")).filter((s2) => /^MJX/i.test(s2.id)).map((s2) => {
      var _a;
      return (_a = s2.textContent) != null ? _a : "";
    }).join("\n");
    const title = notebookTitle(file.basename).replace(/[<&]/g, "");
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${css}
${extra}
${EXPORT_CSS}</style></head><body>${holder.innerHTML}</body></html>`;
  } finally {
    component.unload();
    holder.remove();
  }
}
async function printToPdf(html) {
  const electron = window.require("electron");
  const remote = electron.remote;
  if (!(remote == null ? void 0 : remote.BrowserWindow)) throw new Error("Kh\xF4ng truy c\u1EADp \u0111\u01B0\u1EE3c Electron \u0111\u1EC3 in PDF.");
  const fs = window.require("fs");
  const os = window.require("os");
  const path = window.require("path");
  const url = window.require("url");
  const tmp = path.join(os.tmpdir(), `paper-notebook-${Date.now()}.html`);
  await fs.promises.writeFile(tmp, html, "utf8");
  const win = new remote.BrowserWindow({
    show: false,
    width: 800,
    height: 1130,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  try {
    await win.loadURL(url.pathToFileURL(tmp).href);
    await win.webContents.executeJavaScript(
      "Promise.all([document.fonts.ready, ...Array.from(document.images).map(i => i.decode().catch(() => {}))]).then(() => true)"
    );
    const data = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    return new Uint8Array(data);
  } finally {
    win.destroy();
    fs.promises.unlink(tmp).catch(() => {
    });
  }
}

// node_modules/monkey-around/dist/index.mjs
function around(obj, factories) {
  const removers = Object.keys(factories).map((key) => around1(obj, key, factories[key]));
  return removers.length === 1 ? removers[0] : function() {
    removers.forEach((r2) => r2());
  };
}
function around1(obj, method, createWrapper) {
  const inherited = obj[method], hadOwn = obj.hasOwnProperty(method), original = hadOwn ? inherited : function() {
    return Object.getPrototypeOf(obj)[method].apply(this, arguments);
  };
  let current = createWrapper(original);
  if (inherited)
    Object.setPrototypeOf(current, inherited);
  Object.setPrototypeOf(wrapper, current);
  obj[method] = wrapper;
  return remove;
  function wrapper(...args) {
    if (current === original && obj[method] === wrapper)
      remove();
    return current.apply(this, args);
  }
  function remove() {
    if (obj[method] === wrapper) {
      if (hadOwn)
        obj[method] = original;
      else
        delete obj[method];
    }
    if (current === original)
      return;
    current = original;
    Object.setPrototypeOf(wrapper, inherited || Function);
  }
}

// src/open-patch.ts
var import_obsidian3 = require("obsidian");

// src/view.ts
var import_obsidian2 = require("obsidian");

// src/ui/paper-picker.ts
var CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
function el(tag, cls, parent) {
  const node = document.createElement(tag);
  node.className = cls;
  parent == null ? void 0 : parent.appendChild(node);
  return node;
}
function openPaperPicker(container, opts) {
  const backdrop = el("div", "pn-picker-backdrop");
  const dialog = el("div", "pn-picker", backdrop);
  dialog.tabIndex = -1;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", opts.title);
  const header = el("div", "pn-picker-header", dialog);
  el("div", "pn-picker-title", header).textContent = opts.title;
  const closeBtn = el("button", "pn-picker-close", header);
  closeBtn.setAttribute("aria-label", "\u0110\xF3ng");
  closeBtn.innerHTML = CLOSE_ICON;
  const grid = el("div", "pn-template-grid", dialog);
  const cards = [];
  for (const t2 of TEMPLATES) {
    const card = el("button", "pn-template-card", grid);
    card.setAttribute("aria-label", t2.label);
    const preview = el("div", "pn-template-preview", card);
    preview.innerHTML = `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" preserveAspectRatio="none">${templateSvg(t2.id)}</svg>`;
    el("div", "pn-template-name", card).textContent = t2.label;
    if (t2.id === opts.current) {
      card.classList.add("is-current");
      if (opts.badge) preview.setAttribute("data-badge", opts.badge);
    }
    card.addEventListener("click", () => pick(t2.id));
    cards.push(card);
  }
  let closed = false;
  const close = () => {
    var _a;
    if (closed) return;
    closed = true;
    backdrop.remove();
    (_a = opts.onClose) == null ? void 0 : _a.call(opts);
  };
  const pick = (template) => {
    close();
    opts.onPick(template);
  };
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("pointerdown", (e2) => {
    if (e2.target === backdrop) close();
    e2.stopPropagation();
  });
  backdrop.addEventListener("keydown", (e2) => {
    e2.stopPropagation();
    if (e2.key === "Escape") {
      e2.preventDefault();
      close();
      return;
    }
    const dir = e2.key === "ArrowRight" || e2.key === "ArrowDown" ? 1 : e2.key === "ArrowLeft" || e2.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e2.preventDefault();
    const i2 = cards.indexOf(document.activeElement);
    const next = i2 < 0 ? dir > 0 ? 0 : cards.length - 1 : (i2 + dir + cards.length) % cards.length;
    cards[next].focus();
  });
  container.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add("is-open"));
  const start = TEMPLATES.findIndex((t2) => t2.id === opts.current);
  (start >= 0 ? cards[start] : dialog).focus({ preventScroll: true });
  return { close };
}

// src/ui/ruler.ts
var SVG_NS2 = "http://www.w3.org/2000/svg";
var HEIGHT = 64;
var SNAP_TOLERANCE = 12;
var ANGLE_SNAP = 2;
var ROTATE_SMOOTHING_MS = 45;
var HANDLE_REVEAL_INSIDE = 50;
var HANDLE_REVEAL_OUTSIDE = 55;
var HANDLE_REVEAL_SIDE = 16;
var ROTATE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M400 148l-21.12-24.57A191.43 191.43 0 00240 64C134 64 48 150 48 256s86 192 192 192a192.09 192.09 0 00181.07-128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"/><path d="M464 68.45V220a4 4 0 01-4 4H308.45a4 4 0 01-2.83-6.83L457.17 65.62a4 4 0 016.83 2.83z" fill="currentColor"/></svg>';
var Ruler = class {
  constructor(stage, opts) {
    this.stage = stage;
    this.opts = opts;
    this.visible = false;
    this.cx = 0;
    this.cy = 0;
    /** Góc đang hiển thị (độ, không giới hạn 0–360 để xoay qua mốc 0° không bị giật) */
    this.angle = 0;
    /** Góc tay người dùng đang kéo tới; góc hiển thị đuổi theo bằng animation */
    this.target = 0;
    this.frame = null;
    this.lastFrame = 0;
    this.length = 600;
    this.placed = false;
    this.gesture = null;
    this.handleMove = (e2) => this.onMove(e2);
    this.handleUp = (e2) => this.onUp(e2);
    this.handleBlur = () => this.endGesture();
    this.el = document.createElement("div");
    this.el.className = "pn-ruler";
    this.ticks = document.createElementNS(SVG_NS2, "svg");
    this.ticks.setAttribute("class", "pn-ruler-ticks");
    this.el.append(this.ticks);
    for (const side of ["start", "end"]) {
      const handle = document.createElement("div");
      handle.className = `pn-ruler-handle pn-ruler-handle-${side}`;
      handle.title = "K\xE9o \u0111\u1EC3 xoay th\u01B0\u1EDBc";
      handle.innerHTML = ROTATE_ICON;
      this.el.appendChild(handle);
    }
    this.el.addEventListener("pointerdown", (e2) => this.onDown(e2));
    stage.addEventListener("pointermove", (e2) => this.revealHandles(e2));
    stage.addEventListener("pointerleave", () => {
      if (!this.gesture) this.el.classList.remove("near-start", "near-end");
    });
    this.el.addEventListener("dblclick", (e2) => {
      e2.preventDefault();
      if (e2.target.closest(".pn-ruler-handle")) return;
      const edge = this.nearestEdge(e2.clientX, e2.clientY);
      if (edge) this.opts.onStamp(edge);
    });
    this.el.addEventListener(
      "wheel",
      (e2) => {
        e2.preventDefault();
        e2.stopPropagation();
        this.opts.onWheel(e2);
      },
      { passive: false }
    );
  }
  toggle() {
    this.setVisible(!this.visible);
  }
  setVisible(visible) {
    this.visible = visible;
    if (!visible) {
      this.el.remove();
      return;
    }
    this.stage.appendChild(this.el);
    this.layout();
  }
  /** Gọi khi zoom hoặc kích thước vùng xem đổi */
  layout() {
    if (!this.visible) return;
    const w2 = this.stage.clientWidth;
    const h2 = this.stage.clientHeight;
    if (w2 === 0 || h2 === 0) return;
    if (!this.placed) {
      this.length = Math.max(240, Math.min(w2 * 0.8, 1400));
      this.cx = w2 / 2;
      this.cy = h2 / 2;
      this.placed = true;
    }
    this.cx = Math.max(0, Math.min(this.cx, w2));
    this.cy = Math.max(0, Math.min(this.cy, h2));
    this.el.style.width = `${this.length}px`;
    this.el.style.height = `${HEIGHT}px`;
    this.drawTicks();
    this.applyTransform();
  }
  /** Mép thước gần điểm (client) trong khoảng bắt dính, nếu có */
  edgeNear(clientX, clientY) {
    if (!this.visible) return null;
    for (const edge of this.edges()) {
      const vx = clientX - edge.center.x;
      const vy = clientY - edge.center.y;
      const along = vx * edge.dir.x + vy * edge.dir.y;
      const out = vx * edge.outward.x + vy * edge.outward.y;
      if (Math.abs(along) <= edge.half + SNAP_TOLERANCE && out >= -SNAP_TOLERANCE && out <= SNAP_TOLERANCE) return edge;
    }
    return null;
  }
  nearestEdge(clientX, clientY) {
    var _a;
    const edges = this.edges().filter((e2) => !e2.extend);
    const dist = (edge) => Math.abs((clientX - edge.center.x) * edge.outward.x + (clientY - edge.center.y) * edge.outward.y);
    return (_a = edges.sort((a2, b2) => dist(a2) - dist(b2))[0]) != null ? _a : null;
  }
  /** Hai mép thước (toạ độ client), rỗng khi thước đang ẩn */
  currentEdges() {
    return this.visible ? this.edges() : [];
  }
  edges() {
    const rect = this.stage.getBoundingClientRect();
    const rad = this.angle * Math.PI / 180;
    const dir = { x: Math.cos(rad), y: Math.sin(rad) };
    const normal = { x: -dir.y, y: dir.x };
    const c2 = { x: rect.left + this.cx, y: rect.top + this.cy };
    const h2 = HEIGHT / 2;
    const half = this.length / 2;
    const back = { x: -dir.x, y: -dir.y };
    return [
      // Hai cạnh dài: kẻ đường song song với thước
      { center: { x: c2.x - normal.x * h2, y: c2.y - normal.y * h2 }, dir, outward: { x: -normal.x, y: -normal.y }, half, depth: HEIGHT, extend: false },
      { center: { x: c2.x + normal.x * h2, y: c2.y + normal.y * h2 }, dir, outward: normal, half, depth: HEIGHT, extend: false },
      // Hai đầu thước: kẻ đường vuông góc với thước
      { center: { x: c2.x - dir.x * half, y: c2.y - dir.y * half }, dir: normal, outward: back, half: h2, depth: this.length, extend: true },
      { center: { x: c2.x + dir.x * half, y: c2.y + dir.y * half }, dir: normal, outward: dir, half: h2, depth: this.length, extend: true }
    ];
  }
  /** Đặt góc đích; thước xoay mượt tới đó qua requestAnimationFrame */
  rotateTo(deg, magnet = true) {
    let a2 = deg;
    if (magnet) {
      const nearest = Math.round(a2 / 15) * 15;
      if (Math.abs(a2 - nearest) < ANGLE_SNAP) a2 = nearest;
    }
    this.target = a2;
    if (this.frame === null) {
      this.lastFrame = performance.now();
      this.frame = requestAnimationFrame((t2) => this.animate(t2));
    }
  }
  animate(now) {
    const dt = Math.min(64, now - this.lastFrame);
    this.lastFrame = now;
    const diff = this.target - this.angle;
    this.angle = Math.abs(diff) < 0.02 ? this.target : this.angle + diff * (1 - Math.exp(-dt / ROTATE_SMOOTHING_MS));
    this.applyTransform();
    this.frame = this.angle === this.target ? null : requestAnimationFrame((t2) => this.animate(t2));
  }
  applyTransform() {
    this.el.style.transform = `translate(${this.cx}px, ${this.cy}px) rotate(${this.angle}deg) translate(${-this.length / 2}px, ${-HEIGHT / 2}px)`;
  }
  drawTicks() {
    const mm = this.opts.pxPerMm();
    const w2 = this.length;
    let d2 = "";
    const labels = [];
    const step = mm >= 3 ? 1 : 5;
    const count = Math.floor((w2 - 16) / mm);
    for (let i2 = 0; i2 <= count; i2 += step) {
      const x2 = 8 + i2 * mm;
      const len = i2 % 10 === 0 ? 14 : i2 % 5 === 0 ? 9 : 5;
      d2 += `M${x2.toFixed(2)} 0v${len}M${x2.toFixed(2)} ${HEIGHT}v${-len}`;
      if (i2 % 10 === 0 && (mm >= 2 || i2 % 20 === 0)) {
        labels.push(`<text x="${x2.toFixed(2)}" y="26" text-anchor="middle">${i2 / 10}</text>`);
      }
    }
    this.ticks.setAttribute("viewBox", `0 0 ${w2} ${HEIGHT}`);
    this.ticks.setAttribute("width", String(w2));
    this.ticks.setAttribute("height", String(HEIGHT));
    this.ticks.innerHTML = `<path d="${d2}" stroke="currentColor" stroke-width="1" fill="none"/>${labels.join("")}`;
  }
  onDown(e2) {
    if (e2.button !== 0 && e2.pointerType === "mouse") return;
    e2.preventDefault();
    e2.stopPropagation();
    const target = e2.target;
    const rect = this.stage.getBoundingClientRect();
    const px = e2.clientX - rect.left;
    const py = e2.clientY - rect.top;
    if (target.closest(".pn-ruler-handle")) {
      const pointerAngle = Math.atan2(py - this.cy, px - this.cx) * 180 / Math.PI;
      this.gesture = { mode: "rotate", pointerId: e2.pointerId, dx: 0, dy: 0, offset: this.target - pointerAngle };
    } else {
      this.gesture = { mode: "move", pointerId: e2.pointerId, dx: this.cx - px, dy: this.cy - py, offset: 0 };
    }
    try {
      this.el.setPointerCapture(e2.pointerId);
    } catch (e3) {
    }
    window.addEventListener("pointermove", this.handleMove, true);
    window.addEventListener("pointerup", this.handleUp, true);
    window.addEventListener("pointercancel", this.handleUp, true);
    window.addEventListener("blur", this.handleBlur);
    this.el.addEventListener("lostpointercapture", this.handleUp);
    this.el.classList.add("is-active");
  }
  onMove(e2) {
    const g2 = this.gesture;
    if (!g2 || g2.pointerId !== e2.pointerId) return;
    if (e2.buttons === 0) return this.endGesture();
    const rect = this.stage.getBoundingClientRect();
    const px = e2.clientX - rect.left;
    const py = e2.clientY - rect.top;
    if (g2.mode === "move") {
      this.cx = Math.max(0, Math.min(px + g2.dx, rect.width));
      this.cy = Math.max(0, Math.min(py + g2.dy, rect.height));
      this.applyTransform();
    } else {
      let a2 = Math.atan2(py - this.cy, px - this.cx) * 180 / Math.PI + g2.offset;
      a2 += Math.round((this.target - a2) / 360) * 360;
      this.rotateTo(a2);
    }
  }
  onUp(e2) {
    if (!this.gesture || this.gesture.pointerId !== e2.pointerId) return;
    this.endGesture();
    this.revealHandles(e2);
  }
  /** Kết thúc kéo / xoay và gỡ mọi listener tạm */
  endGesture() {
    const g2 = this.gesture;
    this.gesture = null;
    window.removeEventListener("pointermove", this.handleMove, true);
    window.removeEventListener("pointerup", this.handleUp, true);
    window.removeEventListener("pointercancel", this.handleUp, true);
    window.removeEventListener("blur", this.handleBlur);
    this.el.removeEventListener("lostpointercapture", this.handleUp);
    if (g2 && this.el.hasPointerCapture(g2.pointerId)) this.el.releasePointerCapture(g2.pointerId);
    this.el.classList.remove("is-active");
  }
  /** Hiện nút xoay ở đầu thước khi chuột lại gần đầu đó */
  revealHandles(e2) {
    var _a;
    if (((_a = this.gesture) == null ? void 0 : _a.mode) === "rotate") return;
    if (!this.visible) return;
    const rect = this.stage.getBoundingClientRect();
    const rad = this.angle * Math.PI / 180;
    const vx = e2.clientX - rect.left - this.cx;
    const vy = e2.clientY - rect.top - this.cy;
    const along = vx * Math.cos(rad) + vy * Math.sin(rad);
    const across = Math.abs(-vx * Math.sin(rad) + vy * Math.cos(rad));
    const half = this.length / 2;
    const inBand = across <= HEIGHT / 2 + HANDLE_REVEAL_SIDE;
    const nearEnd = (d2) => inBand && d2 >= -HANDLE_REVEAL_INSIDE && d2 <= HANDLE_REVEAL_OUTSIDE;
    this.el.classList.toggle("near-start", nearEnd(-half - along));
    this.el.classList.toggle("near-end", nearEnd(along - half));
  }
};

// src/tools/types.ts
var SVG_NS3 = "http://www.w3.org/2000/svg";

// src/tools/eraser.ts
var EraserTool = class {
  constructor(host) {
    this.host = host;
    this.erased = /* @__PURE__ */ new Set();
    this.last = null;
    this.cursor = null;
    this.pageId = null;
  }
  down(pv, pt) {
    this.pageId = pv.id;
    this.erased.clear();
    this.last = pt;
    this.cursor = document.createElementNS(SVG_NS3, "circle");
    this.cursor.setAttribute("class", "pn-eraser-cursor");
    pv.overlay.appendChild(this.cursor);
    this.eraseAt(pv, pt);
  }
  move(pv, pt) {
    if (!this.last) return;
    const step = this.radius() / 2;
    const dist = Math.hypot(pt.x - this.last.x, pt.y - this.last.y);
    const n2 = Math.max(1, Math.ceil(dist / step));
    for (let i2 = 1; i2 <= n2; i2++) {
      this.eraseAt(pv, {
        x: this.last.x + (pt.x - this.last.x) * i2 / n2,
        y: this.last.y + (pt.y - this.last.y) * i2 / n2
      });
    }
    this.last = pt;
  }
  up(pv) {
    var _a;
    (_a = this.cursor) == null ? void 0 : _a.remove();
    this.cursor = null;
    this.last = null;
    const hidden = this.host.hiddenOn(pv.id);
    const ops = [];
    for (const id of this.erased) {
      hidden.delete(id);
      ops.push({ type: "removeElement", pageId: pv.id, elementId: id });
    }
    this.erased.clear();
    if (ops.length) this.host.store.commit(ops);
  }
  deactivate() {
    var _a;
    (_a = this.cursor) == null ? void 0 : _a.remove();
    this.cursor = null;
    if (this.pageId) {
      const hidden = this.host.hiddenOn(this.pageId);
      for (const id of this.erased) hidden.delete(id);
      this.host.rerender(this.pageId);
    }
    this.erased.clear();
  }
  radius() {
    return this.host.pxToMm(this.host.options.eraser.size);
  }
  eraseAt(pv, pt) {
    var _a, _b, _c;
    const r2 = this.radius();
    (_a = this.cursor) == null ? void 0 : _a.setAttribute("cx", String(pt.x));
    (_b = this.cursor) == null ? void 0 : _b.setAttribute("cy", String(pt.y));
    (_c = this.cursor) == null ? void 0 : _c.setAttribute("r", String(r2));
    const page = this.host.store.page(pv.id);
    if (!page) return;
    let changed = false;
    for (const el2 of page.elements) {
      if (el2.type !== "stroke" || this.erased.has(el2.id)) continue;
      if (hitsStroke(el2, pt, r2)) {
        this.erased.add(el2.id);
        this.host.hiddenOn(pv.id).add(el2.id);
        changed = true;
      }
    }
    if (changed) this.host.rerender(pv.id);
  }
};
function hitsStroke(el2, pt, r2) {
  const limit = r2 + el2.size / 2;
  const pts = el2.points;
  if (pts.length === 1) return Math.hypot(pts[0][0] - pt.x, pts[0][1] - pt.y) <= limit;
  for (let i2 = 1; i2 < pts.length; i2++) {
    if (distToSegment(pt, pts[i2 - 1][0], pts[i2 - 1][1], pts[i2][0], pts[i2][1]) <= limit) return true;
  }
  return false;
}
function distToSegment(p2, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t2 = len2 === 0 ? 0 : ((p2.x - ax) * dx + (p2.y - ay) * dy) / len2;
  t2 = Math.max(0, Math.min(1, t2));
  return Math.hypot(p2.x - (ax + t2 * dx), p2.y - (ay + t2 * dy));
}

// src/tools/lasso.ts
var LassoTool = class {
  constructor(host, onSelectionChange) {
    this.host = host;
    this.onSelectionChange = onSelectionChange;
    this.selection = null;
    this.mode = null;
    this.lassoPts = [];
    this.lassoEl = null;
    this.boxEl = null;
    this.start = { x: 0, y: 0 };
    this.delta = { x: 0, y: 0 };
  }
  down(pv, pt) {
    var _a;
    this.start = pt;
    this.delta = { x: 0, y: 0 };
    this.mode = null;
    if (((_a = this.selection) == null ? void 0 : _a.pageId) === pv.id) {
      const box = this.bounds(pv);
      const single = this.singleResizable(pv);
      if (box && single && Math.hypot(pt.x - (box.x + box.w), pt.y - (box.y + box.h)) <= this.handleRadius() * 1.6) {
        this.mode = "resize";
        return;
      }
      if (box && inside(pt, pad(box, this.host.pxToMm(4)))) {
        this.mode = "move";
        return;
      }
    }
    const hit = this.elementAt(pv, pt);
    if (hit) {
      this.select({ pageId: pv.id, ids: /* @__PURE__ */ new Set([hit.id]) });
      this.mode = "move";
      return;
    }
    this.clear();
    this.mode = "lasso";
    this.lassoPts = [pt];
    this.lassoEl = document.createElementNS(SVG_NS3, "polyline");
    this.lassoEl.setAttribute("class", "pn-lasso");
    pv.overlay.appendChild(this.lassoEl);
  }
  move(pv, pt) {
    if (this.mode === "lasso" && this.lassoEl) {
      this.lassoPts.push(pt);
      this.lassoEl.setAttribute("points", this.lassoPts.map((p2) => `${p2.x},${p2.y}`).join(" "));
    } else if (this.mode === "move" && this.selection) {
      this.delta = this.snappedDelta(pt.x - this.start.x, pt.y - this.start.y);
      this.previewMove(pv);
    } else if (this.mode === "resize") {
      this.delta = { x: pt.x - this.start.x, y: pt.y - this.start.y };
      this.previewResize(pv);
    }
  }
  up(pv) {
    var _a;
    const mode = this.mode;
    this.mode = null;
    if (mode === "lasso") {
      (_a = this.lassoEl) == null ? void 0 : _a.remove();
      this.lassoEl = null;
      const ids = this.idsInLasso(pv, this.lassoPts);
      this.lassoPts = [];
      if (ids.size > 0) this.select({ pageId: pv.id, ids });
      return;
    }
    if (mode === "move" && this.selection) {
      const { x: dx, y: dy } = this.delta;
      if (Math.abs(dx) + Math.abs(dy) < 0.1) {
        this.delta = { x: 0, y: 0 };
        this.previewMove(pv);
        return;
      }
      const ops = [];
      for (const el2 of this.selectedElements()) {
        ops.push({ type: "updateElement", pageId: pv.id, element: translated(el2, dx, dy) });
      }
      this.host.store.commit(ops);
      return;
    }
    if (mode === "resize") {
      const el2 = this.singleResizable(pv);
      if (el2) this.host.store.commit([{ type: "updateElement", pageId: pv.id, element: this.resized(el2) }]);
    }
  }
  deactivate() {
    var _a;
    (_a = this.lassoEl) == null ? void 0 : _a.remove();
    this.lassoEl = null;
    this.clear();
  }
  // ---------- Selection ----------
  select(selection) {
    this.selection = selection;
    this.refresh();
    this.onSelectionChange();
  }
  clear() {
    var _a;
    const had = !!this.selection;
    this.selection = null;
    (_a = this.boxEl) == null ? void 0 : _a.remove();
    this.boxEl = null;
    if (had) this.onSelectionChange();
  }
  selectedElements() {
    if (!this.selection) return [];
    const page = this.host.store.page(this.selection.pageId);
    return page ? page.elements.filter((e2) => this.selection.ids.has(e2.id)) : [];
  }
  /** Vẽ lại khung chọn sau khi dữ liệu thay đổi (undo, di chuyển…) */
  refresh() {
    var _a;
    (_a = this.boxEl) == null ? void 0 : _a.remove();
    this.boxEl = null;
    if (!this.selection) return;
    const pv = this.host.pageView(this.selection.pageId);
    const page = this.host.store.page(this.selection.pageId);
    if (!pv || !page) return this.clear();
    for (const id of [...this.selection.ids]) {
      if (!page.elements.some((e2) => e2.id === id)) this.selection.ids.delete(id);
    }
    if (this.selection.ids.size === 0) return this.clear();
    this.drawBox(pv, this.bounds(pv));
  }
  deleteSelection() {
    if (!this.selection) return;
    const pageId = this.selection.pageId;
    const ops = this.selectedElements().map((e2) => ({ type: "removeElement", pageId, elementId: e2.id }));
    this.clear();
    this.host.store.commit(ops);
  }
  setColor(color) {
    if (!this.selection) return;
    const pageId = this.selection.pageId;
    const ops = [];
    for (const el2 of this.selectedElements()) {
      if (el2.type === "image") continue;
      ops.push({ type: "updateElement", pageId, element: { ...clone(el2), color } });
    }
    this.host.store.commit(ops);
  }
  // ---------- Helpers ----------
  /**
   * Nếu phần đang chọn có text box thì dịch cả nhóm sao cho text box đầu tiên
   * nằm ngay ngắn trên đường kẻ; nét bút, ảnh đi theo cùng độ dịch đó.
   */
  snappedDelta(dx, dy) {
    const text = this.selectedElements().find((e2) => e2.type === "text");
    if (!text || text.type !== "text" || !this.selection) return { x: dx, y: dy };
    const p2 = this.host.snapText(this.selection.pageId, text, text.x + dx, text.y + dy);
    return { x: p2.x - text.x, y: p2.y - text.y };
  }
  handleRadius() {
    return this.host.pxToMm(6);
  }
  bounds(pv) {
    const els = this.selectedElements();
    if (els.length === 0) return null;
    return union(els.map((e2) => this.host.elementBounds(pv, e2)));
  }
  singleResizable(pv) {
    if (!this.selection || this.selection.ids.size !== 1 || this.selection.pageId !== pv.id) return null;
    const el2 = this.selectedElements()[0];
    return el2 && el2.type !== "stroke" ? el2 : null;
  }
  drawBox(pv, box) {
    var _a;
    (_a = this.boxEl) == null ? void 0 : _a.remove();
    const g2 = document.createElementNS(SVG_NS3, "g");
    g2.setAttribute("class", "pn-selection");
    const p2 = pad(box, this.host.pxToMm(3));
    const rect = document.createElementNS(SVG_NS3, "rect");
    rect.setAttribute("x", String(p2.x));
    rect.setAttribute("y", String(p2.y));
    rect.setAttribute("width", String(p2.w));
    rect.setAttribute("height", String(p2.h));
    rect.setAttribute("stroke-width", String(this.host.pxToMm(1.5)));
    rect.setAttribute("stroke-dasharray", `${this.host.pxToMm(5)} ${this.host.pxToMm(4)}`);
    g2.appendChild(rect);
    if (this.singleResizable(pv)) {
      const handle = document.createElementNS(SVG_NS3, "circle");
      handle.setAttribute("class", "pn-handle");
      handle.setAttribute("cx", String(box.x + box.w));
      handle.setAttribute("cy", String(box.y + box.h));
      handle.setAttribute("r", String(this.handleRadius()));
      handle.setAttribute("stroke-width", String(this.host.pxToMm(1.5)));
      g2.appendChild(handle);
    }
    pv.overlay.appendChild(g2);
    this.boxEl = g2;
  }
  previewMove(pv) {
    var _a;
    const { x: dx, y: dy } = this.delta;
    for (const id of this.selection.ids) {
      pv.layers.root.querySelectorAll(`[data-id="${id}"]`).forEach((node) => {
        if (node instanceof SVGElement) node.setAttribute("transform", `translate(${dx} ${dy})`);
        else node.style.transform = `translate(${dx}mm, ${dy}mm)`;
      });
    }
    (_a = this.boxEl) == null ? void 0 : _a.setAttribute("transform", `translate(${dx} ${dy})`);
  }
  previewResize(pv) {
    const el2 = this.singleResizable(pv);
    if (!el2) return;
    const next = this.resized(el2);
    const node = pv.layers.root.querySelector(`[data-id="${el2.id}"]`);
    if (node && next.type === "image") {
      node.style.maxWidth = `${next.w}mm`;
      node.style.height = `${next.h}mm`;
    } else if (node && next.type === "text") {
      node.style.width = `${next.w}mm`;
    }
    this.drawBox(pv, this.host.elementBounds(pv, next));
  }
  resized(el2) {
    const next = clone(el2);
    if (next.type === "image") {
      const ratio = next.h / next.w;
      next.w = Math.max(5, next.w + this.delta.x);
      next.h = next.w * ratio;
    } else if (next.type === "text") {
      next.w = Math.max(15, next.w + this.delta.x);
    }
    return next;
  }
  elementAt(pv, pt) {
    const page = this.host.store.page(pv.id);
    if (!page) return null;
    const r2 = this.host.pxToMm(6);
    for (let i2 = page.elements.length - 1; i2 >= 0; i2--) {
      const el2 = page.elements[i2];
      if (el2.type === "stroke" ? hitsStroke(el2, pt, r2) : inside(pt, this.host.elementBounds(pv, el2))) return el2;
    }
    return null;
  }
  idsInLasso(pv, poly) {
    const ids = /* @__PURE__ */ new Set();
    const page = this.host.store.page(pv.id);
    if (!page || poly.length < 3) return ids;
    for (const el2 of page.elements) {
      if (el2.type === "stroke") {
        let n2 = 0;
        for (const [x2, y2] of el2.points) if (inPolygon({ x: x2, y: y2 }, poly)) n2++;
        if (n2 > 0 && n2 >= el2.points.length / 2) ids.add(el2.id);
      } else {
        const b2 = this.host.elementBounds(pv, el2);
        if (inPolygon({ x: b2.x + b2.w / 2, y: b2.y + b2.h / 2 }, poly)) ids.add(el2.id);
      }
    }
    return ids;
  }
};
function translated(el2, dx, dy) {
  const next = clone(el2);
  if (next.type === "stroke") next.points = next.points.map(([x2, y2, p2]) => [x2 + dx, y2 + dy, p2]);
  else {
    next.x += dx;
    next.y += dy;
  }
  return next;
}
function inside(pt, r2) {
  return pt.x >= r2.x && pt.x <= r2.x + r2.w && pt.y >= r2.y && pt.y <= r2.y + r2.h;
}
function pad(r2, d2) {
  return { x: r2.x - d2, y: r2.y - d2, w: r2.w + 2 * d2, h: r2.h + 2 * d2 };
}
function union(rects) {
  const x2 = Math.min(...rects.map((r2) => r2.x));
  const y2 = Math.min(...rects.map((r2) => r2.y));
  const x22 = Math.max(...rects.map((r2) => r2.x + r2.w));
  const y22 = Math.max(...rects.map((r2) => r2.y + r2.h));
  return { x: x2, y: y2, w: x22 - x2, h: y22 - y2 };
}
function inPolygon(p2, poly) {
  let inside2 = false;
  for (let i2 = 0, j2 = poly.length - 1; i2 < poly.length; j2 = i2++) {
    const a2 = poly[i2];
    const b2 = poly[j2];
    if (a2.y > p2.y !== b2.y > p2.y && p2.x < (b2.x - a2.x) * (p2.y - a2.y) / (b2.y - a2.y) + a2.x) inside2 = !inside2;
  }
  return inside2;
}

// src/tools/pen.ts
var RULER_CATCH_PX = 10;
var RULER_RELEASE_PX = 28;
var PenTool = class {
  constructor(host, kind) {
    this.host = host;
    this.kind = kind;
    this.points = [];
    this.live = null;
    this.realPressure = false;
    /** Hai mép thước (mm) lúc bắt đầu nét; thước không đổi chỗ trong lúc đang vẽ */
    this.edges = [];
    /** Mép thước nét đang bám theo, null = vẽ tự do */
    this.lock = null;
  }
  get opts() {
    return this.host.options[this.kind];
  }
  down(pv, pt, e2) {
    this.realPressure = e2.pointerType === "pen" && e2.pressure > 0;
    this.edges = this.host.rulerEdges(pv, this.opts.size);
    this.lock = null;
    this.points = [this.point(pt, e2)];
    this.live = document.createElementNS(SVG_NS3, "path");
    this.live.setAttribute("fill", this.opts.color);
    if (this.kind === "highlighter") this.live.setAttribute("fill-opacity", String(HIGHLIGHTER_OPACITY));
    pv.overlay.appendChild(this.live);
    this.redraw(false);
  }
  move(pv, pt, e2) {
    if (!this.live) return;
    this.points.push(this.point(pt, e2));
    this.redraw(false);
  }
  up(pv) {
    if (!this.live) return;
    this.live.remove();
    this.live = null;
    if (this.points.length === 0) return;
    const element = {
      id: newId(),
      type: "stroke",
      tool: this.kind,
      color: this.opts.color,
      size: this.opts.size,
      realPressure: this.realPressure,
      points: this.points
    };
    this.points = [];
    this.host.store.commit([{ type: "addElement", pageId: pv.id, element }]);
  }
  deactivate() {
    var _a;
    (_a = this.live) == null ? void 0 : _a.remove();
    this.live = null;
    this.points = [];
  }
  point(pt, e2) {
    pt = this.followRuler(pt);
    const x2 = Math.max(0, Math.min(PAGE_W, pt.x));
    const y2 = Math.max(0, Math.min(PAGE_H, pt.y));
    return [x2, y2, this.realPressure ? e2.pressure : 0.5];
  }
  /**
   * Như thước thật: bút vẽ từ hướng nào tới, hễ chạm mép thước (hoặc lấn vào thân
   * thước) là trượt thẳng dọc theo mép; kéo bút ra xa hẳn thì vẽ tự do tiếp.
   */
  followRuler(pt) {
    if (this.edges.length === 0) return pt;
    const measure = (e2) => {
      const vx = pt.x - e2.p0.x;
      const vy = pt.y - e2.p0.y;
      return { along: vx * e2.dir.x + vy * e2.dir.y, out: vx * e2.outward.x + vy * e2.outward.y };
    };
    if (this.lock) {
      const { along: along2, out } = measure(this.lock);
      const release = this.host.pxToMm(RULER_RELEASE_PX);
      if (out > release || !this.lock.extend && Math.abs(along2) > this.lock.half + release) this.lock = null;
    }
    if (!this.lock) {
      const katch = this.host.pxToMm(RULER_CATCH_PX);
      let best = null;
      for (const edge of this.edges) {
        const { along: along2, out } = measure(edge);
        const touching = out <= katch && out >= -(edge.thickness + katch) && Math.abs(along2) <= edge.half + katch;
        if (touching && (!best || out > best.out)) best = { edge, out };
      }
      if (best) this.lock = best.edge;
    }
    if (!this.lock) return pt;
    const { along } = measure(this.lock);
    const t2 = this.lock.extend ? along : Math.max(-this.lock.half, Math.min(this.lock.half, along));
    return { x: this.lock.p0.x + this.lock.dir.x * t2, y: this.lock.p0.y + this.lock.dir.y * t2 };
  }
  redraw(complete) {
    var _a;
    (_a = this.live) == null ? void 0 : _a.setAttribute("d", strokePathData(this.points, this.kind, this.opts.size, this.realPressure, complete));
  }
};

// src/tools/text.ts
var DRAG_THRESHOLD_PX = 4;
var TextTool = class {
  constructor(host) {
    this.host = host;
    this.drag = null;
  }
  down(pv, pt) {
    const el2 = this.host.textAt(pv, pt);
    if (!el2) {
      this.host.editText(pv, null, pt);
      return;
    }
    const node = pv.layers.texts.querySelector(`.pn-text[data-id="${el2.id}"]`);
    this.drag = { pv, el: el2, start: pt, to: { x: el2.x, y: el2.y }, moved: false, node };
  }
  move(pv, pt) {
    const d2 = this.drag;
    if (!d2) return;
    const dx = pt.x - d2.start.x;
    const dy = pt.y - d2.start.y;
    if (!d2.moved && Math.hypot(dx, dy) < this.host.pxToMm(DRAG_THRESHOLD_PX)) return;
    d2.moved = true;
    d2.to = this.host.snapText(d2.pv.id, d2.el, d2.el.x + dx, d2.el.y + dy);
    if (d2.node) {
      d2.node.addClass("pn-dragging");
      d2.node.style.transform = `translate(${d2.to.x - d2.el.x}mm, ${d2.to.y - d2.el.y}mm)`;
    }
  }
  up() {
    var _a;
    const d2 = this.drag;
    this.drag = null;
    if (!d2) return;
    (_a = d2.node) == null ? void 0 : _a.removeClass("pn-dragging");
    if (!d2.moved) {
      this.host.editText(d2.pv, d2.el.id);
      return;
    }
    if (d2.to.x === d2.el.x && d2.to.y === d2.el.y) {
      if (d2.node) d2.node.style.transform = "";
      return;
    }
    this.host.store.commit([{ type: "updateElement", pageId: d2.pv.id, element: { ...clone(d2.el), x: d2.to.x, y: d2.to.y } }]);
  }
  deactivate() {
    var _a;
    if ((_a = this.drag) == null ? void 0 : _a.node) {
      this.drag.node.style.transform = "";
      this.drag.node.removeClass("pn-dragging");
    }
    this.drag = null;
  }
};
var TextEditor = class _TextEditor {
  constructor(store, pv, element, isNew, onClose) {
    this.store = store;
    this.pv = pv;
    this.element = element;
    this.isNew = isNew;
    this.onClose = onClose;
    this.done = false;
    var _a, _b;
    this.textarea = pv.layers.texts.createEl("textarea", { cls: "pn-text-editor" });
    const template = (_b = (_a = store.page(pv.id)) == null ? void 0 : _a.template) != null ? _b : "blank";
    positionText(this.textarea, element, textLineHeight(element.fontSize, paperRhythm(template)));
    this.textarea.value = element.md;
    this.textarea.spellcheck = false;
    this.textarea.addEventListener("input", () => this.autosize());
    if (!CSS.supports("field-sizing", "content")) this.textarea.style.width = this.textarea.style.maxWidth;
    this.textarea.addEventListener("blur", () => this.finish());
    this.textarea.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        this.textarea.blur();
      }
    });
    this.textarea.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    this.autosize();
    window.setTimeout(() => this.textarea.focus(), 0);
  }
  get elementId() {
    return this.element.id;
  }
  static create(store, pv, at, opts, place, onClose) {
    const x2 = Math.max(5, Math.min(at.x, PAGE_W - 30));
    const element = {
      id: newId(),
      type: "text",
      x: x2,
      // Đặt dòng đầu tiên ngay dưới con trỏ
      y: Math.max(0, at.y - opts.fontSize * 0.3528 * 1.45 / 2),
      // Chiều rộng tối đa tới gần mép phải trang; hộp thực tế co theo nội dung
      w: PAGE_W - x2 - 5,
      fontSize: opts.fontSize,
      color: opts.color,
      md: ""
    };
    const p2 = place(element);
    element.x = p2.x;
    element.y = p2.y;
    element.w = Math.max(15, PAGE_W - p2.x - 5);
    return new _TextEditor(store, pv, element, true, onClose);
  }
  autosize() {
    if (CSS.supports("field-sizing", "content")) return;
    this.textarea.style.height = "auto";
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }
  finish() {
    if (this.done) return;
    this.done = true;
    const md = this.textarea.value.replace(/\s+$/, "");
    this.textarea.remove();
    this.onClose();
    const pageId = this.pv.id;
    if (this.isNew) {
      if (md.trim()) this.store.commit([{ type: "addElement", pageId, element: { ...this.element, md } }]);
    } else if (!md.trim()) {
      this.store.commit([{ type: "removeElement", pageId, elementId: this.element.id }]);
    } else if (md !== this.element.md) {
      this.store.commit([{ type: "updateElement", pageId, element: { ...this.element, md } }]);
    }
  }
};

// src/view.ts
var VIEW_TYPE = "paper-notebook";
var NOTEBOOK_ICON = "notebook-pen";
var PX_PER_MM = 96 / 25.4;
var FIT_MAX_ZOOM = 1.25;
var SCROLL_TOP_GAP = 68;
var MIN_ZOOM = 0.2;
var MAX_ZOOM = 4;
var ZOOM_WHEEL_SPEED = 4e-3;
var ZOOM_WHEEL_MAX_DELTA = 25;
var PEN_COLORS = ["#1a1a1a", "#1f5fbf", "#d93025", "#188038", "#7b3fe4", "#e8710a"];
var HIGHLIGHTER_COLORS = ["#ffd60a", "#7bf1a8", "#ff8fab", "#8ecae6"];
var PEN_SIZES = [0.35, 0.6, 1];
var HIGHLIGHTER_SIZES = [4, 6, 9];
var FONT_SIZES = [9, 11, 14, 18, 24];
var ERASER_SIZES = [5, 9, 15];
var IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];
var TOOLS = [
  { id: "pointer", icon: "mouse-pointer-2", title: "Ch\u1ECDn trang", key: "v" },
  { id: "hand", icon: "hand", title: "B\xE0n tay: k\xE9o \u0111\u1EC3 cu\u1ED9n (ho\u1EB7c gi\u1EEF Space)" },
  { id: "pen", icon: "pencil", title: "B\xFAt", key: "p" },
  { id: "highlighter", icon: "highlighter", title: "B\xFAt highlight", key: "h" },
  { id: "eraser", icon: "eraser", title: "T\u1EA9y", key: "e" },
  { id: "lasso", icon: "lasso-select", title: "Ch\u1ECDn / di chuy\u1EC3n", key: "l" },
  { id: "text", icon: "type", title: "Text box", key: "t" }
];
var CLIP_MARKER = "paper-notebook:elements";
var clipboard = null;
var NotebookView = class _NotebookView extends import_obsidian2.TextFileView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.store = new NotebookStore(newDoc("lined"));
    this.options = {
      pen: { color: PEN_COLORS[0], size: PEN_SIZES[1] },
      highlighter: { color: HIGHLIGHTER_COLORS[0], size: HIGHLIGHTER_SIZES[1] },
      text: { color: PEN_COLORS[0], fontSize: 11 },
      eraser: { size: ERASER_SIZES[1] }
    };
    this.zoom = 1;
    this.currentPageId = null;
    this.frontmatter = "";
    this.raw = "";
    this.loadError = null;
    this.pageViews = /* @__PURE__ */ new Map();
    this.hidden = /* @__PURE__ */ new Map();
    this.toolId = "pen";
    this.active = null;
    this.textEditor = null;
    this.fitWidth = true;
    this.optionsOpen = false;
    /** requestAnimationFrame id của lần tự cuộn đang chạy */
    this.glide = null;
    this.selectedPageId = null;
    this.picker = null;
    this.ruler = null;
    this.baselineCache = /* @__PURE__ */ new Map();
    this.spaceHeld = false;
    this.pan = null;
    this.thumbTimers = /* @__PURE__ */ new Map();
    this.ui = null;
    this.lasso = new LassoTool(this, () => {
      this.renderToolOptions();
      if (this.toolId === "lasso") this.setOptionsOpen(!!this.lasso.selection);
    });
    const none = { down() {
    } };
    this.tools = {
      pointer: none,
      hand: none,
      pen: new PenTool(this, "pen"),
      highlighter: new PenTool(this, "highlighter"),
      eraser: new EraserTool(this),
      lasso: this.lasso,
      text: new TextTool(this)
    };
    this.ctx = {
      imageUrl: (src) => {
        const f2 = this.resolveImage(src);
        return f2 ? this.app.vault.getResourcePath(f2) : null;
      },
      renderMarkdown: (md, el2) => {
        var _a, _b;
        return import_obsidian2.MarkdownRenderer.render(this.app, md, el2, (_b = (_a = this.file) == null ? void 0 : _a.path) != null ? _b : "", this);
      }
    };
    this.store.onChange((change) => {
      if (change.structure) this.syncPages();
      for (const id of change.pages) this.rerender(id);
      this.lasso.refresh();
      this.updateToolbarState();
      this.requestSave();
    });
    this.registerKeys();
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getIcon() {
    return NOTEBOOK_ICON;
  }
  getDisplayText() {
    return this.file ? notebookTitle(this.file.basename) : "Notebook";
  }
  // Không nhận file theo đuôi: mọi file .md (kể cả .notebook.md) đều đi qua
  // setViewState, nơi open-patch chỉ chuyển .notebook.md sang view này.
  // Trả true ở đây làm Obsidian tái dùng view notebook để mở file .md thường.
  canAcceptExtension(_extension) {
    return false;
  }
  async onLoadFile(file) {
    if (!isNotebookPath(file.path)) {
      window.setTimeout(() => this.leaf.setViewState({ type: "markdown", state: { file: file.path }, active: true }), 0);
      return;
    }
    await super.onLoadFile(file);
  }
  async onUnloadFile(file) {
    if (!isNotebookPath(file.path)) return;
    await super.onUnloadFile(file);
  }
  async save(clear) {
    if (this.file && !isNotebookPath(this.file.path)) return;
    await super.save(clear);
  }
  async onOpen() {
    await super.onOpen();
    this.ensureUI();
  }
  async onClose() {
    var _a, _b;
    (_a = this.picker) == null ? void 0 : _a.close();
    (_b = this.textEditor) == null ? void 0 : _b.finish();
    await super.onClose();
  }
  onResize() {
    var _a;
    if (this.fitWidth) this.fit();
    (_a = this.ruler) == null ? void 0 : _a.layout();
  }
  // ---------- Đọc / ghi file ----------
  getViewData() {
    var _a;
    (_a = this.textEditor) == null ? void 0 : _a.finish();
    if (this.loadError) return this.raw;
    return serializeNotebook(this.store.doc, this.frontmatter);
  }
  setViewData(data, clear) {
    var _a;
    this.ensureUI();
    this.raw = data;
    (_a = this.picker) == null ? void 0 : _a.close();
    this.textEditor = null;
    try {
      const parsed = parseNotebook(data, this.plugin.settings.defaultTemplate);
      this.loadError = null;
      this.frontmatter = parsed.frontmatter;
      this.store.load(parsed.doc);
    } catch (err) {
      console.error("[paper-notebook] Kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c notebook", err);
      this.loadError = err instanceof Error ? err.message : String(err);
    }
    this.showError();
    if (clear) this.currentPageId = null;
    this.rebuildPages();
    if (!this.loadError && data.trim() === "") this.requestSave();
    if (clear && this.fitWidth) window.requestAnimationFrame(() => this.fit());
  }
  clear() {
    this.store.load(newDoc(this.plugin.settings.defaultTemplate));
    this.frontmatter = "";
    this.raw = "";
    this.loadError = null;
    this.lasso.clear();
    this.rebuildPages();
  }
  // ---------- Dựng giao diện ----------
  ensureUI() {
    if (this.ui) return;
    const root = this.contentEl;
    root.empty();
    root.addClass("pn-root");
    root.tabIndex = -1;
    this.addAction("panel-right", "Hi\u1EC7n/\u1EA9n danh s\xE1ch trang", () => this.toggleSidebar());
    this.addAction("file-down", "Export PDF", () => this.plugin.exportPdf(this)).addClass("pn-action-gap");
    this.addAction("zoom-in", "Ph\xF3ng to (Mod+=)", () => this.zoomBy(1.2));
    const zoomLabel = this.addAction("zoom-in", "V\u1EEBa khung (Mod+0)", () => this.fit());
    zoomLabel.empty();
    zoomLabel.addClass("pn-zoom-action");
    this.addAction("zoom-out", "Thu nh\u1ECF (Mod+-)", () => this.zoomBy(1 / 1.2));
    const body = root.createDiv({ cls: "pn-body" });
    const sidebar = body.createDiv({ cls: "pn-sidebar" });
    const stage = body.createDiv({ cls: "pn-stage" });
    const scroller = stage.createDiv({ cls: "pn-scroller" });
    this.ruler = new Ruler(stage, {
      pxPerMm: () => PX_PER_MM * this.zoom,
      onStamp: (edge) => this.stampRuler(edge),
      onWheel: (e2) => {
        var _a;
        if (!this.zoomWheel(e2)) (_a = this.ui) == null ? void 0 : _a.scroller.scrollBy({ left: e2.deltaX, top: e2.deltaY });
      }
    });
    const pages = scroller.createDiv({ cls: "pn-pages" });
    const addPage = pages.createEl("button", { cls: "pn-add-page", attr: { "aria-label": "Th\xEAm trang" } });
    (0, import_obsidian2.setIcon)(addPage, "plus");
    addPage.addEventListener("click", () => this.pickTemplateAndAdd(this.store.doc.pages.length, "glide"));
    const palette = stage.createDiv({ cls: "pn-palette" });
    const toolsRow = palette.createDiv({ cls: "pn-palette-row pn-palette-tools" });
    const toolButtons = /* @__PURE__ */ new Map();
    TOOLS.forEach((t2, i2) => {
      var _a;
      const keys = [String(i2 + 1), (_a = t2.key) == null ? void 0 : _a.toUpperCase()].filter(Boolean).join(" ho\u1EB7c ");
      const btn = toolsRow.createEl("button", { cls: "pn-tool", attr: { "aria-label": `${t2.title} \u2014 ${keys}` } });
      (0, import_obsidian2.setIcon)(btn.createSpan({ cls: "pn-tool-icon" }), t2.icon);
      btn.createSpan({ cls: "pn-tool-key", text: String(i2 + 1) });
      btn.addEventListener("click", () => t2.id === this.toolId ? this.setOptionsOpen(!this.optionsOpen) : this.setTool(t2.id));
      toolButtons.set(t2.id, btn);
      if (t2.id === "hand") toolsRow.createDiv({ cls: "pn-divider" });
    });
    toolsRow.createDiv({ cls: "pn-divider" });
    paletteButton(toolsRow, "image-plus", "Ch\xE8n \u1EA3nh", () => this.pickImage());
    const rulerBtn = paletteButton(toolsRow, "ruler", "Th\u01B0\u1EDBc k\u1EBB (R)", () => this.toggleRuler());
    toolsRow.createDiv({ cls: "pn-divider" });
    const undo = paletteButton(toolsRow, "undo-2", "Ho\xE0n t\xE1c (Mod+Z)", () => this.store.undo());
    const redo = paletteButton(toolsRow, "redo-2", "L\xE0m l\u1EA1i (Mod+Shift+Z)", () => this.store.redo());
    toolsRow.createDiv({ cls: "pn-divider" });
    const collapse = paletteButton(toolsRow, "chevron-down", "M\xE0u v\xE0 c\u1EE1 n\xE9t", () => this.setOptionsOpen(!this.optionsOpen));
    const options = palette.createDiv({ cls: "pn-palette-row pn-palette-options" });
    const pageActions = this.createPageActions();
    const error = root.createDiv({ cls: "pn-error" });
    this.ui = { root, palette, toolButtons, options, collapse, rulerBtn, pageActions, stage, undo, redo, zoomLabel, body, sidebar, scroller, pages, addPage, error };
    root.toggleClass("pn-sidebar-hidden", !this.plugin.settings.showSidebar);
    this.applyZoom();
    this.setTool(this.toolId);
    this.registerInput();
  }
  showError() {
    const ui = this.ui;
    ui.root.toggleClass("pn-has-error", !!this.loadError);
    ui.error.empty();
    if (!this.loadError) return;
    ui.error.createEl("h3", { text: "Kh\xF4ng m\u1EDF \u0111\u01B0\u1EE3c notebook" });
    ui.error.createEl("p", { text: this.loadError });
    ui.error.createEl("p", { text: "File ch\u01B0a b\u1ECB thay \u0111\u1ED5i. B\u1EA1n c\xF3 th\u1EC3 m\u1EDF d\u1EA1ng markdown \u0111\u1EC3 s\u1EEDa ph\u1EA7n ## Notebook Data." });
    const btn = ui.error.createEl("button", { cls: "mod-cta", text: "M\u1EDF d\u1EA1ng markdown" });
    btn.addEventListener("click", () => this.plugin.openAsMarkdown(this.leaf));
  }
  toggleSidebar() {
    const hidden = !this.ui.root.hasClass("pn-sidebar-hidden");
    this.ui.root.toggleClass("pn-sidebar-hidden", hidden);
    this.plugin.settings.showSidebar = !hidden;
    this.plugin.saveSettings();
    if (this.fitWidth) this.fit();
  }
  /** Bảng màu / cỡ nét hiện dạng popover ngay dưới thanh công cụ */
  setOptionsOpen(open) {
    const ui = this.ui;
    if (!ui) return;
    this.optionsOpen = open && ui.options.childElementCount > 0;
    ui.palette.toggleClass("is-open", this.optionsOpen);
    (0, import_obsidian2.setIcon)(ui.collapse, this.optionsOpen ? "chevron-up" : "chevron-down");
  }
  setTool(id) {
    var _a, _b, _c;
    if (id !== this.toolId) {
      (_b = (_a = this.tools[this.toolId]).deactivate) == null ? void 0 : _b.call(_a);
      (_c = this.textEditor) == null ? void 0 : _c.finish();
    }
    this.toolId = id;
    if (id !== "pointer") this.selectPage(null);
    const ui = this.ui;
    for (const [tid, btn] of ui.toolButtons) btn.toggleClass("is-active", tid === id);
    for (const t2 of TOOLS) ui.root.toggleClass(`pn-tool-${t2.id}`, t2.id === id);
    this.renderToolOptions();
    this.setOptionsOpen(false);
  }
  /** Màu của công cụ hiện tại, hiện ở icon và gạch chân dưới icon */
  updateToolColors() {
    const ui = this.ui;
    const colorOf = {
      pen: this.options.pen.color,
      highlighter: this.options.highlighter.color,
      text: this.options.text.color
    };
    for (const [tid, btn] of ui.toolButtons) {
      const c2 = colorOf[tid];
      if (c2) {
        btn.style.setProperty("--pn-tool-color", c2);
        btn.style.setProperty("--pn-tool-icon", isLight(c2) ? "var(--text-normal)" : c2);
      } else {
        btn.style.removeProperty("--pn-tool-color");
        btn.style.removeProperty("--pn-tool-icon");
      }
    }
  }
  /** Hàng dưới của palette: màu và cỡ nét của công cụ đang chọn */
  renderToolOptions() {
    const ui = this.ui;
    if (!ui) return;
    const el2 = ui.options;
    el2.empty();
    this.updateToolColors();
    const id = this.toolId;
    const rerender = () => this.renderToolOptions();
    if (id === "pen" || id === "highlighter") {
      const opts = this.options[id];
      this.colorRow(el2, id === "pen" ? PEN_COLORS : HIGHLIGHTER_COLORS, opts.color, (c2) => {
        opts.color = c2;
        rerender();
      });
      el2.createDiv({ cls: "pn-divider" });
      const sizes = id === "pen" ? PEN_SIZES : HIGHLIGHTER_SIZES;
      this.sizeRow(el2, sizes, opts.size, (s2) => `${s2} mm`, (s2, i2) => 6 + i2 * 4, (s2) => {
        opts.size = s2;
        rerender();
      });
    } else if (id === "eraser") {
      this.sizeRow(el2, ERASER_SIZES, this.options.eraser.size, (s2) => `T\u1EA9y ${s2}px`, (s2, i2) => 6 + i2 * 4, (s2) => {
        this.options.eraser.size = s2;
        rerender();
      }, true);
    } else if (id === "text") {
      const opts = this.options.text;
      this.colorRow(el2, PEN_COLORS, opts.color, (c2) => {
        opts.color = c2;
        rerender();
      });
      el2.createDiv({ cls: "pn-divider" });
      const step = (dir) => {
        const i2 = FONT_SIZES.indexOf(opts.fontSize);
        opts.fontSize = FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, (i2 < 0 ? 1 : i2) + dir))];
        rerender();
      };
      paletteButton(el2, "a-arrow-down", "Ch\u1EEF nh\u1ECF h\u01A1n", () => step(-1));
      el2.createSpan({ cls: "pn-font-size", text: `${opts.fontSize} pt` });
      paletteButton(el2, "a-arrow-up", "Ch\u1EEF to h\u01A1n", () => step(1));
    } else if (id === "pointer") {
      el2.createSpan({ cls: "pn-hint", text: "B\u1EA5m v\xE0o m\u1ED9t trang \u0111\u1EC3 ch\u1ECDn, r\u1ED3i ch\xE8n tr\xEAn / d\u01B0\u1EDBi, nh\xE2n b\u1EA3n ho\u1EB7c xo\xE1" });
    } else if (id === "hand") {
      el2.createSpan({ cls: "pn-hint", text: "K\xE9o \u0111\u1EC3 di chuy\u1EC3n. \u1EDE c\xF4ng c\u1EE5 kh\xE1c, gi\u1EEF Space ho\u1EB7c k\xE9o chu\u1ED9t gi\u1EEFa" });
    } else if (id === "lasso") {
      if (this.lasso.selection) {
        this.colorRow(el2, PEN_COLORS, null, (c2) => this.lasso.setColor(c2));
        el2.createDiv({ cls: "pn-divider" });
        paletteButton(el2, "copy", "Nh\xE2n b\u1EA3n (Mod+D)", () => this.duplicateSelection());
        paletteButton(el2, "trash-2", "Xo\xE1 (Delete)", () => this.lasso.deleteSelection());
      } else {
        el2.createSpan({ cls: "pn-hint", text: "Khoanh v\xF9ng ho\u1EB7c b\u1EA5m v\xE0o n\xE9t \u0111\u1EC3 ch\u1ECDn" });
      }
    }
  }
  colorRow(el2, colors, active, onPick) {
    const list = active && !colors.includes(active) ? [...colors, active] : colors;
    for (const c2 of list) {
      const b2 = el2.createEl("button", { cls: "pn-color", attr: { "aria-label": c2 } });
      b2.style.setProperty("--pn-swatch", c2);
      if (c2 === active) {
        b2.addClass("is-active");
        const check = b2.createSpan({ cls: "pn-color-check" });
        (0, import_obsidian2.setIcon)(check, "check");
        check.style.color = isLight(c2) ? "#1a1a1a" : "#ffffff";
      }
      b2.addEventListener("click", () => onPick(c2));
    }
    const add = el2.createEl("button", { cls: "pn-color-add", attr: { "aria-label": "M\xE0u kh\xE1c" } });
    (0, import_obsidian2.setIcon)(add, "plus");
    const input = add.createEl("input", { attr: { type: "color", tabindex: "-1" } });
    input.value = active && /^#[0-9a-f]{6}$/i.test(active) ? active : "#000000";
    input.addEventListener("click", (e2) => e2.stopPropagation());
    input.addEventListener("change", () => onPick(input.value));
    add.addEventListener("click", () => input.click());
  }
  sizeRow(el2, sizes, active, label, dotPx, onPick, hollow = false) {
    sizes.forEach((s2, i2) => {
      const b2 = el2.createEl("button", { cls: "pn-size", attr: { "aria-label": label(s2) } });
      const dot = b2.createSpan({ cls: hollow ? "pn-size-dot is-hollow" : "pn-size-dot" });
      dot.style.width = dot.style.height = `${dotPx(s2, i2)}px`;
      b2.toggleClass("is-active", s2 === active);
      b2.addEventListener("click", () => onPick(s2));
    });
  }
  updateToolbarState() {
    const ui = this.ui;
    if (!ui) return;
    ui.undo.toggleClass("is-disabled", !this.store.canUndo);
    ui.redo.toggleClass("is-disabled", !this.store.canRedo);
    ui.sidebar.querySelectorAll(".pn-thumb").forEach((t2) => {
      t2.toggleClass("is-active", t2.getAttribute("data-page-id") === this.currentPageId);
    });
  }
  // ---------- Trang ----------
  rebuildPages() {
    for (const pv of this.pageViews.values()) pv.item.remove();
    this.pageViews.clear();
    this.hidden.clear();
    this.lasso.clear();
    if (!this.loadError) this.syncPages();
    else this.ui.sidebar.empty();
    this.updateToolbarState();
  }
  /** Đồng bộ danh sách trang trên màn hình với dữ liệu (thêm/xoá/đổi thứ tự) */
  syncPages() {
    var _a, _b;
    const ui = this.ui;
    const pages = this.store.doc.pages;
    for (const [id, pv] of this.pageViews) {
      if (!pages.some((p2) => p2.id === id)) {
        pv.item.remove();
        this.pageViews.delete(id);
        this.hidden.delete(id);
      }
    }
    pages.forEach((page, i2) => {
      let pv = this.pageViews.get(page.id);
      if (!pv) {
        pv = this.createPageView(page.id);
        this.pageViews.set(page.id, pv);
        this.rerender(page.id);
      }
      ui.pages.insertBefore(pv.item, ui.addPage);
      setPageNumber(pv.layers, this.plugin.settings.showPageNumbers ? i2 + 1 : null);
    });
    if (!this.currentPageId || !this.pageViews.has(this.currentPageId)) this.currentPageId = (_b = (_a = pages[0]) == null ? void 0 : _a.id) != null ? _b : null;
    this.syncThumbs();
    this.selectPage(this.selectedPageId);
  }
  createPageView(pageId) {
    const item = createDiv({ cls: "pn-page-item" });
    const wrap = item.createDiv({ cls: "pn-page-wrap", attr: { "data-page-id": pageId } });
    const layers = createPageLayers();
    wrap.appendChild(layers.root);
    const overlay = document.createElementNS(SVG_NS3, "svg");
    overlay.setAttribute("class", "pn-layer pn-overlay");
    overlay.setAttribute("viewBox", `0 0 ${PAGE_W} ${PAGE_H}`);
    overlay.setAttribute("preserveAspectRatio", "none");
    layers.root.appendChild(overlay);
    return { id: pageId, item, wrap, layers, overlay };
  }
  rerender(pageId) {
    const pv = this.pageViews.get(pageId);
    const page = this.store.page(pageId);
    if (!pv || !page) return;
    renderPage(pv.layers, page, this.ctx, this.hidden.get(pageId)).catch(
      (err) => console.error("[paper-notebook] L\u1ED7i khi v\u1EBD trang", err)
    );
    this.scheduleThumb(pageId);
  }
  pageView(pageId) {
    return this.pageViews.get(pageId);
  }
  hiddenOn(pageId) {
    let set = this.hidden.get(pageId);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.hidden.set(pageId, set);
    }
    return set;
  }
  /**
   * reveal: cách đưa trang mới vào tầm nhìn
   *  - "scroll": cuộn tới trang mới (chèn trên/dưới, menu chuột phải)
   *  - "glide":  cuộn từ từ xuống trang mới (nút ⊕ cuối notebook)
   *  - "stay":   giữ nguyên chỗ đang xem, không hiệu ứng (nút ⊕ ở thanh thumbnail)
   */
  addPage(index, template, reveal = "scroll") {
    const page = newPage(template != null ? template : this.plugin.settings.defaultTemplate);
    const scroller = this.ui.scroller;
    const keepTop = scroller.scrollTop;
    this.store.commit([{ type: "addPage", index, page }]);
    if (reveal === "scroll") this.scrollToPage(page.id);
    else {
      scroller.scrollTop = keepTop;
      if (reveal === "glide") this.glideToPage(page.id);
    }
    if (this.toolId === "pointer") this.selectPage(page.id);
  }
  /** Cuộn từ từ từ chỗ đang xem xuống tới đầu trang mới */
  glideToPage(pageId) {
    const pv = this.pageViews.get(pageId);
    const scroller = this.ui.scroller;
    if (!pv) return;
    this.currentPageId = pageId;
    this.updateToolbarState();
    const from = scroller.scrollTop;
    const offset = pv.item.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    const to = Math.max(0, Math.min(from + offset - SCROLL_TOP_GAP, scroller.scrollHeight - scroller.clientHeight));
    this.stopGlide();
    if (Math.abs(to - from) < 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scroller.scrollTop = to;
      return;
    }
    const duration = Math.min(1100, 450 + Math.abs(to - from) * 0.4);
    const start = performance.now();
    const ease = (t2) => 1 - Math.pow(1 - t2, 3);
    const step = (now) => {
      const t2 = Math.min(1, (now - start) / duration);
      scroller.scrollTop = from + (to - from) * ease(t2);
      this.glide = t2 < 1 ? window.requestAnimationFrame(step) : null;
    };
    this.glide = window.requestAnimationFrame(step);
  }
  /** Dừng tự cuộn (khi người dùng tự cuộn hoặc bắt đầu tự cuộn tới trang khác) */
  stopGlide() {
    if (this.glide !== null) window.cancelAnimationFrame(this.glide);
    this.glide = null;
  }
  /** Hỏi loại giấy bằng hộp thoại của notebook rồi mới thêm trang */
  pickTemplateAndAdd(index, reveal = "scroll") {
    this.openPicker({ title: "Ch\u1ECDn lo\u1EA1i gi\u1EA5y", current: null, onPick: (template) => this.addPage(index, template, reveal) });
  }
  /** Hộp thoại chọn giấy phủ lên khung notebook (không dùng Modal của Obsidian) */
  openPicker(opts) {
    var _a, _b;
    if (!this.ui) return;
    (_a = this.picker) == null ? void 0 : _a.close();
    (_b = this.textEditor) == null ? void 0 : _b.finish();
    this.setOptionsOpen(false);
    const handle = openPaperPicker(this.ui.root, {
      ...opts,
      onClose: () => {
        if (this.picker === handle) this.picker = null;
      }
    });
    this.picker = handle;
  }
  pageMenu(pageId, evt) {
    const index = this.store.pageIndex(pageId);
    const page = this.store.page(pageId);
    if (!page) return;
    const count = this.store.doc.pages.length;
    const menu = new import_obsidian2.Menu();
    menu.addItem((i2) => i2.setTitle("Th\xEAm trang ph\xEDa sau").setIcon("file-plus").onClick(() => this.pickTemplateAndAdd(index + 1)));
    menu.addItem((i2) => i2.setTitle("Nh\xE2n b\u1EA3n trang").setIcon("copy").onClick(() => this.duplicatePage(pageId)));
    menu.addSeparator();
    for (const t2 of TEMPLATES) {
      menu.addItem(
        (i2) => i2.setTitle(t2.label).setChecked(page.template === t2.id).onClick(() => this.store.commit([{ type: "setTemplate", pageId, template: t2.id }]))
      );
    }
    menu.addSeparator();
    menu.addItem(
      (i2) => i2.setTitle("Chuy\u1EC3n l\xEAn tr\xEAn").setIcon("arrow-up").setDisabled(index === 0).onClick(() => this.store.commit([{ type: "movePage", from: index, to: index - 1 }]))
    );
    menu.addItem(
      (i2) => i2.setTitle("Chuy\u1EC3n xu\u1ED1ng d\u01B0\u1EDBi").setIcon("arrow-down").setDisabled(index === count - 1).onClick(() => this.store.commit([{ type: "movePage", from: index, to: index + 1 }]))
    );
    menu.addSeparator();
    menu.addItem(
      (i2) => i2.setTitle("Xo\xE1 trang").setIcon("trash-2").setWarning(true).setDisabled(count <= 1).onClick(() => this.deletePage(pageId))
    );
    menu.showAtMouseEvent(evt);
  }
  // ---------- Chọn trang (công cụ con trỏ) ----------
  /** Thanh thao tác nổi ở đầu trang đang chọn */
  createPageActions() {
    const bar = createDiv({ cls: "pn-page-actions" });
    const label = bar.createSpan({ cls: "pn-page-actions-label" });
    bar.createDiv({ cls: "pn-divider" });
    const action = (icon, text, onClick) => {
      const btn = bar.createEl("button", { attr: { "aria-label": text } });
      (0, import_obsidian2.setIcon)(btn.createSpan({ cls: "pn-page-action-icon" }), icon);
      btn.createSpan({ text });
      btn.addEventListener("click", () => this.selectedPageId && onClick());
      return btn;
    };
    action("arrow-up-to-line", "Ch\xE8n tr\xEAn", () => this.pickTemplateAndAdd(this.store.pageIndex(this.selectedPageId)));
    action("arrow-down-to-line", "Ch\xE8n d\u01B0\u1EDBi", () => this.pickTemplateAndAdd(this.store.pageIndex(this.selectedPageId) + 1));
    bar.createDiv({ cls: "pn-divider" });
    action("copy", "Nh\xE2n b\u1EA3n", () => this.duplicatePage(this.selectedPageId));
    action("layout-template", "Lo\u1EA1i gi\u1EA5y", () => this.changeTemplate(this.selectedPageId));
    bar.createDiv({ cls: "pn-divider" });
    const remove = action("trash-2", "Xo\xE1", () => this.deletePage(this.selectedPageId));
    remove.addClass("mod-danger");
    bar.addEventListener("pointerdown", (e2) => e2.stopPropagation());
    return { bar, label, remove };
  }
  selectPage(pageId) {
    const ui = this.ui;
    if (!ui) return;
    this.selectedPageId = pageId && this.pageViews.has(pageId) ? pageId : null;
    for (const pv of this.pageViews.values()) pv.item.toggleClass("is-selected", pv.id === this.selectedPageId);
    const { bar, label, remove } = ui.pageActions;
    if (!this.selectedPageId) {
      bar.detach();
      return;
    }
    if (bar.parentElement !== ui.stage) ui.stage.appendChild(bar);
    label.setText(`Trang ${this.store.pageIndex(this.selectedPageId) + 1}`);
    remove.toggleClass("is-disabled", this.store.doc.pages.length <= 1);
    if (this.currentPageId !== this.selectedPageId) {
      this.currentPageId = this.selectedPageId;
      this.updateToolbarState();
    }
  }
  duplicatePage(pageId) {
    const page = this.store.page(pageId);
    if (!page) return;
    const copy = clone(page);
    copy.id = newId();
    for (const el2 of copy.elements) el2.id = newId();
    this.store.commit([{ type: "addPage", index: this.store.pageIndex(pageId) + 1, page: copy }]);
    this.scrollToPage(copy.id);
    if (this.toolId === "pointer") this.selectPage(copy.id);
  }
  deletePage(pageId) {
    const index = this.store.pageIndex(pageId);
    if (index < 0 || this.store.doc.pages.length <= 1) return;
    this.store.commit([{ type: "removePage", index }]);
    new import_obsidian2.Notice("\u0110\xE3 xo\xE1 trang. B\u1EA5m Mod+Z \u0111\u1EC3 ho\xE0n t\xE1c.");
  }
  changeTemplate(pageId) {
    const page = this.store.page(pageId);
    if (!page) return;
    this.openPicker({
      title: "\u0110\u1ED5i lo\u1EA1i gi\u1EA5y",
      current: page.template,
      badge: "\u0110ang d\xF9ng",
      onPick: (template) => {
        if (template !== page.template) this.store.commit([{ type: "setTemplate", pageId, template }]);
      }
    });
  }
  /** Cuộn tới trang, chừa một khoảng để thấy mép trên của tờ giấy */
  scrollToPage(pageId) {
    this.glideToPage(pageId);
  }
  /** Trang hiện tại = trang chiếm phần trên của khung nhìn */
  updateCurrentPage() {
    if (this.glide !== null) return;
    const scroller = this.ui.scroller.getBoundingClientRect();
    const probe = scroller.top + scroller.height / 3;
    for (const pv of this.pageViews.values()) {
      const r2 = pv.item.getBoundingClientRect();
      if (r2.top <= probe && r2.bottom >= probe) {
        if (this.currentPageId !== pv.id) {
          this.currentPageId = pv.id;
          this.updateToolbarState();
        }
        return;
      }
    }
  }
  // ---------- Thumbnail ----------
  syncThumbs() {
    const sidebar = this.ui.sidebar;
    sidebar.empty();
    this.store.doc.pages.forEach((page, i2) => {
      const thumb = sidebar.createDiv({ cls: "pn-thumb", attr: { "data-page-id": page.id, draggable: "true" } });
      thumb.createDiv({ cls: "pn-thumb-page" });
      thumb.createDiv({ cls: "pn-thumb-num", text: String(i2 + 1) });
      thumb.addEventListener("click", () => {
        this.scrollToPage(page.id);
        if (this.toolId === "pointer") this.selectPage(page.id);
      });
      thumb.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        this.pageMenu(page.id, evt);
      });
      thumb.addEventListener("dragstart", (evt) => {
        var _a;
        (_a = evt.dataTransfer) == null ? void 0 : _a.setData("text/x-pn-page", page.id);
        thumb.addClass("is-dragging");
      });
      thumb.addEventListener("dragend", () => thumb.removeClass("is-dragging"));
      thumb.addEventListener("dragover", (evt) => {
        var _a;
        if (!((_a = evt.dataTransfer) == null ? void 0 : _a.types.includes("text/x-pn-page"))) return;
        evt.preventDefault();
        thumb.addClass("is-drop-target");
      });
      thumb.addEventListener("dragleave", () => thumb.removeClass("is-drop-target"));
      thumb.addEventListener("drop", (evt) => {
        var _a, _b;
        thumb.removeClass("is-drop-target");
        const from = this.store.pageIndex((_b = (_a = evt.dataTransfer) == null ? void 0 : _a.getData("text/x-pn-page")) != null ? _b : "");
        const to = this.store.pageIndex(page.id);
        if (from < 0 || to < 0 || from === to) return;
        evt.preventDefault();
        this.store.commit([{ type: "movePage", from, to }]);
      });
      this.fillThumb(page.id);
    });
    const add = sidebar.createEl("button", { cls: "pn-add-page pn-thumb-add", attr: { "aria-label": "Th\xEAm trang" } });
    (0, import_obsidian2.setIcon)(add, "plus");
    add.addEventListener("click", () => this.pickTemplateAndAdd(this.store.doc.pages.length, "stay"));
    this.updateToolbarState();
  }
  scheduleThumb(pageId) {
    window.clearTimeout(this.thumbTimers.get(pageId));
    this.thumbTimers.set(
      pageId,
      window.setTimeout(() => this.fillThumb(pageId), 400)
    );
  }
  fillThumb(pageId) {
    var _a;
    const pv = this.pageViews.get(pageId);
    const box = (_a = this.ui) == null ? void 0 : _a.sidebar.querySelector(`.pn-thumb[data-page-id="${pageId}"] .pn-thumb-page`);
    if (!pv || !box) return;
    const copy = pv.layers.root.cloneNode(true);
    copy.querySelectorAll(".pn-overlay, .pn-text-editor").forEach((n2) => n2.remove());
    box.replaceChildren(copy);
  }
  // ---------- Zoom ----------
  applyZoom() {
    var _a;
    const ui = this.ui;
    ui.root.style.setProperty("--pn-zoom", String(this.zoom));
    ui.zoomLabel.setText(`${Math.round(this.zoom * 100)}%`);
    (_a = this.ruler) == null ? void 0 : _a.layout();
  }
  setZoom(zoom, anchor) {
    const ui = this.ui;
    const z2 = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const s2 = ui.scroller;
    const rect = s2.getBoundingClientRect();
    const ax = anchor ? anchor.clientX - rect.left : s2.clientWidth / 2;
    const ay = anchor ? anchor.clientY - rect.top : s2.clientHeight / 2;
    const cx = (s2.scrollLeft + ax) / this.zoom;
    const cy = (s2.scrollTop + ay) / this.zoom;
    this.zoom = z2;
    this.applyZoom();
    s2.scrollLeft = cx * z2 - ax;
    s2.scrollTop = cy * z2 - ay;
    this.lasso.refresh();
  }
  /** Ctrl/Cmd + cuộn (hoặc pinch trackpad) thì zoom; trả về true nếu đã zoom */
  zoomWheel(e2) {
    this.stopGlide();
    if (!e2.ctrlKey && !e2.metaKey) return false;
    this.fitWidth = false;
    const delta = Math.max(-ZOOM_WHEEL_MAX_DELTA, Math.min(ZOOM_WHEEL_MAX_DELTA, e2.deltaY));
    this.setZoom(this.zoom * Math.exp(-delta * ZOOM_WHEEL_SPEED), e2);
    return true;
  }
  zoomBy(factor) {
    this.fitWidth = false;
    this.setZoom(this.zoom * factor);
  }
  fit() {
    const ui = this.ui;
    if (!ui || ui.scroller.clientWidth === 0) return;
    this.fitWidth = true;
    const z2 = (ui.scroller.clientWidth - 48) / (PAGE_W * PX_PER_MM);
    this.setZoom(Math.min(FIT_MAX_ZOOM, z2));
  }
  pxToMm(px) {
    return px / (PX_PER_MM * this.zoom);
  }
  // ---------- Nhập liệu ----------
  toPt(pv, e2) {
    const r2 = pv.layers.root.getBoundingClientRect();
    return { x: (e2.clientX - r2.left) / r2.width * PAGE_W, y: (e2.clientY - r2.top) / r2.height * PAGE_H };
  }
  pageViewAt(target) {
    var _a;
    const wrap = (_a = target == null ? void 0 : target.closest) == null ? void 0 : _a.call(target, ".pn-page-wrap");
    const id = wrap == null ? void 0 : wrap.getAttribute("data-page-id");
    return id ? this.pageViews.get(id) : void 0;
  }
  registerInput() {
    const ui = this.ui;
    this.registerDomEvent(ui.pages, "pointerdown", (e2) => {
      var _a;
      if (this.loadError || this.pan || this.picker) return;
      if (this.active) finish(e2);
      if (e2.pointerType === "mouse" && e2.button !== 0) return;
      if (this.toolId === "hand" || this.spaceHeld) return;
      if (e2.pointerType === "touch") return;
      const pv = this.pageViewAt(e2.target);
      if (!pv) return;
      e2.preventDefault();
      if (this.app.workspace.activeLeaf !== this.leaf) this.app.workspace.setActiveLeaf(this.leaf, { focus: true });
      (_a = this.textEditor) == null ? void 0 : _a.finish();
      this.setOptionsOpen(false);
      if (this.toolId !== "text") ui.root.focus({ preventScroll: true });
      if (this.currentPageId !== pv.id) {
        this.currentPageId = pv.id;
        this.updateToolbarState();
      }
      if (this.toolId === "pointer") {
        this.selectPage(pv.id);
        return;
      }
      pv.wrap.setPointerCapture(e2.pointerId);
      this.active = { pv, pointerId: e2.pointerId };
      this.tools[this.toolId].down(pv, this.toPt(pv, e2), e2);
    });
    this.registerDomEvent(ui.pages, "pointermove", (e2) => {
      var _a;
      const active = this.active;
      if (!active || active.pointerId !== e2.pointerId) return;
      if (e2.buttons === 0) return finish(e2);
      const tool = this.tools[this.toolId];
      const events = typeof e2.getCoalescedEvents === "function" ? e2.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e2]) (_a = tool.move) == null ? void 0 : _a.call(tool, active.pv, this.toPt(active.pv, ev), ev);
    });
    const finish = (e2) => {
      var _a, _b;
      const active = this.active;
      if (!active) return;
      this.active = null;
      if (active.pv.wrap.hasPointerCapture(active.pointerId)) active.pv.wrap.releasePointerCapture(active.pointerId);
      (_b = (_a = this.tools[this.toolId]).up) == null ? void 0 : _b.call(_a, active.pv, this.toPt(active.pv, e2), e2);
    };
    const end = (e2) => {
      if (this.active && this.active.pointerId === e2.pointerId) finish(e2);
    };
    this.registerDomEvent(ui.pages, "pointerup", end);
    this.registerDomEvent(ui.pages, "pointercancel", end);
    this.registerDomEvent(window, "pointerup", end, { capture: true });
    this.registerDomEvent(window, "pointercancel", end, { capture: true });
    this.registerDomEvent(ui.pages, "lostpointercapture", end);
    this.registerDomEvent(ui.pages, "contextmenu", (e2) => {
      const pv = this.pageViewAt(e2.target);
      if (!pv) return;
      e2.preventDefault();
      this.pageMenu(pv.id, e2);
    });
    this.registerDomEvent(ui.pages, "dblclick", (e2) => {
      const pv = this.pageViewAt(e2.target);
      if (!pv || this.toolId !== "lasso") return;
      const text = this.textAt(pv, this.toPt(pv, e2));
      if (text) this.editText(pv, text.id);
    });
    this.registerDomEvent(ui.scroller, "pointerdown", (e2) => {
      this.stopGlide();
      const target = e2.target;
      if (target.closest(".pn-page-actions, .pn-add-page")) return;
      const panning = this.toolId === "hand" || this.spaceHeld || e2.pointerType === "mouse" && e2.button === 1;
      if (!panning) {
        if (this.toolId === "pointer" && !this.pageViewAt(target)) this.selectPage(null);
        return;
      }
      if (e2.pointerType === "touch" || this.active) return;
      e2.preventDefault();
      ui.scroller.setPointerCapture(e2.pointerId);
      this.pan = { pointerId: e2.pointerId, x: e2.clientX, y: e2.clientY, left: ui.scroller.scrollLeft, top: ui.scroller.scrollTop };
      ui.root.addClass("pn-panning");
    });
    this.registerDomEvent(ui.scroller, "pointermove", (e2) => {
      const pan = this.pan;
      if (!pan || pan.pointerId !== e2.pointerId) return;
      if (e2.buttons === 0) return stopPan();
      ui.scroller.scrollLeft = pan.left - (e2.clientX - pan.x);
      ui.scroller.scrollTop = pan.top - (e2.clientY - pan.y);
    });
    const stopPan = () => {
      if (!this.pan) return;
      if (ui.scroller.hasPointerCapture(this.pan.pointerId)) ui.scroller.releasePointerCapture(this.pan.pointerId);
      this.pan = null;
      ui.root.removeClass("pn-panning");
    };
    const endPan = (e2) => {
      if (this.pan && this.pan.pointerId === e2.pointerId) stopPan();
    };
    this.registerDomEvent(ui.scroller, "pointerup", endPan);
    this.registerDomEvent(ui.scroller, "pointercancel", endPan);
    this.registerDomEvent(ui.scroller, "lostpointercapture", endPan);
    this.registerDomEvent(window, "pointerup", endPan);
    this.registerDomEvent(window, "blur", stopPan);
    const setSpace = (held) => {
      this.spaceHeld = held;
      ui.root.toggleClass("pn-space-pan", held);
    };
    this.registerDomEvent(window, "keydown", (e2) => {
      if (e2.code !== "Space" || isTyping(e2.target) || this.app.workspace.getActiveViewOfType(_NotebookView) !== this) return;
      e2.preventDefault();
      if (!this.spaceHeld) setSpace(true);
    });
    this.registerDomEvent(window, "keyup", (e2) => {
      if (e2.code === "Space" && this.spaceHeld) setSpace(false);
    });
    this.registerDomEvent(window, "blur", () => this.spaceHeld && setSpace(false));
    this.registerDomEvent(
      ui.scroller,
      "wheel",
      (e2) => {
        if (this.zoomWheel(e2)) e2.preventDefault();
      },
      { passive: false }
    );
    let ticking = false;
    this.registerDomEvent(ui.scroller, "scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        this.updateCurrentPage();
      });
    });
    this.registerDomEvent(ui.pages, "dragover", (e2) => {
      var _a;
      if (((_a = e2.dataTransfer) == null ? void 0 : _a.types.includes("Files")) || this.draggedVaultImage()) {
        e2.preventDefault();
        if (e2.dataTransfer) e2.dataTransfer.dropEffect = "copy";
      }
    });
    this.registerDomEvent(ui.pages, "drop", (e2) => {
      var _a, _b;
      const pv = this.pageViewAt(e2.target);
      if (!pv) return;
      const at = this.toPt(pv, e2);
      const files = Array.from((_b = (_a = e2.dataTransfer) == null ? void 0 : _a.files) != null ? _b : []).filter((f2) => f2.type.startsWith("image/"));
      const vaultImage = this.draggedVaultImage();
      if (files.length) {
        e2.preventDefault();
        this.insertImageFiles(files, pv.id, at);
      } else if (vaultImage) {
        e2.preventDefault();
        this.addImageElement(vaultImage, pv.id, at);
      }
    });
    this.registerDomEvent(this.containerEl, "copy", (e2) => {
      if (isTyping(e2.target) || !this.lasso.selection) return;
      e2.preventDefault();
      this.copySelection(e2.clipboardData);
    });
    this.registerDomEvent(this.containerEl, "cut", (e2) => {
      if (isTyping(e2.target) || !this.lasso.selection) return;
      e2.preventDefault();
      this.copySelection(e2.clipboardData);
      this.lasso.deleteSelection();
    });
    this.registerDomEvent(this.containerEl, "paste", (e2) => {
      if (isTyping(e2.target) || this.loadError) return;
      const data = e2.clipboardData;
      if (!data) return;
      const pageId = this.currentPageId;
      if (!pageId) return;
      const files = Array.from(data.files).filter((f2) => f2.type.startsWith("image/"));
      const text = data.getData("text/plain");
      e2.preventDefault();
      if (files.length) this.insertImageFiles(files, pageId);
      else if (text === CLIP_MARKER && clipboard) this.pasteElements(pageId);
      else if (text.trim()) this.pasteText(pageId, text);
    });
  }
  registerKeys() {
    const scope = new import_obsidian2.Scope(this.app.scope);
    this.scope = scope;
    const when = (fn) => (evt) => {
      if (isTyping(evt.target) || this.loadError || this.picker) return true;
      fn();
      return false;
    };
    scope.register(["Mod"], "z", when(() => this.store.undo()));
    scope.register(["Mod", "Shift"], "z", when(() => this.store.redo()));
    scope.register(["Mod"], "y", when(() => this.store.redo()));
    const deleteSelected = () => {
      if (this.toolId === "pointer" && this.selectedPageId) this.deletePage(this.selectedPageId);
      else this.lasso.deleteSelection();
    };
    scope.register([], "Delete", when(deleteSelected));
    scope.register([], "Backspace", when(deleteSelected));
    scope.register([], "Escape", when(() => {
      if (this.optionsOpen) this.setOptionsOpen(false);
      else if (this.selectedPageId) this.selectPage(null);
      else this.lasso.clear();
    }));
    scope.register(["Mod"], "d", when(() => {
      if (this.toolId === "pointer" && this.selectedPageId) this.duplicatePage(this.selectedPageId);
      else this.duplicateSelection();
    }));
    scope.register(["Mod"], "=", when(() => this.zoomBy(1.2)));
    scope.register(["Mod"], "-", when(() => this.zoomBy(1 / 1.2)));
    scope.register(["Mod"], "0", when(() => this.fit()));
    for (const t2 of TOOLS) if (t2.key) scope.register([], t2.key, when(() => this.setTool(t2.id)));
    TOOLS.forEach((t2, i2) => scope.register([], String(i2 + 1), when(() => this.setTool(t2.id))));
    scope.register([], "r", when(() => this.toggleRuler()));
  }
  // ---------- Text ----------
  editText(pv, elementId, at) {
    var _a;
    (_a = this.textEditor) == null ? void 0 : _a.finish();
    const existing = elementId ? this.store.element(pv.id, elementId) : at ? this.textAt(pv, at) : null;
    if (existing && existing.type === "text") {
      const hidden = this.hiddenOn(pv.id);
      hidden.add(existing.id);
      this.rerender(pv.id);
      this.lasso.clear();
      this.textEditor = new TextEditor(this.store, pv, clone(existing), false, () => {
        hidden.delete(existing.id);
        this.textEditor = null;
        this.rerender(pv.id);
      });
    } else if (at) {
      this.textEditor = TextEditor.create(
        this.store,
        pv,
        at,
        this.options.text,
        (el2) => this.snapText(pv.id, el2, el2.x, el2.y),
        () => this.textEditor = null
      );
    }
  }
  textAt(pv, pt) {
    const page = this.store.page(pv.id);
    if (!page) return null;
    for (let i2 = page.elements.length - 1; i2 >= 0; i2--) {
      const el2 = page.elements[i2];
      if (el2.type !== "text") continue;
      const b2 = this.elementBounds(pv, el2);
      if (pt.x >= b2.x && pt.x <= b2.x + b2.w && pt.y >= b2.y && pt.y <= b2.y + b2.h) return el2;
    }
    return null;
  }
  // ---------- Thước kẻ ----------
  toggleRuler() {
    if (!this.ruler || !this.ui) return;
    this.ruler.toggle();
    this.ui.rulerBtn.toggleClass("is-active", this.ruler.visible);
  }
  rulerEdges(pv, strokeSize) {
    var _a, _b;
    const edges = (_b = (_a = this.ruler) == null ? void 0 : _a.currentEdges()) != null ? _b : [];
    if (edges.length === 0) return [];
    const mmPerPx = PAGE_W / pv.layers.root.getBoundingClientRect().width;
    return edges.map((e2) => {
      const c2 = this.toPt(pv, { clientX: e2.center.x, clientY: e2.center.y });
      return {
        p0: { x: c2.x + e2.outward.x * strokeSize / 2, y: c2.y + e2.outward.y * strokeSize / 2 },
        dir: e2.dir,
        outward: e2.outward,
        half: e2.half * mmPerPx,
        thickness: e2.depth * mmPerPx,
        extend: e2.extend
      };
    });
  }
  /** Bấm đúp vào thước: kẻ một đường thẳng dọc mép thước lên trang nằm dưới thước */
  stampRuler(edge) {
    const kind = this.toolId === "highlighter" ? "highlighter" : "pen";
    const opts = this.options[kind];
    const pv = [...this.pageViews.values()].find((p2) => {
      const r2 = p2.layers.root.getBoundingClientRect();
      return edge.center.x >= r2.left && edge.center.x <= r2.right && edge.center.y >= r2.top && edge.center.y <= r2.bottom;
    });
    if (!pv) {
      new import_obsidian2.Notice("\u0110\u1EB7t th\u01B0\u1EDBc l\xEAn m\u1ED9t trang gi\u1EA5y r\u1ED3i b\u1EA5m \u0111\xFAp \u0111\u1EC3 k\u1EBB.");
      return;
    }
    const ends = [-1, 1].map(
      (s2) => this.toPt(pv, {
        clientX: edge.center.x + edge.dir.x * edge.half * s2,
        clientY: edge.center.y + edge.dir.y * edge.half * s2
      })
    );
    const off = { x: edge.outward.x * opts.size / 2, y: edge.outward.y * opts.size / 2 };
    const seg = clipToPage(
      { x: ends[0].x + off.x, y: ends[0].y + off.y },
      { x: ends[1].x + off.x, y: ends[1].y + off.y }
    );
    if (!seg) return;
    const [a2, b2] = seg;
    const steps = Math.max(2, Math.ceil(Math.hypot(b2.x - a2.x, b2.y - a2.y)));
    const points = [];
    for (let i2 = 0; i2 <= steps; i2++) {
      points.push([a2.x + (b2.x - a2.x) * i2 / steps, a2.y + (b2.y - a2.y) * i2 / steps, 0.5]);
    }
    this.store.commit([
      {
        type: "addElement",
        pageId: pv.id,
        element: { id: newId(), type: "stroke", tool: kind, color: opts.color, size: opts.size, realPressure: false, points }
      }
    ]);
  }
  // ---------- Căn chữ vào đường kẻ ----------
  snapText(pageId, el2, x2, y2) {
    const page = this.store.page(pageId);
    const rhythm = page ? paperRhythm(page.template) : null;
    if (!rhythm) return { x: x2, y: y2 };
    const lineHeight = textLineHeight(el2.fontSize, rhythm);
    const baseline = this.baselineOffset(el2.fontSize, lineHeight);
    const k2 = Math.round((y2 + baseline + rhythm.inset - rhythm.first) / rhythm.gap);
    let ny = rhythm.first + k2 * rhythm.gap - rhythm.inset - baseline;
    while (ny < 0) ny += rhythm.gap;
    let nx = x2;
    if (rhythm.snapX) nx = Math.round(x2 / rhythm.snapX) * rhythm.snapX;
    else if (rhythm.marginX !== void 0 && Math.abs(x2 - (rhythm.marginX + 2)) < 4) nx = rhythm.marginX + 2;
    return { x: Math.max(0, Math.min(nx, PAGE_W - 5)), y: Math.min(ny, PAGE_H - lineHeight) };
  }
  /** Khoảng cách (mm) từ mép trên hộp chữ tới chân chữ dòng đầu — đo thật bằng font đang dùng */
  baselineOffset(fontSize, lineHeight) {
    const key = `${fontSize}/${lineHeight}`;
    const cached = this.baselineCache.get(key);
    if (cached !== void 0) return cached;
    const probe = this.contentEl.createDiv({ cls: "pn-page pn-probe" });
    const line = probe.createDiv({ cls: "pn-text" });
    line.style.fontSize = `${fontSize}pt`;
    line.style.lineHeight = `${lineHeight}mm`;
    line.appendText("Ag");
    const mark = line.createSpan();
    mark.style.display = "inline-block";
    mark.style.height = "0";
    const mm = mark.offsetTop / PX_PER_MM;
    probe.remove();
    if (document.fonts.status === "loaded") this.baselineCache.set(key, mm);
    return mm;
  }
  pasteText(pageId, text) {
    const element = {
      id: newId(),
      type: "text",
      x: 20,
      y: 30,
      w: PAGE_W - 40,
      fontSize: this.options.text.fontSize,
      color: this.options.text.color,
      md: text.replace(/\s+$/, "")
    };
    this.store.commit([{ type: "addElement", pageId, element }]);
    this.setTool("lasso");
    this.lasso.select({ pageId, ids: /* @__PURE__ */ new Set([element.id]) });
  }
  elementBounds(pv, el2) {
    if (el2.type === "stroke") return strokeBounds(el2);
    if (el2.type === "image") return { x: el2.x, y: el2.y, w: el2.w, h: el2.h };
    const node = pv.layers.texts.querySelector(`.pn-text[data-id="${el2.id}"]`);
    const h2 = node && node.offsetHeight > 0 ? node.offsetHeight / PX_PER_MM : el2.fontSize * 0.3528 * 1.45;
    const w2 = node && node.offsetWidth > 0 ? node.offsetWidth / PX_PER_MM : el2.w;
    return { x: el2.x, y: el2.y, w: w2, h: h2 };
  }
  // ---------- Copy / dán / nhân bản ----------
  copySelection(data) {
    clipboard = { elements: clone(this.lasso.selectedElements()), pageId: this.lasso.selection.pageId };
    data == null ? void 0 : data.setData("text/plain", CLIP_MARKER);
  }
  pasteElements(pageId) {
    if (!clipboard) return;
    const offset = clipboard.pageId === pageId ? 5 : 0;
    this.addCopies(pageId, clipboard.elements, offset);
  }
  duplicateSelection() {
    if (!this.lasso.selection) return;
    this.addCopies(this.lasso.selection.pageId, clone(this.lasso.selectedElements()), 5);
  }
  addCopies(pageId, elements, offset) {
    const ids = /* @__PURE__ */ new Set();
    const ops = elements.map((el2) => {
      const copy = translated(el2, offset, offset);
      copy.id = newId();
      ids.add(copy.id);
      return { type: "addElement", pageId, element: copy };
    });
    this.store.commit(ops);
    this.setTool("lasso");
    this.lasso.select({ pageId, ids });
  }
  // ---------- Ảnh ----------
  resolveImage(src) {
    var _a, _b, _c;
    const sourcePath = (_b = (_a = this.file) == null ? void 0 : _a.path) != null ? _b : "";
    const f2 = (_c = this.app.metadataCache.getFirstLinkpathDest(src, sourcePath)) != null ? _c : this.app.vault.getAbstractFileByPath(src);
    return f2 instanceof import_obsidian2.TFile ? f2 : null;
  }
  draggedVaultImage() {
    var _a;
    const draggable = (_a = this.app.dragManager) == null ? void 0 : _a.draggable;
    const file = draggable == null ? void 0 : draggable.file;
    return file instanceof import_obsidian2.TFile && IMAGE_EXTENSIONS.includes(file.extension.toLowerCase()) ? file : null;
  }
  pickImage() {
    const pageId = this.currentPageId;
    if (!pageId || this.loadError) return;
    const input = createEl("input", { attr: { type: "file", accept: "image/*", multiple: "" } });
    input.addEventListener("change", () => {
      var _a;
      const files = Array.from((_a = input.files) != null ? _a : []);
      if (files.length) this.insertImageFiles(files, pageId);
    });
    input.click();
  }
  /** Lưu ảnh vào thư mục attachment của vault rồi đặt lên trang */
  async insertImageFiles(files, pageId, at) {
    if (!this.file) return;
    for (const [i2, file] of files.entries()) {
      try {
        const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "png").toLowerCase();
        const name = file.name && file.name !== "image.png" ? file.name : `Pasted image ${window.moment().format("YYYYMMDDHHmmss")}.${ext}`;
        const path = await this.app.fileManager.getAvailablePathForAttachment(name, this.file.path);
        const tfile = await this.app.vault.createBinary(path, await file.arrayBuffer());
        await this.addImageElement(tfile, pageId, at ? { x: at.x + i2 * 5, y: at.y + i2 * 5 } : void 0);
      } catch (err) {
        console.error("[paper-notebook] Kh\xF4ng ch\xE8n \u0111\u01B0\u1EE3c \u1EA3nh", err);
        new import_obsidian2.Notice(`Kh\xF4ng ch\xE8n \u0111\u01B0\u1EE3c \u1EA3nh ${file.name}`);
      }
    }
  }
  async addImageElement(file, pageId, at) {
    var _a;
    const { width, height } = await imageSize(this.app.vault.getResourcePath(file));
    let w2 = Math.min(140, width / PX_PER_MM);
    let h2 = w2 * height / width;
    if (h2 > 200) {
      h2 = 200;
      w2 = h2 * width / height;
    }
    const x2 = clamp(((_a = at == null ? void 0 : at.x) != null ? _a : PAGE_W / 2) - w2 / 2, 0, PAGE_W - w2);
    const y2 = clamp(at ? at.y - h2 / 2 : 30, 0, PAGE_H - h2);
    const element = { id: newId(), type: "image", x: x2, y: y2, w: w2, h: h2, src: file.path };
    this.store.commit([{ type: "addElement", pageId, element }]);
  }
  /** Gọi khi bật/tắt đánh số trang trong settings */
  refreshPageNumbers() {
    this.store.doc.pages.forEach((page, i2) => {
      const pv = this.pageViews.get(page.id);
      if (pv) setPageNumber(pv.layers, this.plugin.settings.showPageNumbers ? i2 + 1 : null);
      this.scheduleThumb(page.id);
    });
  }
  /** Dừng sửa chữ trước khi export để không mất nội dung đang gõ */
  flushEdits() {
    var _a;
    (_a = this.textEditor) == null ? void 0 : _a.finish();
  }
};
function paletteButton(parent, icon, label, onClick) {
  const btn = parent.createEl("button", { cls: "pn-palette-btn", attr: { "aria-label": label } });
  (0, import_obsidian2.setIcon)(btn, icon);
  btn.addEventListener("click", onClick);
  return btn;
}
function isLight(hex) {
  const m2 = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m2) return false;
  const n2 = parseInt(m2[1], 16);
  return 0.299 * (n2 >> 16) + 0.587 * (n2 >> 8 & 255) + 0.114 * (n2 & 255) > 170;
}
function isTyping(target) {
  const el2 = target;
  return !!el2 && (el2.tagName === "TEXTAREA" || el2.tagName === "INPUT" || el2.tagName === "SELECT" || el2.isContentEditable);
}
function clipToPage(a2, b2) {
  let t0 = 0;
  let t1 = 1;
  const dx = b2.x - a2.x;
  const dy = b2.y - a2.y;
  const checks = [
    [-dx, a2.x],
    [dx, PAGE_W - a2.x],
    [-dy, a2.y],
    [dy, PAGE_H - a2.y]
  ];
  for (const [p2, q] of checks) {
    if (p2 === 0) {
      if (q < 0) return null;
      continue;
    }
    const r2 = q / p2;
    if (p2 < 0) t0 = Math.max(t0, r2);
    else t1 = Math.min(t1, r2);
    if (t0 > t1) return null;
  }
  return [
    { x: a2.x + dx * t0, y: a2.y + dy * t0 },
    { x: a2.x + dx * t1, y: a2.y + dy * t1 }
  ];
}
function clamp(v2, min, max) {
  return Math.max(min, Math.min(max, v2));
}
function imageSize(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 400, height: img.naturalHeight || 300 });
    img.onerror = () => resolve({ width: 400, height: 300 });
    img.src = url;
  });
}

// src/open-patch.ts
function installOpenPatch(rawLeaves) {
  return around(import_obsidian3.WorkspaceLeaf.prototype, {
    setViewState(next) {
      return function(state, eState) {
        var _a;
        const file = (_a = state == null ? void 0 : state.state) == null ? void 0 : _a.file;
        if ((state == null ? void 0 : state.type) === "markdown" && typeof file === "string" && isNotebookPath(file)) {
          if (rawLeaves.get(this) !== file) {
            rawLeaves.delete(this);
            state = { ...state, type: VIEW_TYPE };
          }
        }
        return next.call(this, state, eState);
      };
    }
  });
}

// src/ui/name-prompt.ts
var import_obsidian4 = require("obsidian");
var INVALID_CHARS = /[\\/:*?"<>|#^[\]]/;
var NotebookNameModal = class extends import_obsidian4.Modal {
  constructor(app, folder, onSubmit) {
    super(app);
    this.folder = folder;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    this.modalEl.addClass("pn-name-modal");
    this.titleEl.setText("New notebook");
    const { contentEl } = this;
    contentEl.createDiv({
      cls: "pn-name-folder",
      text: `Trong th\u01B0 m\u1EE5c: ${this.folder.isRoot() ? "/" : this.folder.path}`
    });
    const row = contentEl.createDiv({ cls: "pn-name-row" });
    const input = row.createEl("input", { cls: "pn-name-input", attr: { type: "text", spellcheck: "false" } });
    row.createSpan({ cls: "pn-name-ext", text: ".notebook" });
    const error = contentEl.createDiv({ cls: "pn-name-error" });
    const buttons = contentEl.createDiv({ cls: "modal-button-container" });
    const cancel = buttons.createEl("button", { text: "Hu\u1EF7" });
    const create = buttons.createEl("button", { cls: "mod-cta", text: "T\u1EA1o" });
    input.value = this.availableName("Untitled");
    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
    const submit = () => {
      const name = input.value.trim().replace(/(\.notebook)?(\.md)?$/i, "").trim();
      const problem = this.validate(name);
      error.setText(problem != null ? problem : "");
      input.toggleClass("is-invalid", !!problem);
      if (problem) return;
      this.close();
      this.onSubmit(this.pathFor(name));
    };
    input.addEventListener("input", () => {
      error.setText("");
      input.removeClass("is-invalid");
    });
    input.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter" && !e2.isComposing) {
        e2.preventDefault();
        submit();
      }
    });
    create.addEventListener("click", submit);
    cancel.addEventListener("click", () => this.close());
  }
  onClose() {
    this.contentEl.empty();
  }
  pathFor(name) {
    const base = this.folder.isRoot() ? "" : this.folder.path + "/";
    return (0, import_obsidian4.normalizePath)(`${base}${name}.notebook.md`);
  }
  availableName(name) {
    let candidate = name;
    for (let n2 = 1; this.app.vault.getAbstractFileByPath(this.pathFor(candidate)); n2++) candidate = `${name} ${n2}`;
    return candidate;
  }
  validate(name) {
    if (!name) return "H\xE3y nh\u1EADp t\xEAn notebook.";
    if (INVALID_CHARS.test(name)) return 'T\xEAn kh\xF4ng \u0111\u01B0\u1EE3c ch\u1EE9a c\xE1c k\xFD t\u1EF1 \\ / : * ? " < > | # ^ [ ]';
    if (name.startsWith(".")) return "T\xEAn kh\xF4ng \u0111\u01B0\u1EE3c b\u1EAFt \u0111\u1EA7u b\u1EB1ng d\u1EA5u ch\u1EA5m.";
    if (this.app.vault.getAbstractFileByPath(this.pathFor(name))) return "Trong th\u01B0 m\u1EE5c n\xE0y \u0111\xE3 c\xF3 notebook tr\xF9ng t\xEAn.";
    return null;
  }
};

// src/settings.ts
var import_obsidian5 = require("obsidian");
var DEFAULT_SETTINGS = {
  defaultTemplate: "lined",
  showSidebar: true,
  showPageNumbers: true,
  exportFolder: "",
  openPdfAfterExport: true
};
var PaperNotebookSettingTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s2 = this.plugin.settings;
    new import_obsidian5.Setting(containerEl).setName("M\u1EABu gi\u1EA5y m\u1EB7c \u0111\u1ECBnh").setDesc("D\xF9ng cho trang \u0111\u1EA7u ti\xEAn c\u1EE7a notebook m\u1EDBi.").addDropdown((d2) => {
      for (const t2 of TEMPLATES) d2.addOption(t2.id, t2.label);
      d2.setValue(s2.defaultTemplate).onChange(async (v2) => {
        s2.defaultTemplate = v2;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian5.Setting(containerEl).setName("\u0110\xE1nh s\u1ED1 trang").setDesc("In s\u1ED1 th\u1EE9 t\u1EF1 \u1EDF ch\xE2n m\u1ED7i trang gi\u1EA5y, export PDF c\u0169ng c\xF3.").addToggle(
      (t2) => t2.setValue(s2.showPageNumbers).onChange(async (v2) => {
        s2.showPageNumbers = v2;
        await this.plugin.saveSettings();
        this.plugin.refreshPageNumbers();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Th\u01B0 m\u1EE5c l\u01B0u PDF").setDesc("\u0110\u1EC3 tr\u1ED1ng th\xEC PDF n\u1EB1m c\u1EA1nh file notebook.").addText(
      (t2) => t2.setPlaceholder("V\xED d\u1EE5: 05-Archive/PDF").setValue(s2.exportFolder).onChange(async (v2) => {
        s2.exportFolder = v2.trim().replace(/^\/+|\/+$/g, "");
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("M\u1EDF PDF sau khi export").addToggle(
      (t2) => t2.setValue(s2.openPdfAfterExport).onChange(async (v2) => {
        s2.openPdfAfterExport = v2;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/main.ts
var PaperNotebookPlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    /** Leaf nào đang được người dùng chọn xem dạng markdown, kèm đường dẫn file */
    this.rawLeaves = /* @__PURE__ */ new WeakMap();
  }
  async onload() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
    this.registerView(VIEW_TYPE, (leaf) => new NotebookView(leaf, this));
    this.register(installOpenPatch(this.rawLeaves));
    this.addSettingTab(new PaperNotebookSettingTab(this.app, this));
    this.addRibbonIcon(NOTEBOOK_ICON, "T\u1EA1o notebook m\u1EDBi", () => this.createNotebook());
    this.addCommand({
      id: "create-notebook",
      name: "T\u1EA1o notebook m\u1EDBi",
      callback: () => this.createNotebook()
    });
    this.addCommand({
      id: "export-pdf",
      name: "Export notebook ra PDF",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(NotebookView);
        if (!view) return false;
        if (!checking) this.exportPdf(view);
        return true;
      }
    });
    this.addCommand({
      id: "open-as-markdown",
      name: "M\u1EDF notebook d\u1EA1ng markdown",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(NotebookView);
        if (!view) return false;
        if (!checking) this.openAsMarkdown(view.leaf);
        return true;
      }
    });
    this.addCommand({
      id: "open-as-notebook",
      name: "M\u1EDF d\u1EA1ng notebook (trang gi\u1EA5y)",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(import_obsidian6.MarkdownView);
        if (!(view == null ? void 0 : view.file) || !isNotebookPath(view.file.path)) return false;
        if (!checking) this.openAsNotebook(view.leaf, view.file);
        return true;
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source, leaf) => {
        if (file instanceof import_obsidian6.TFolder) {
          menu.addItem(
            (i2) => i2.setSection("action-primary").setTitle("New notebook").setIcon(NOTEBOOK_ICON).onClick(() => this.createNotebook(file))
          );
          return;
        }
        if (!(file instanceof import_obsidian6.TFile) || !isNotebookPath(file.path)) return;
        const view = leaf == null ? void 0 : leaf.view;
        if (view instanceof NotebookView) {
          menu.addItem((i2) => i2.setTitle("Export PDF").setIcon("file-down").onClick(() => this.exportPdf(view)));
          menu.addItem((i2) => i2.setTitle("M\u1EDF d\u1EA1ng markdown").setIcon("file-code").onClick(() => this.openAsMarkdown(view.leaf)));
        } else if (view instanceof import_obsidian6.MarkdownView && leaf) {
          menu.addItem((i2) => i2.setTitle("M\u1EDF d\u1EA1ng notebook").setIcon(NOTEBOOK_ICON).onClick(() => this.openAsNotebook(leaf, file)));
        }
      })
    );
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
        const file = leaf.view.file;
        if (file && isNotebookPath(file.path)) this.openAsNotebook(leaf, file);
      });
    });
  }
  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
      const file = leaf.view.file;
      if (!file) return;
      this.rawLeaves.set(leaf, file.path);
      leaf.setViewState({ type: "markdown", state: { file: file.path } });
    });
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  refreshPageNumbers() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => leaf.view.refreshPageNumbers());
  }
  /** Hỏi tên rồi mới tạo notebook */
  createNotebook(folder) {
    var _a, _b;
    const parent = folder != null ? folder : this.app.fileManager.getNewFileParent((_b = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path) != null ? _b : "");
    new NotebookNameModal(this.app, parent, async (path) => {
      try {
        const file = await this.app.vault.create(path, serializeNotebook(newDoc(this.settings.defaultTemplate), ""));
        await this.app.workspace.getLeaf(false).openFile(file);
      } catch (err) {
        console.error("[paper-notebook] Kh\xF4ng t\u1EA1o \u0111\u01B0\u1EE3c notebook", err);
        new import_obsidian6.Notice(`Kh\xF4ng t\u1EA1o \u0111\u01B0\u1EE3c notebook: ${err instanceof Error ? err.message : err}`);
      }
    }).open();
  }
  openAsMarkdown(leaf) {
    const file = leaf.view.file;
    if (!file) return;
    this.rawLeaves.set(leaf, file.path);
    leaf.setViewState({ type: "markdown", state: { file: file.path }, active: true });
  }
  openAsNotebook(leaf, file) {
    this.rawLeaves.delete(leaf);
    leaf.setViewState({ type: VIEW_TYPE, state: { file: file.path }, active: true });
  }
  async exportPdf(view) {
    const file = view.file;
    if (!file) return;
    view.flushEdits();
    const notice = new import_obsidian6.Notice("\u0110ang export PDF\u2026", 0);
    try {
      const pdf = await exportNotebookPdf(this, file, view.store.doc);
      notice.hide();
      new import_obsidian6.Notice(`\u0110\xE3 export: ${pdf.path}`);
      if (this.settings.openPdfAfterExport) await this.app.workspace.getLeaf("tab").openFile(pdf);
    } catch (err) {
      notice.hide();
      console.error("[paper-notebook] Export PDF l\u1ED7i", err);
      new import_obsidian6.Notice(`Export PDF l\u1ED7i: ${err instanceof Error ? err.message : err}`);
    }
  }
};
