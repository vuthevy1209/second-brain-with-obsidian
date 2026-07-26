---
title: Daily-Note
summary: A short description will make the document more useful.
tags:
  - daily
created: 2026-07-22
---

### 1. Nhóm Khái niệm Cốt lõi (Core Concepts)

Đây là chuỗi thuật ngữ mô tả vòng đời của một cuộc tấn công. Bạn sẽ thường xuyên thấy chúng đi liền với nhau.

- **Vulnerability (Lỗ hổng):** Điểm yếu trong phần mềm, phần cứng hoặc quy trình (ví dụ: code không kiểm tra đầu vào của người dùng, hoặc đặt mật khẩu mặc định).
- **Exploit (Mã khai thác):** Một công cụ, đoạn code hoặc chuỗi lệnh được tạo ra nhằm tận dụng một _Vulnerability_ cụ thể.
- **Payload (Tải trọng):** Hành động hoặc đoạn mã độc hại thực thi **sau khi** _Exploit_ thành công. (Ví dụ: Exploit giúp bạn xuyên qua tường rào, còn Payload chính là hành động mở cửa hậu hoặc trộm đồ bên trong).
- **Threat (Mối đe dọa):** Bất kỳ tác nhân nào (hacker, nhân viên nội bộ, thiên tai) có khả năng gây hại cho hệ thống.
- **Risk (Rủi ro):** Xác suất một _Threat_ khai thác thành công một _Vulnerability_ và gây ra thiệt hại thực tế. (Risk = Threat × Vulnerability).
### 2. Nhóm Các Hình thức Tấn công & Mã độc (Attacks & Malware)

- **Zero-day (0-day):** Lỗ hổng bảo mật chưa được công bố hoặc chưa có bản vá chính thức từ nhà phát triển. Hacker dùng 0-day cực kỳ nguy hiểm vì hệ thống phòng thủ chưa biết cách chặn.
- **Malware (Phần mềm độc hại):** Thuật ngữ chung chỉ các phần mềm có mục đích xấu (Virus, Worm, Trojan...).
- **Ransomware (Mã độc tống tiền):** Một loại Malware lây nhiễm vào máy tính, mã hóa toàn bộ dữ liệu và yêu cầu nạn nhân trả tiền chuộc (thường bằng Bitcoin) để lấy lại chìa khóa giải mã.
- **Phishing (Tấn công giả mạo):** Hành vi lừa đảo người dùng nhấp vào link độc hại hoặc cung cấp thông tin nhạy cảm (mật khẩu, mã OTP) bằng cách giả danh các tổ chức uy tín.
- **DoS / DDoS (Denial of Service / Distributed DoS):** Tấn công từ chối dịch vụ. Làm ngập lụt máy chủ bằng lượng truy cập khổng lồ khiến hệ thống tê liệt, không thể phục vụ người dùng thật.
- **MitM (Man-in-the-Middle):** Tấn công xen giữa. Kẻ tấn công can thiệp vào giữa luồng giao tiếp của 2 bên (ví dụ: client và server) để nghe lén hoặc sửa đổi dữ liệu.

### 3. Nhóm Web & AppSec (Quan trọng cho vị trí của bạn)

- **RCE (Remote Code Execution):** Lỗ hổng cho phép kẻ tấn công thực thi mã lệnh tùy ý từ xa ngay trên máy chủ. Đây thường là lỗ hổng nghiêm trọng nhất (Critical).
- **XSS (Cross-Site Scripting):** Lỗi cho phép hacker chèn mã script độc hại (thường là JavaScript) vào trang web. Mã này sẽ thực thi trên trình duyệt của người dùng khác để ăn cắp session/cookie.
- **SQLi (SQL Injection):** Chèn các câu lệnh SQL độc hại vào ô nhập liệu để thao túng cơ sở dữ liệu (đọc, sửa, xóa data hoặc thậm chí chiếm quyền server).
- **Shell:** Một môi trường giao diện dòng lệnh (CLI) để điều khiển máy tính. Trong tấn công mạng, có 2 khái niệm thường gặp:
    - **Bind Shell:** Máy nạn nhân mở sẵn một cổng (port), hacker chủ động kết nối tới cổng đó để điều khiển.
    - **Reverse Shell:** Máy nạn nhân bị ép phải tự động kết nối ngược về máy của hacker. (Cách này thường dùng để vượt qua Tường lửa, vì Tường lửa thường chặn các kết nối đi vào, nhưng hay bỏ lỏng các kết nối đi ra).

### 4. Nhóm Hệ thống Phòng thủ (Defensive Systems)

- **Firewall (Tường lửa):** Bức tường ranh giới kiểm soát các luồng dữ liệu mạng ra/vào dựa trên các quy tắc định sẵn.
- **WAF (Web Application Firewall):** Tường lửa chuyên dụng bảo vệ các ứng dụng Web (Layer 7). Nó có thể nhận diện và chặn các chuỗi tấn công như SQLi, XSS mà tường lửa mạng thông thường không hiểu được.
- **IDS / IPS (Intrusion Detection/Prevention System):** Hệ thống phát hiện (IDS) hoặc ngăn chặn (IPS) xâm nhập. Chuyên theo dõi traffic mạng để tìm các dấu hiệu bất thường.
- **SIEM (Security Information and Event Management):** Hệ thống gom tất cả logs (nhật ký) từ server, tường lửa, database... về một nơi để phân tích tập trung, giúp phát hiện sự cố nhanh chóng.

### 5. Capture the flag Competition (CTF)

**Capture the Flag (CTF)** ==trong an ninh mạng là một cuộc thi thực hành giả lập, nơi các cá nhân hoặc đội nhóm tìm kiếm các lỗ hổng bảo mật để khai thác và tìm ra một chuỗi ký tự đặc biệt gọi là **"flag"**==. 
- Khi tìm thấy flag (thường có định dạng như `flag{vi_du_o_day}`), người chơi nộp lên hệ thống để tích điểm và leo bảng xếp hạng. 
- Đây được coi là phương pháp tốt nhất để rèn luyện kỹ năng thực chiến và tư duy giải quyết vấn đề từ cơ bản đến nâng cao

![[Core Concept-1784708514687.webp]]