export type Mode = "flashcard" | "quiz" | "quizPro" | "typing" | "typingPro" | "check" | "dictation" | "shooter" | "match";

/** Tên, icon (lucide) và mô tả của từng chế độ học; dùng chung cho modal và tab thống kê */
export const MODES: Record<Mode, { label: string; icon: string; desc: string }> = {
  flashcard: { label: "Flashcard", icon: "layers", desc: "Lật thẻ xem từ, ảnh và nghĩa" },
  quiz: { label: "Trắc nghiệm", icon: "list-checks", desc: "Chọn đáp án đúng trong 4 lựa chọn" },
  quizPro: { label: "Trắc nghiệm nâng cao", icon: "list-todo", desc: "Nhìn ảnh + nghĩa, chọn từ tiếng Anh" },
  typing: { label: "Gõ chữ", icon: "keyboard", desc: "Gõ lại đoạn văn trộn từ vựng" },
  typingPro: { label: "Gõ nâng cao", icon: "text-cursor-input", desc: "Gõ lại câu ví dụ của từng từ" },
  check: { label: "Kiểm tra", icon: "spell-check", desc: "Nhìn ảnh + nghĩa, tự gõ lại từ" },
  dictation: { label: "Nghe chép", icon: "headphones", desc: "Nghe phát âm rồi gõ lại từ" },
  shooter: { label: "Bắn chữ", icon: "plane", desc: "Gõ đúng từ đang rơi để bắn nổ, nổ xong hiện nghĩa" },
  match: { label: "Ghép thẻ", icon: "layout-grid", desc: "Lưới 4×4: ghép từ tiếng Anh với nghĩa của nó" },
};
