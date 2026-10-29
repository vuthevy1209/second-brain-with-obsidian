---
name: vocab-illustrate
description: Format lại một file ghi chú từ vựng tiếng Anh trong Obsidian thành các thẻ callout `> [!vocab]` hiển thị 2 cột (ảnh minh họa bên trái, từ + nghĩa bên phải), tự tìm ảnh thật trên Wikimedia Commons cho từ cụ thể, và tự vẽ ảnh minh họa hành động kiểu tranh khắc tô màu cổ điển cho từ trừu tượng. Dùng khi người dùng nói "format lại file vocabulary", "thêm ảnh minh họa cho từ vựng", "tìm ảnh cho từ này", "làm giống file Test 2", hoặc đưa một file từ vựng dạng list/bullet và muốn thành thẻ có ảnh.
---

# Vocab Illustrate

Biến file từ vựng dạng list thô thành các **thẻ `> [!vocab]` có ảnh**, theo format của `02-Knowledge/Soft Skill/TOEIC/Part 4/2026 - Test 2.md`.

Thẻ là callout có sẵn của Obsidian; plugin `vocab-flashcard` (`.obsidian/plugins/vocab-flashcard/styles.css`) vẽ nó thành 2 cột và đọc nó để làm flashcard/trắc nghiệm. **Không dùng plugin Multi-Column nữa** (không sinh `--- start-multi-column`).

Công cụ nằm ở `.claude/skills/vocab-illustrate/scripts/` (viết bằng Python + Pillow, không cần cài thêm gì; không dùng API tạo ảnh trả phí). Đường dẫn trong skill là tương đối so với thư mục skill.

## Quy trình

### 1. Đọc file đầu vào và file tham khảo
- Đọc file cần format (thường `02-Knowledge/Soft Skill/vocabulary.md`) và, nếu cần, file tham khảo để xem cú pháp thẻ.
- File cũ còn khối `--- start-multi-column` thì chuyển bằng lệnh `/Chuyển thẻ Multi-Column trong note sang thẻ từ vựng` của plugin (hoặc chuột phải thư mục → "Chuyển thẻ Multi-Column sang thẻ từ vựng"); lệnh giữ nguyên nội dung, kể cả chữ nằm ở cột ảnh.
- Lập danh sách thẻ: mỗi từ/cụm = 1 thẻ. Gộp các dòng cùng một từ (vd. `indulge` + `indulge all the senses`). Một dòng liệt kê nhiều từ (vd. `Long before - Long After - Long ago`) thì tách thành nhiều thẻ, các thẻ dùng chung ảnh và phần chi tiết.
- **Giữ nguyên nội dung người dùng đã viết** (nghĩa, ví dụ, `<ruby>` phiên âm, `<mark>`, ảnh cũ). Chỉ đổi cách trình bày. Nếu một từ chỉ có ảnh mà thiếu nghĩa, có thể bổ sung nghĩa ngắn nhưng **phải báo lại** cho người dùng.
- Tiêu đề kiểu cũ có lẫn nghĩa/loại từ (`word: nghĩa`, `word (adv) nghĩa`, `word - nghĩa`) thì **tách ra** đúng chỗ ở bước 5: từ tiếng Anh → `word`, loại từ → `pos`, nghĩa ngắn → `meaning`, phần còn lại (giải thích, ví dụ, nghĩa phụ dài) → `details`. Không bỏ chữ nào của người dùng.
- Ảnh đã có sẵn trong file (`![[...]]`) thì dùng lại, không tìm/vẽ mới. Ảnh "đầu bài" (ảnh đề thi ở trên cùng) giữ nguyên dưới tiêu đề.
- Khi người dùng nhờ "cập nhật lại" một note cũ: vẽ lại các ảnh vẽ kiểu flat cũ (khổ 800×600, nền phẳng, nhân vật que) theo kiểu tranh khắc ở bước 4, giữ cùng tên file để thẻ không phải sửa. Ảnh chụp từ Commons và ảnh người dùng tự dán thì giữ nguyên. Đồng thời sửa các thẻ còn sai định dạng (thiếu `<ruby>`, dòng `(pos) /ipa/` hay dòng `==nghĩa==`).

### 2. Phân loại từng từ: ảnh thật hay vẽ
**Luôn ưu tiên ảnh thật có sẵn trên mạng** (Wikimedia Commons, bước 3). Chỉ khi không tìm được ảnh thật nào đúng và rõ nghĩa mới vẽ (bước 4). Người dùng đã thích ảnh vẽ, nhưng vẫn muốn dùng ảnh thật trước.
- **Danh từ/cảnh cụ thể** (nhìn là hiểu: franchise, carpentry, dehydration, savory, steak, cattle, steering wheel…) → chắc chắn có ảnh thật, tìm trước.
- **Động từ, cụm, tính từ tả được bằng một cảnh** (crowded, shake hands, short on time, fierce competition…) → vẫn thử tìm ảnh thật bằng query mô tả cảnh thấy được (vd. `"crowded train platform"`, `"horse race finish"`). Xem kỹ ảnh: có đúng nghĩa không, có rõ chủ thể không.
- **Từ thật sự trừu tượng** (formally, entail, as such, that said, tentative, reportedly…) hoặc tìm không ra ảnh phù hợp → vẽ cảnh minh họa kiểu tranh khắc (bước 4). Commons tìm các từ này rất kém và hay ra ảnh chính trị gia/tài liệu scan, nên chỉ thử 1–2 query rồi chuyển sang vẽ.
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

### 4. Vẽ ảnh minh họa (kiểu tranh khắc tô màu)
Người dùng đã chọn **kiểu tranh khắc tô màu**: viền mực đậm, bóng tối bằng nét gạch chéo, khung viền mảnh. Màu **sáng, tươi như sách tranh Oxford** (giấy gần trắng, ít ngả nâu). Độ sáng chỉnh ở `ENGRAVING` đầu `paint.py`: đừng làm tối/ngả vàng lại. Mọi ảnh vẽ mới đều theo kiểu này (đừng quay lại kiểu flat cũ). Ảnh mẫu: các ảnh `vocabulary-*.webp` khổ 800×600 trong `02-Knowledge/Soft Skill/TOEIC/Part 7/2022/assets/` (note `2022 - Test 5`).

Thư viện (chỉ cần Pillow):
- `scripts/paint.py`: `Canvas()` khung 800×600 (vẽ ở 3x rồi thu nhỏ). Lệnh chính:
  - `shape(pts, màu, shade=, hi=, depth=, grad=, smooth=)`: mảng màu có khối. Bóng tự gạch chéo ở phía khuất sáng. Nguồn sáng ở trên bên phải, đổi bằng `c.light`.
  - `line`, `stroke`: nét mực run tay.
  - `shadow`: bóng đổ.
  - `spot`, `glow`: đốm sáng/tối mềm.
  - `hatch`: gạch bóng thủ công.
  - `text(xy, chữ, cỡ, face=hand|serif|type|georgia)`: chữ.
  - `finish(path, preview_dir=)`: thêm vân giấy, ngả màu cũ, tối 4 góc rồi lưu `.webp`.
  - Vẫn có `Canvas("watercolor")` và `Canvas("gouache")` nếu người dùng muốn đổi kiểu.
- `scripts/parts.py`: bộ phận dựng sẵn.
  - `person(...)`: người đứng. Tư thế tay chọn từ `ARM_POSES` (`down, hip, wave, up, point, shrug, chin, cheek, head, hold, forward, fist`) hoặc tự cho `(dx, dy)` theo đơn vị 1% chiều cao. Nét mặt: `smile, happy, laugh, worried, confused, surprised, sad, think, neutral`. Có thêm tóc, kính, áo vest, cà vạt, váy, và `legs=False` cho người đứng sau bàn. Hàm trả về vị trí đầu và tay để đặt đồ vào tay.
  - Phòng và nội thất: `room`, `office`, `window`, `desk`, `table_top`.
  - Đồ vật: `clock`, `paper`, `plant`, `tree`, `coin`, `coin_stack`, `magnifier`, `gear`, `book`, `book_stack`, `suitcase`, `briefcase`, `umbrella`, `crate`, `lamp`, `chest` (rương báu), `easel` (giá vẽ, trả về khung tranh), `heart`, `music_note`.
  - Mũ đội lên đầu: `mortarboard` (tốt nghiệp), `hat(kind=top|chef|cap|beret)`. Vị trí đỉnh đầu lấy từ `person(...)["head"]`.
  - Nền lớn: `column_building` (toà nhà cột kiểu trường/cơ quan), `stage` (sân khấu có rèm).
  - Chữ và ký hiệu: `bubble` (bong bóng thoại/suy nghĩ), `stamp` (con dấu đỏ), `arrow`, `sparkles`, `question_marks`, `check`, `cross`. (`banner` chỉ dùng làm biển hiệu trong cảnh, không dùng để ghi từ vựng.)
- `scripts/scenes_example.py`: 15 cảnh mẫu, chạy song song.
  - Người: đồng hồ + người lo lắng, người vắt cam, bắt tay trước nhà bán, đọc báo, nhún vai.
  - Vật và bản đồ: bản đồ rẽ đường, xe buýt vs taxi, cân đĩa, biểu đồ trên móng đá, bục vinh quang, chồng hồ sơ.
  - Giấy tờ: lịch đánh dấu, giấy hẹn bằng bút chì, lịch trình nháp + va li.
  - Thêm cảnh mới bằng cách viết hàm `scene_<slug>(c)`, chạy `python3 scripts/scenes_example.py <assets> <tmp> <slug>...`.
- `scripts/scenes_more.py`: thêm 61 cảnh mẫu (Test 1–4 cùng thư mục), gồm:
  - người ngồi sau bàn họp, phòng làm việc, sân khấu đọc kịch, rạp chiếu phim;
  - sân ga, sân bóng, xưởng mộc, xưởng đóng tàu;
  - cảnh chia đôi so sánh (hè/đông, ngày/đêm), đồng hồ đo mức độ, máy ép tài liệu...
- `scripts/scene_yummy.py`: cảnh người ngồi bàn ăn vẽ tay chi tiết từng bộ phận (bản người dùng chọn làm chuẩn), tham khảo khi cần cận cảnh người.

Cách làm:
1. Viết file scene mới trong scratchpad (không sửa file mẫu): `import sys; sys.path.insert(0, "<skill>/scripts"); from paint import *; from parts import *`. Mỗi cảnh một hàm, cuối cùng `c.finish("<assets>/vocabulary-<slug>.webp", preview_dir="<tmp>")`.
2. Bố cục mỗi cảnh:
   - Có nền thật: phòng có giấy dán tường, cửa sổ, sàn gỗ, bàn, phố, bản đồ, mặt bàn gỗ...
   - Có 1 hành động hoặc vật chính thể hiện đúng nghĩa của từ.
   - **Không có băng rôn/tiêu đề ghi từ vựng hay định nghĩa** (ở trên đầu ảnh hay bất kỳ đâu), không ghi nghĩa tiếng Việt lên ảnh: người dùng không muốn. Hạn chế ghi lại chính từ/cụm từ đang học, vì ảnh còn hiện trong chế độ trắc nghiệm nên chữ sẽ lộ đáp án. Chữ thuộc về cảnh thì được (biển "FOR SALE", số trên đồng hồ, giá vé "$2", nhãn tên đường…) nếu giúp hiểu nghĩa.
   - Dùng hết khung cho cảnh (không chừa chỗ trống phía trên cho tiêu đề).
3. **Luôn xem lại ảnh**: `python3 scripts/contact_sheet.py <tmp> <ra.png> <tên1> <tên2>...` ghép các png xem trước thành lưới 2 cột rồi Read. Lỗi thường gặp:
   - Chữ đè lên tay hoặc giấy.
   - Đồ vật che mất người.
   - Vật nằm lệch với hành động (nước tưới không rơi vào cây...).
   - Hình bị bo tròn méo: hình vuông vức phải dùng `smooth=False`.
   - Nhãn đè lên nhau, hình bị cắt mép khung.
   - Còn băng rôn/tiêu đề ghi từ vựng hoặc dòng định nghĩa trên ảnh: bỏ đi.

   Sửa rồi render lại.
   - Người ngồi sau bàn (`legs=False`) bị lún, chỉ lộ cái đầu: đặt chân người `by = mặt bàn + h/2` để vai cao hơn mặt bàn.
4. Mỗi ảnh vẽ xong trong 1–2 giây. Dùng `Pool` như `scenes_example.py` để vẽ nhiều cảnh cùng lúc.

### 5. Dựng file markdown
Tạo `cards.json` (đúng thứ tự file gốc), mỗi thẻ có các trường `word, reading, pos, ipa, meaning, details, img`:

```json
[{"word": "hastily", "reading": "hây(s) tờ ly", "pos": "adv", "ipa": "ˈheɪstəli",
  "meaning": "một cách hấp tấp, vội vàng", "details": "- Học từ của haste",
  "img": "vocabulary-hastily.webp"}]
```

**Bắt buộc với mọi thẻ:** `word`, `reading`, `pos`, `ipa`, `meaning`. Thiếu trường nào, hoặc `pos` ngoài danh sách, script báo lỗi kèm danh sách thẻ sai và không ghi file.

- `word`: chỉ từ/cụm tiếng Anh, giữ nguyên chữ hoa/thường của người dùng. **Không** chứa nghĩa, loại từ, `:` hay thẻ `<ruby>` (script tự bọc `<ruby>`).
- `reading`: phiên âm đọc lái tiếng Việt, theo quy tắc của skill `custom-ipa`. Từ đã có `<ruby>word<rt>…</rt></ruby>` thì **giữ nguyên phần `<rt>` của người dùng**; chỉ tự tạo khi từ chưa có.
- `pos`: đúng một giá trị trong danh sách cố định `n`, `v`, `adj`, `adv`, `prep`, `conj`, `pron`, `det`, `phr v` (phrasal verb), `phr` (cụm từ/collocation), `idiom`. Nhãn cũ như `n phr.`, `noun`, `verb phrase` phải đổi về danh sách này (vd. `Department of Planning` → `phr`, `give up` → `phr v`).
- `ipa`: phiên âm IPA giọng Mỹ (General American), ký hiệu kiểu Cambridge US, không có dấu chấm tách âm tiết, vd. `ˈwɑːt̬ɚˌkʌlɚ`. Không cần gõ `/ /`, script tự thêm.
- `meaning`: **đúng một** nghĩa tiếng Việt ngắn (≤ ~60 ký tự), nhiều nghĩa cách nhau bằng `, ` hoặc `; `. Không gõ `==`, script tự bọc. Trắc nghiệm và gõ từ của plugin luôn lấy dòng này.
- `details` (tùy chọn): markdown tự do, có thể nhiều dòng (chuỗi có `\n` hoặc mảng dòng): giải thích, nghĩa phụ, ví dụ in đậm + dịch xuống dòng, `<mark>` màu. Highlight ở đây không ảnh hưởng trắc nghiệm.
- `img` (tùy chọn): tên file ảnh.
- Nhiều từ dùng chung một tiêu đề cũ (vd. `Long before - Long After - Long ago`) thì mỗi từ một thẻ, lặp lại cùng `img` và `details`.
- Script vẫn nhận thẻ kiểu cũ `{"img", "head", "body"}` (ghi y nguyên, có cảnh báo) để chạy lại `cards.json` cũ; thẻ mới luôn dùng các trường ở trên.

```bash
python3 scripts/build_md.py cards.json "<file đích>.md" --title "# Lần 1" --header-image "<ảnh đầu bài>.webp"
```

Script sinh mỗi thẻ một callout:

```markdown
> [!vocab] <ruby>hastily<rt>hây(s) tờ ly</rt></ruby>
> ![[vocabulary-hastily.webp]]
>
> (adv) /ˈheɪstəli/
> ==một cách hấp tấp, vội vàng==
>
> - Học từ của haste
```

- Tiêu đề: chỉ `<ruby>từ<rt>đọc lái</rt></ruby>`, không có nghĩa, loại từ hay `:`.
- Dòng meta `(pos) /ipa/` ngay sau ảnh (hoặc ngay sau tiêu đề nếu không có ảnh), rồi dòng `==nghĩa==`. Phần chi tiết (nếu có) đứng sau một dòng `>` trống.
- Dòng `>` trống ngay sau ảnh là **bắt buộc**: thiếu nó thì ảnh và nghĩa dính thành một đoạn, plugin không tách được ảnh sang cột trái.
- Mọi dòng của thẻ đều bắt đầu bằng `>` (dòng trống trong thẻ là `>`). Giữa 2 thẻ chỉ cần **1 dòng trống** (không có dòng trống thì 2 thẻ bị gộp làm một).
- Không ghi kích thước ảnh (`|238x310`), để thẻ tự co theo cột.
- Thêm thẻ bằng tay trong Obsidian: gõ `/Chèn thẻ từ vựng` (bôi đen từ trước thì từ đó thành tiêu đề), `/Chèn câu ví dụ` cho câu ví dụ.

### 6. Kiểm tra và báo cáo
- Số dòng `> [!vocab]` = số thẻ, không còn `--- start-multi-column` nào; mọi `![[...]]` tìm thấy file trong vault (`find <vault> -name "<tên>"`).
- Mỗi thẻ có ảnh thì dòng ngay sau ảnh là `>` trống; giữa các thẻ có dòng trống.
- Kiểm tra định dạng từng thẻ:
  - Tiêu đề có dạng `> [!vocab] <ruby>word<rt>reading</rt></ruby>`, phần `word` không có chữ tiếng Việt và không có `:`.
  - Có đúng một dòng meta khớp `> (pos) /ipa/`, với pos thuộc danh sách cố định (`n|v|adj|adv|prep|conj|pron|det|phr v|phr|idiom`) và IPA không rỗng, không có dấu chấm.
  - Có **đúng một** dòng nghĩa `> ==…==` ngay sau dòng meta; các `==…==` khác (nếu có) chỉ được nằm trong phần chi tiết sau dòng `>` trống.
  - Có thể soát nhanh: `grep -c '^> \[!vocab\] <ruby>' file` phải bằng số `> [!vocab]`, và `grep -nE '^> \[!vocab\].*(:|</ruby>.)' file` không ra dòng nào.
- Obsidian lấy attachment tại `./assets` cạnh note (`attachmentFolderPath`), nên ảnh đặt trong `assets/` cùng cấp với file đích; wikilink chỉ cần tên file.
- Báo lại người dùng: bao nhiêu ảnh thật / ảnh vẽ / ảnh cũ, nghĩa nào bạn tự thêm, và **giấy phép ảnh Commons** (thường CC BY / CC BY-SA, cần ghi nguồn nếu chia sẻ công khai; tên file gốc trong `credits.json`).

## Lưu ý
- Tải ảnh từ web là việc người dùng đã yêu cầu rõ khi gọi skill này; chỉ tải từ Wikimedia Commons, mỗi ảnh vào thư mục tạm riêng, không chạy file tải về.
- Chạy script bằng `python3` thường (không dùng `-I`, vì Pillow nằm trong user site-packages).
- Đặt tên ảnh `vocabulary-<slug>.webp`, slug không dấu, chữ thường, không trùng nhau trong thư mục assets.
