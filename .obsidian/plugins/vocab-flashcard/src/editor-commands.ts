import { Editor, EditorPosition, Notice, Plugin } from "obsidian";
import { convertMultiColumn } from "./parser";

/**
 * Lệnh soạn thảo. Core plugin "Slash commands" tự liệt kê các lệnh có editorCallback,
 * nên gõ `/` trong note là thấy các lệnh này.
 */
export function registerEditorCommands(plugin: Plugin) {
  plugin.addCommand({
    id: "insert-vocab-card",
    name: "Chèn thẻ từ vựng (vocab card)",
    icon: "brain",
    editorCallback: (editor) => insertVocabCard(editor),
  });

  plugin.addCommand({
    id: "insert-example",
    name: "Chèn câu ví dụ (example)",
    icon: "quote",
    editorCallback: (editor) => insertExample(editor),
  });

  plugin.addCommand({
    id: "convert-multi-column",
    name: "Chuyển thẻ Multi-Column trong note sang thẻ từ vựng",
    icon: "replace",
    editorCallback: (editor) => {
      const { text, converted, skipped } = convertMultiColumn(editor.getValue());
      if (!converted) return new Notice("Note này không có thẻ Multi-Column nào để chuyển.");
      editor.setValue(text);
      new Notice(summary(converted, skipped));
    },
  });
}

/**
 * Chèn khung thẻ:
 *   > [!vocab] từ
 *   > ![[]]
 *   >
 *   > (n) //
 *   > ====
 * Bôi đen một từ trước khi chạy lệnh thì từ đó thành tiêu đề thẻ.
 */
function insertVocabCard(editor: Editor) {
  const word = editor.getSelection().trim();
  const from = editor.getCursor("from");
  // Callout phải nằm ở đầu dòng: dòng hiện tại đã có chữ thì xuống dòng trước
  const before = editor.getLine(from.line).slice(0, from.ch);
  const prefix = before.trim() ? "\n\n" : "";

  const lines = [`> [!vocab] ${word}`, "> ![[]]", ">", "> (n) //", "> ===="];
  editor.replaceSelection(prefix + lines.join("\n") + "\n");

  const first = from.line + (prefix ? 2 : 0);
  // Chưa có từ thì đặt con trỏ vào chỗ gõ từ, có rồi thì đặt vào giữa ==…== để gõ nghĩa
  const cursor: EditorPosition = word
    ? { line: first + 4, ch: "> ==".length }
    : { line: first, ch: lines[0].length };
  editor.setCursor(cursor);
}

/** Chèn câu ví dụ đúng kiểu trong note: câu tiếng Anh in đậm, dịch ở dòng dưới */
function insertExample(editor: Editor) {
  const sentence = editor.getSelection().trim() || "Câu ví dụ tiếng Anh.";
  const from = editor.getCursor("from");
  const lineText = editor.getLine(from.line);
  // Đang ở trong thẻ (dòng bắt đầu bằng >) thì giữ dấu > cho các dòng chèn thêm
  const quote = /^>\s?/.test(lineText) ? "> " : "";
  const before = lineText.slice(0, from.ch).replace(/^>\s?/, "");
  const prefix = before.trim() ? `\n${quote}\n${quote}` : "";

  editor.replaceSelection(`${prefix}**${sentence}**  \n${quote}Dịch nghĩa.`);
  // Bôi đen chữ "Dịch nghĩa." để gõ đè luôn
  const line = from.line + (prefix ? 3 : 1);
  editor.setSelection({ line, ch: quote.length }, { line, ch: quote.length + "Dịch nghĩa.".length });
}

function summary(converted: number, skipped: number): string {
  const rest = skipped ? `, giữ nguyên ${skipped} khối không có tiêu đề ## từ` : "";
  return `Đã chuyển ${converted} thẻ sang định dạng [!vocab]${rest}.`;
}
