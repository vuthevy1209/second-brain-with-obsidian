<%*
const selectedText = tp.file.selection();

if (!selectedText || !selectedText.trim()) {
  new Notice("Hãy bôi đen từ hoặc bạn chưa chuyển sang chế độ ghi!");
  return;
}

const meaning = await tp.system.prompt(`Nghĩa của "${selectedText.trim()}":`);

if (!meaning) {
  tR = selectedText;
  return;
}

tR = `<ruby>${selectedText.trim()}<rt>${meaning}</rt></ruby> `;
-%>
