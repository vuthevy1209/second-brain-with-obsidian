import type { IncomingMessage, Server, ServerResponse } from "http";
import { ClipPayload, toClipPayload } from "./clip-card";

/**
 * Máy chủ nhỏ nhận từ vựng extension Chrome "ProMax Translate" gửi sang:
 *   POST http://127.0.0.1:27190/clip   (JSON, xem ClipPayload)
 *   GET  http://127.0.0.1:27190/ping   → { ok: true }
 * Không import "obsidian" để chạy thử được bằng Node.
 */

export interface ClipResult {
  status: "inserted" | "duplicate" | "no-note" | "reading-view";
  /** Tên note đã chèn thẻ */
  file?: string;
}

export interface ClipServerOptions {
  port: number;
  onClip: (payload: ClipPayload) => Promise<ClipResult>;
  /** Lỗi của máy chủ (vd cổng đang bận) — báo ra ngoài thay vì làm sập plugin */
  onError?: (err: NodeJS.ErrnoException) => void;
}

/** Body tối đa: một từ kèm vài nghĩa, câu ví dụ chỉ vài KB */
const MAX_BODY = 64 * 1024;

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function startClipServer({ port, onClip, onError }: ClipServerOptions): { close: () => void } {
  // require lúc chạy: module có sẵn trong Node/Electron, esbuild để nguyên (external)
  const http: typeof import("http") = require("http");
  const server: Server = http.createServer((req, res) => {
    handle(req, port, onClip).then(
      (result) => send(res, 200, result),
      (err) => {
        if (!(err instanceof HttpError)) console.error("[vocab-flashcard] Lỗi khi nhận từ vựng", err);
        send(res, err instanceof HttpError ? err.status : 500, { error: err instanceof HttpError ? err.message : "Lỗi trong plugin" });
      },
    );
  });
  server.on("error", (err: NodeJS.ErrnoException) => onError?.(err));
  // Chỉ nghe trên 127.0.0.1: máy khác trong mạng không gọi vào được
  server.listen(port, "127.0.0.1");
  return {
    close: () => {
      server.close();
      // Ngắt cả kết nối keep-alive để tắt/bật lại plugin là cổng được trả ngay
      server.closeAllConnections?.();
    },
  };
}

async function handle(req: IncomingMessage, port: number, onClip: ClipServerOptions["onClip"]): Promise<object> {
  // Chặn DNS rebinding: trang web trỏ tên miền của nó về 127.0.0.1 thì Host vẫn là tên miền đó
  if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) {
    throw new HttpError(403, "Host không hợp lệ");
  }
  const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  if (path === "/ping" && req.method === "GET") return { ok: true };
  if (path !== "/clip") throw new HttpError(404, "Không có đường dẫn này");
  if (req.method !== "POST") throw new HttpError(405, "Chỉ nhận POST");

  // Trang web nào cũng gửi request tới localhost được, nên chỉ nhận từ extension Chrome
  if (!req.headers.origin?.startsWith("chrome-extension://")) throw new HttpError(403, "Chỉ nhận từ extension Chrome");
  if (!/^application\/json\b/i.test(req.headers["content-type"] ?? "")) {
    throw new HttpError(415, "Content-Type phải là application/json");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await readBody(req));
  } catch (err) {
    throw err instanceof HttpError ? err : new HttpError(400, "Body không phải JSON");
  }
  const payload = toClipPayload(raw);
  if (!payload) throw new HttpError(400, "Thiếu text");
  return onClip(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Number(req.headers["content-length"]) >= MAX_BODY) return reject(new HttpError(413, "Body quá lớn"));
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size < MAX_BODY) return void chunks.push(chunk);
      // Quá giới hạn: bỏ phần còn lại, vẫn đọc hết để trả lời được 413
      req.removeAllListeners("data");
      req.resume();
      reject(new HttpError(413, "Body quá lớn"));
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: object) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
