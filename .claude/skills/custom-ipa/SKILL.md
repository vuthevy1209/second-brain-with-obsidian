---
name: custom-ipa
description: Thêm phiên âm đọc lái tiếng Việt (Vietnamese phonetic pronunciation) cho các từ vựng tiếng Anh bằng thẻ <ruby>.
---

# Custom IPA (Phiên âm đọc lái tiếng Việt)

Skill này hướng dẫn Agent cách tạo và định dạng phiên âm tiếng Anh theo kiểu "đọc lái" sang tiếng Việt, giúp người dùng dễ dàng phát âm mô phỏng theo.

## 1. Nguyên tắc tạo phiên âm (Vietnamese Phonetic Spelling)
- Sử dụng các âm tiết tiếng Việt để mô phỏng âm thanh tiếng Anh một cách gần gũi và dễ đọc nhất.
- Cách nhau giữa các âm tiết bằng một khoảng trắng.
- Đối với các âm đuôi (ending sounds) không có trong tiếng Việt, đặt phụ âm đó vào trong ngoặc đơn. Ví dụ: `(s)`, `(t)`, `(k)`, `(ch)`, `(p)`, `(đ)`.
- **Ví dụ tham khảo:**
  - `curated` -> `kiu rây tợt`
  - `nationwide` -> `nây sần oai`
  - `comfort` -> `căm phợt`
  - `transmission` -> `tran sờ mít sần`
  - `backwoods` -> `bách gút (s)`
  - `bump` -> `băm (p)`
  - `sketch` -> `sờ két (ch)`

## 2. Cách áp dụng và định dạng
Tùy vào yêu cầu của người dùng, Agent sẽ áp dụng phiên âm này vào file hoặc bảng trích xuất:

### a) Khi chỉnh sửa trực tiếp vào file Obsidian/Markdown (Sử dụng thẻ `<ruby>`)
- Nếu người dùng yêu cầu thêm phiên âm vào file, hãy sửa trực tiếp từ vựng (thường ở các thẻ Heading `##`) thành định dạng thẻ `<ruby>` của HTML.
- **Cú pháp:** `## <ruby>Từ_Vựng_Tiếng_Anh<rt>phiên âm tiếng việt</rt></ruby>`
- **Ví dụ:**
  - *Gốc:* `## curated`
  - *Sửa thành:* `## <ruby>curated<rt>kiu rây tợt</rt></ruby>`

### b) Khi trích xuất danh sách từ vựng dạng bảng (Không dùng thẻ `<ruby>`)
- Nếu người dùng yêu cầu trích xuất từ vựng ra bảng (`word ; definition ; ipa ; loại từ ; ví dụ EN ; ví dụ VI`), **không** sử dụng thẻ `<ruby>` trong cột `word` (để tránh rác code khi người dùng copy).
- Thay vào đó, đặt phần phiên âm đọc lái tiếng Việt vào cột `ipa` (với dấu gạch chéo `/ /`).
- **Ví dụ:** 
  `curated ; Được tuyển chọn cẩn thận ; /kiu rây tợt/ ; adj ; A curated exhibition ; Một triển lãm được chọn lọc kỹ.`

## 3. Trigger Condition
Kích hoạt skill này khi người dùng yêu cầu:
- "Thêm phiên âm đọc lái"
- "Thêm thẻ ruby / thẻ rudy"
- "Phiên âm tiếng Việt"
- Hoặc khi người dùng đang trích xuất từ vựng TOEIC và yêu cầu có cách đọc dễ hiểu.
