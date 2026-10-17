---
name: vocab-illustrate
description: Format lại một file ghi chú từ vựng tiếng Anh trong Obsidian thành các thẻ callout `> [!vocab]` hiển thị 2 cột (ảnh minh họa bên trái, từ + nghĩa bên phải), tự tìm ảnh thật trên Wikimedia Commons cho từ cụ thể, và tự vẽ ảnh minh họa hành động cho từ trừu tượng. Dùng khi người dùng nói "format lại file vocabulary", "thêm ảnh minh họa cho từ vựng", "tìm ảnh cho từ này", "làm giống file Test 2", hoặc đưa một file từ vựng dạng list/bullet và muốn thành thẻ có ảnh.
---

# Vocab Illustrate

Biến file từ vựng dạng list thô thành các **thẻ `> [!vocab]` có ảnh**, theo format của `02-Knowledge/Soft Skill/TOEIC/Part 4/2026 - Test 2.md`.

Thẻ là callout có sẵn của Obsidian; plugin `vocab-flashcard` (`.obsidian/plugins/vocab-flashcard/styles.css`) vẽ nó thành 2 cột và đọc nó để làm flashcard/trắc nghiệm. **Không dùng plugin Multi-Column nữa** (không sinh `--- start-multi-column`).

Công cụ nằm ở `.claude/skills/vocab-illustrate/scripts/` (viết bằng Python + Pillow, không cần cài thêm gì). Đường dẫn trong skill là tương đối so với thư mục skill.

## Quy trình

### 1. Đọc file đầu vào và file tham khảo
- Đọc file cần format (thường `02-Knowledge/Soft Skill/vocabulary.md`) và, nếu cần, file tham khảo để xem cú pháp thẻ.
- File cũ còn khối `--- start-multi-column` thì chuyển bằng lệnh `/Chuyển thẻ Multi-Column trong note sang thẻ từ vựng` của plugin (hoặc chuột phải thư mục → "Chuyển thẻ Multi-Column sang thẻ từ vựng"); lệnh giữ nguyên nội dung, kể cả chữ nằm ở cột ảnh.
- Lập danh sách thẻ: mỗi từ/cụm = 1 thẻ. Gộp các dòng cùng một từ (vd. `indulge` + `indulge all the senses`).
- **Giữ nguyên nội dung người dùng đã viết** (nghĩa, ví dụ, `<ruby>` phiên âm, `<mark>`, ảnh cũ). Chỉ đổi cách trình bày. Nếu một từ chỉ có ảnh mà thiếu nghĩa, có thể bổ sung nghĩa ngắn nhưng **phải báo lại** cho người dùng.
- Ảnh đã có sẵn trong file (`![[...]]`) thì dùng lại, không tìm/vẽ mới. Ảnh "đầu bài" (ảnh đề thi ở trên cùng) giữ nguyên dưới tiêu đề.

### 2. Phân loại từng từ: ảnh thật hay vẽ
- **Danh từ/cảnh cụ thể** (nhìn là hiểu: franchise, carpentry, dehydration, savory, steak, cattle…) → tìm ảnh thật.
- **Từ trừu tượng / động từ / cụm** (formally, entail, as such, join forces, assume the role…) → vẽ cảnh hành động minh họa. Commons tìm các từ này rất kém và hay ra ảnh chính trị gia/tài liệu scan, nên đừng cố.
- Tránh ảnh có người thật nổi tiếng. Ưu tiên ảnh rõ chủ thể, không chữ lớn.

### 3. Tìm ảnh thật (Wikimedia Commons)
Chọn thư mục tạm trong scratchpad làm `WORK`. Query tiếng Anh, cụ thể, mô tả vật/cảnh thấy được (vd. `"grass-fed cattle pasture"`, không phải `"grass-fed meat"`):

```bash
python3 scripts/commons_search.py WORK slug1 "query 1" slug2 "query 2" ...
```

- Chạy tuần tự, có backoff. **Không chạy song song** (bị HTTP 429). Nếu một slug báo 0 ứng viên hoặc lỗi 429 thì chạy lại riêng slug đó với query khác, hoặc chuyển sang vẽ.
- Mỗi slug cho ra `WORK/candidates/<slug>_sheet.jpg` (lưới ảnh đánh số #0…#7). **Dùng Read để xem ảnh**, chọn số tốt nhất.
- Chốt ảnh và đổi sang webp vào thư mục assets:

```bash
python3 scripts/commons_pick.py WORK "<thư mục assets>" slug1:0 slug2:6
```

Output: `vocabulary-<slug>.webp` (960px) và `WORK/credits.json` (tên file gốc + giấy phép).

### 4. Vẽ ảnh minh họa
Thư viện `scripts/illustrate.py`: canvas 800×600 phong cách flat, có `C.person(...)` (nhân vật, tay chỉnh bằng `armL/armR=(dx,dy)` theo đơn vị 1% chiều cao, **độ dài tay tự nhiên ≈ 30–36**, đừng để >40), `hardhat`, `arrow`, `text`, `circ`, `rect`, `poly`, `arc`…

`scripts/scenes_example.py` có 14 cảnh mẫu (bắt tay, ký giấy, đưa huy hiệu, cần cẩu, đồng hồ 24h, ly nước tràn, kính lúp lên quả táo…) để copy/sửa. Cách làm:

1. Viết file scene mới trong scratchpad (không sửa file mẫu), `import sys; sys.path.insert(0, "<skill>/scripts"); from illustrate import *`.
2. Mỗi cảnh = 1 hàm kết thúc bằng `c.save("<assets>/vocabulary-<slug>.webp")`. Đặt `PREVIEW_DIR=<tmp>` để cũng ra bản png xem trước.
3. **Luôn xem lại ảnh** (ghép nhiều ảnh thành 1 lưới rồi Read). Lỗi thường gặp: tay quá dài, chữ bị cắt mép, chữ/vật đè lên đầu nhân vật, mũi tên chồng lên người. Sửa rồi render lại.
4. Mỗi cảnh nên có 1 hành động rõ nghĩa và 1–2 chữ tiếng Anh ngắn (tiêu đề) nếu giúp nhận ra từ.

### 5. Dựng file markdown
Tạo `cards.json` (đúng thứ tự file gốc):

```json
[{"img": "vocabulary-planning.webp", "head": "Department of Planning", "body": "(n phr.) ==sở/phòng quy hoạch== ..."}]
```

- `head`: từ/cụm. Từ có phiên âm thì giữ `<ruby>word<rt>phiên âm</rt></ruby>`. Từ mới thêm thì **không tự bịa phiên âm**; muốn thêm thì dùng skill `custom-ipa`.
- `body`: loại từ trong ngoặc, **nghĩa chính bọc `==...==`**, ví dụ in đậm + dịch xuống dòng, bullet cho nhiều nghĩa.

```bash
python3 scripts/build_md.py cards.json "<file đích>.md" --title "# Lần 1" --header-image "<ảnh đầu bài>.webp"
```

Script sinh mỗi thẻ một callout:

```markdown
> [!vocab] từ
> ![[vocabulary-slug.webp]]
>
> (n) ==nghĩa chính==, nghĩa phụ
>
> **Câu ví dụ tiếng Anh.**  
> Dịch nghĩa.
```

- Dòng `>` trống ngay sau ảnh là **bắt buộc**: thiếu nó thì ảnh và nghĩa dính thành một đoạn, plugin không tách được ảnh sang cột trái.
- Mọi dòng của thẻ đều bắt đầu bằng `>` (dòng trống trong thẻ là `>`). Giữa 2 thẻ chỉ cần **1 dòng trống** (không có dòng trống thì 2 thẻ bị gộp làm một).
- Không ghi kích thước ảnh (`|238x310`), để thẻ tự co theo cột.
- Thêm thẻ bằng tay trong Obsidian: gõ `/Chèn thẻ từ vựng` (bôi đen từ trước thì từ đó thành tiêu đề), `/Chèn câu ví dụ` cho câu ví dụ.

### 6. Kiểm tra và báo cáo
- Số dòng `> [!vocab]` = số thẻ, không còn `--- start-multi-column` nào; mọi `![[...]]` tìm thấy file trong vault (`find <vault> -name "<tên>"`).
- Mỗi thẻ có ảnh thì dòng ngay sau ảnh là `>` trống; giữa các thẻ có dòng trống.
- Obsidian lấy attachment tại `./assets` cạnh note (`attachmentFolderPath`), nên ảnh đặt trong `assets/` cùng cấp với file đích; wikilink chỉ cần tên file.
- Báo lại người dùng: bao nhiêu ảnh thật / ảnh vẽ / ảnh cũ, nghĩa nào bạn tự thêm, và **giấy phép ảnh Commons** (thường CC BY / CC BY-SA, cần ghi nguồn nếu chia sẻ công khai; tên file gốc trong `credits.json`).

## Lưu ý
- Tải ảnh từ web là việc người dùng đã yêu cầu rõ khi gọi skill này; chỉ tải từ Wikimedia Commons, mỗi ảnh vào thư mục tạm riêng, không chạy file tải về.
- Chạy script bằng `python3` thường (không dùng `-I`, vì Pillow nằm trong user site-packages).
- Đặt tên ảnh `vocabulary-<slug>.webp`, slug không dấu, chữ thường, không trùng nhau trong thư mục assets.
