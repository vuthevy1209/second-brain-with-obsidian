---
title: Daily-Note
summary: A short description will make the document more useful.
tags:
  - daily
created: 2026-07-22
---

**Untrusted data** (Dữ liệu không đáng tin cậy) <mark style="background:#affad1">là bất kỳ dữ liệu nào đi vào ứng dụng của bạn từ một nguồn bên ngoài mà hệ thống không có quyền kiểm soát tuyệt đối</mark>.

Trong triết lý của An toàn thông tin và AppSec, có một quy tắc vàng (Golden Rule) luôn được nhắc đến đầu tiên: **<mark style="background:#d3f8b6">"Never trust user input"</mark>** (Không bao giờ tin tưởng dữ liệu đầu vào của người dùng). Bất kỳ thứ gì không do chính tay bạn hard-code trong mã nguồn thì đều bị coi là "untrusted".

### Untrusted data đến từ đâu?

Khi bạn xây dựng và thiết kế các API, untrusted data không chỉ đơn thuần là những gì người dùng gõ vào form đăng nhập hay ô tìm kiếm. Nó có thể ẩn nấp ở khắp mọi nơi:

![[Untrusted Data-1784712696467.webp]]

- **Dữ liệu từ HTTP Request:** Bất kỳ thứ gì được truyền qua `@RequestBody` (JSON/XML payloads), `@RequestParam` (Query parameters trong URL), hoặc `@PathVariable`.
- **HTTP Headers:** Những thông tin như `User-Agent`, `Referer`, `Accept-Language`, hay các custom headers. <mark style="background:#d3f8b6">Nhiều lập trình viên thường bỏ quên việc kiểm tra header vì nghĩ rằng người dùng bình thường không thể sửa được chúng</mark>.
- **Cookies và Session Tokens:** Dữ liệu lưu ở phía client (trình duyệt) gửi lên.
- **File Uploads:** Tên file, phần mở rộng (extension), dung lượng, và nội dung bên trong file.
- **Hệ thống bên ngoài (Third-party APIs):** <mark style="background:#b1ffff">Ngay cả dữ liệu trả về từ một API đối tác (ví dụ: cổng thanh toán, hệ thống CRM) cũng phải được coi là untrusted</mark>, vì bạn <mark style="background:#b1ffff">không thể đảm bảo hệ thống của họ chưa bị hack.</mark>

### Tại sao Untrusted data lại nguy hiểm?

Nếu ứng dụng lấy trực tiếp dữ liệu này và đưa vào xử lý (như lưu vào database, in ra màn hình, đưa vào shell để thực thi lệnh) mà không qua màng lọc nào, bạn đang mở toang cánh cửa cho các cuộc tấn công Injection (Nhóm rủi ro số 3 trong OWASP Top 10):

- Nếu untrusted data được đưa thẳng vào câu lệnh SQL $\rightarrow$ **SQL Injection (SQLi)**.
- Nếu untrusted data được render trực tiếp ra giao diện web $\rightarrow$ **Cross-Site Scripting (XSS)**.
- Nếu untrusted data được đưa vào các hàm thực thi của hệ điều hành $\rightarrow$ **Command Injection / RCE**.

### Cách phòng thủ và xử lý Untrusted Data

Để biến "Untrusted data" thành dữ liệu an toàn, các ứng dụng backend thường áp dụng các chiến lược sau tại các tầng Controller hoặc Middleware:

1. **Input Validation (Kiểm tra hợp lệ):** Ưu tiên dùng phương pháp **Allow-list** (Chỉ cho phép những gì được định nghĩa trước). Ví dụ: số điện thoại chỉ được chứa số và có độ dài từ 10-11 ký tự. Từ chối ngay lập tức nếu dữ liệu không khớp.
2. **Sanitization (Làm sạch dữ liệu):** Loại bỏ hoặc biến đổi các ký tự nguy hiểm trước khi xử lý tiếp.
3. **Sử dụng Parameterized Queries:** Thay vì cộng chuỗi SQL (`"SELECT * FROM users WHERE username = '" + username + "'"`), hãy sử dụng Prepared Statements hoặc các framework ORM. Cơ chế này sẽ báo cho database biết phần nào là "câu lệnh" và phần nào chỉ là "dữ liệu", giúp vô hiệu hóa hoàn toàn mã độc SQL.
4. **Output Encoding (Mã hóa đầu ra):** Chuyển đổi các ký tự đặc biệt thành định dạng an toàn trước khi hiển thị lên trình duyệt (ví dụ biến dấu `<` thành `&lt;`) để chống XSS.

