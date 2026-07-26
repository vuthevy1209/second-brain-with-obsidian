![[Recon Flow-1784715642052.webp]]

**RECON** là viết tắt của **<ruby>Reconnaissance<rt>rùy con nờ sần (s)</rt></ruby>** (nghĩa là **Trinh sát** hoặc **Thu thập thông tin**).

Trong lĩnh vực An toàn thông tin, <mark style="background:#b1ffff">Recon là giai đoạn đầu tiên và mang tính sống còn của bất kỳ cuộc tấn công (hoặc kiểm thử xâm nhập) nào</mark>. Quy tắc bất thành văn trong giới bảo mật là: <mark style="background:#d3f8b6">_"Bạn càng hiểu rõ mục tiêu bao nhiêu, cơ hội tìm thấy lỗ hổng càng cao bấy nhiêu.</mark>"_ Thời gian dành cho Recon thường chiếm đến 70-80% tổng thời gian của một cuộc Pentest.

Sơ đồ bạn gửi chính là một **Recon Flow (Quy trình Trinh sát)** kinh điển, đi từ ngoài vào trong, từ bao quát đến chi tiết. Dưới đây là giải nghĩa từng bước trong sơ đồ:

### 1. Lớp Mạng & Hạ tầng (Network & Infrastructure Recon)

- **Domain (Tên miền chính):** Điểm bắt đầu (ví dụ: `company.com`).
- **Scan $\rightarrow$ Subdomain (Quét tên miền phụ):** Tìm kiếm các phần mở rộng của mục tiêu. Các hệ thống chính thường được bảo vệ rất kỹ, nên hacker sẽ nhắm vào các subdomain bị lãng quên hoặc dùng để test (ví dụ: `api-staging.company.com`, `dev-portal.company.com`).
- **IP:** Phân giải các subdomain đó thành địa chỉ IP thực tế của máy chủ.
- **OS (Hệ điều hành) & Ports/Services (Cổng/Dịch vụ):** Dùng các công cụ như <mark style="background:#40a9ff">Nmap</mark> để quét IP, từ đó biết được server đang chạy hệ điều hành gì (Linux/Windows) và đang mở những "cửa" nào.
> _Ví dụ:_ Nếu thấy cổng 5432 mở, hacker biết ngay server đang chạy PostgreSQL. Nếu thấy cổng 6379, đó có thể là Redis.


### 2. Lớp Ứng dụng Web (Web Recon)

![[Recon Flow-1784716047216.webp]]

Nếu trong quá trình quét Ports, phát hiện ra hệ thống đang mở các cổng web (như Port 80 cho HTTP hoặc 443 cho HTTPS), quy trình Recon sẽ rẽ nhánh sâu hơn vào **Web** (phần bên phải của sơ đồ):

- **Technology stack (Công nghệ sử dụng):** Nhận diện xem web đang được xây dựng bằng gì. Hệ thống dùng Java, PHP, hay Node.js? Database đằng sau là gì? Nếu biết mục tiêu sử dụng một phiên bản thư viện cũ đang có sẵn lỗ hổng (CVE), hacker có thể tấn công ngay lập tức.
- **Directories scan (Quét thư mục/Đường dẫn):** Dùng công cụ tự động để dò dẫm các đường dẫn ẩn trên server.

	Khi thiết kế kiến trúc các API bằng các framework backend, phần này chính là việc hacker cố gắng mò ra danh sách toàn bộ các route được định nghĩa trong controller của bạn (ví dụ: `/api/v1/admin/users`, `/backup.zip`, `/swagger-ui.html`) mà không cần có tài liệu API.

- **Parameters scan (Quét tham số):** Tìm kiếm các điểm nhận dữ liệu đầu vào.

    Đây chính là bước tìm kiếm các "Untrusted Data" mà chúng ta đã nhắc đến. Hacker sẽ tìm các tham số trên URL (`?id=123`, `?redirect=...`) hoặc các trường dữ liệu trong form POST để chuẩn bị cho bước tấn công tiếp theo (Injection, XSS, v.v.).

Tóm lại, sơ đồ này thể hiện một tư duy rất logic: <mark style="background:#d3f8b6">**Thu hẹp dần mục tiêu.** Từ một cái tên miền rộng lớn, hacker bóc tách từng lớp hạ tầng, tìm ra ứng dụng web, và cuối cùng soi rọi vào từng biến số nhỏ nhất trong code để tìm kẽ hở.</mark>

