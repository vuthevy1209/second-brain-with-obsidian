---
title: Foundation
summary: Bức tranh tổng quan về ATTT
tags:
  - daily
created: 2026-07-22
---

## Bức tranh tổng quan ngành

Trước khi học sâu, bạn cần hiểu **<mark style="background:#d3f8b6">InfoSec không phải một nghề, mà là một hệ sinh thái nhiều nhánh</mark>**. Bảng dưới so sánh các nhánh chính để bạn định hình mình hợp hướng nào.

**An toàn thông tin (ATTT)** là <mark style="background:rgba(3, 135, 102, 0.2)">một lĩnh vực cực kỳ rộng</mark>, đến mức không ai giỏi tất cả các mảng. Một chuyên gia Malware có thể không biết nhiều về Cloud Security, còn một Pentester có thể không làm được Digital Forensics.

| Nhánh                                  | Làm gì                                                | Kỹ năng cốt lõi                                     | Vị trí entry-level                  |
| -------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| **AppSec** (Application Security)      | Tìm & vá lỗ hổng trong ứng dụng/web/mobile            | Lập trình, **OWASP Top 10**, code review, SAST/DAST | AppSec Engineer, Security Developer |
| **Pentest / Offensive Security**       | Đóng vai hacker, tấn công có kiểm soát để tìm lỗ hổng | Networking, Linux, khai thác lỗ hổng, viết report   | Junior Pentester, VAPT Analyst      |
| **Blue Team / SOC**                    | Giám sát, phát hiện, phản ứng sự cố                   | SIEM, log analysis, threat detection                | SOC Analyst (Level 1)               |
| **Cloud Security**                     | Bảo mật hạ tầng AWS/Azure/GCP                         | IAM, container security, cloud misconfig            | Cloud Security Analyst              |
| **GRC** (Governance, Risk, Compliance) | Chính sách, tuân thủ chuẩn (ISO 27001, PCI-DSS)       | Quản lý rủi ro, audit, viết chính sách              | Compliance Analyst                  |
| **Network Security**                   | Bảo vệ hạ tầng mạng                                   | Firewall, VPN, IDS/IPS, routing                     | Network Security Engineer           |

```
                           AN TOÀN THÔNG TIN
                                  │
     ┌────────────────────────────┼─────────────────────────────┐
     │                            │                             │
  Kiến thức nền              Các lĩnh vực                  Thực hành
     │                            │                             │
Networking                 Offensive Security          CTF
Operating System           Defensive Security          TryHackMe
Linux                      Digital Forensics           HackTheBox
Programming                Malware Analysis           PortSwigger
Database                   Cloud Security             Labs
Web                        Application Security
Cryptography               DevSecOps
```




## An toàn thông tin không chỉ là "hack" (tấn công) mà là một hệ sinh thái khổng lồ xoay quanh việc bảo vệ dữ liệu và hệ thống.
![[Roadmap-1784706274078.webp]]

### 1. Nguyên lý cốt lõi: Tam giác CIA (The CIA Triad)

![[Roadmap-1784706313436.webp|354]]

<mark style="background:rgba(3, 135, 102, 0.2)">Mọi hoạt động trong InfoSec</mark>, dù là tấn công hay phòng thủ, đều <mark style="background:rgba(3, 135, 102, 0.2)">xoay quanh việc bảo vệ hoặc phá vỡ</mark> 3 yếu tố này:
- **Confidentiality (Tính bảo mật):** Đảm bảo thông tin <mark style="background:#d3f8b6">chỉ những người có quyền mới được xem</mark>. (Ví dụ: Ngăn chặn lộ lọt data khách hàng).
- **Integrity (Tính toàn vẹn):** Đảm bảo <mark style="background:#d3f8b6">dữ liệu không bị thay đổi trái phép</mark>. (Ví dụ: Ngăn hacker sửa đổi số dư tài khoản ngân hàng).
- **Availability (Tính sẵn sàng):** <mark style="background:#d3f8b6">Đảm bảo hệ thống luôn hoạt động</mark> khi người dùng hợp lệ cần. (Ví dụ: Chống lại các cuộc tấn công DDoS làm sập web).

### 2. Các phân khu chính trong An toàn thông tin

![[Foundation-1784709962183.webp]]

Trong ngành này, <mark style="background:rgba(3, 135, 102, 0.2)">người ta thường chia các mảng theo "màu áo" (Color Teams)</mark>.
#### <font color="#ff0000">Red Team (Offensive Security - Tấn công)</font>
![[Foundation-1784706531020.webp|308x308]]
Đây là phe <mark style="background:#d3f8b6">chuyên đi tìm lỗ hổng và mô phỏng các cuộc tấn công thực tế</mark> => để kiểm tra độ an toàn của hệ thống.

- **<ruby>Penetration<rt>pe nơ trây sần: xâm nhập</rt></ruby>  Testing (Pentest):** Đánh giá bảo mật mạng, hệ thống, ứng dụng. 
	- Dịch ra tiếng Việt là **Kiểm thử xâm nhập** là <mark style="background:#d3f8b6">quá trình mô phỏng các cuộc tấn công mạng thực tế một cách hợp pháp và được cấp phép vào một hệ thống máy tính</mark>, mạng lưới, hoặc ứng dụng web.

- **Vulnerability Assessment:** Quét và đánh giá lỗ hổng tự động (dùng Nessus, Acunetix).
- **Bug Bounty:** Tìm lỗi săn tiền thưởng trên các nền tảng (HackerOne, Bugcrowd).

#### <font color="#00b0f0">Blue Team (Defensive Security - Phòng thủ)</font>

![[Foundation-1784706718384.webp|376x235]]


Phe <mark style="background:#d3f8b6">chịu trách nhiệm bảo vệ, giám sát và phản ứng với các cuộc tấn công</mark>.
- **SOC (Security Operations Center):** Giám sát an ninh 24/7.
- **Incident Response (IR):** Điều tra và xử lý sự cố khi bị hack (như việc phát hiện và gỡ bỏ _Webshell_ mà bạn đã đề cập).
- **Threat Hunting:** Chủ động đi tìm các mối đe dọa đang ẩn nấp trong hệ thống.

#### <font color="#8064a2">Purple Team / AppSec / DevSecOps (Giao thoa Phát triển & Bảo mật)</font>

![[Foundation-1784707204154.webp|510x348]]

Đây là mảng kết hợp giữa tư duy làm ra sản phẩm (Builder) và tư duy phá sản phẩm (Breaker). **<mark style="background:#affad1">Sự pha trộn giữa cả Red Team và Blue Team</mark>**.
- **Application Security (AppSec):** Đảm bảo mã nguồn và cấu trúc ứng dụng an toàn ngay từ khi viết code (Secure SDLC).
- **DevSecOps:** Tích hợp các công cụ kiểm tra bảo mật (SAST/DAST) tự động vào đường ống CI/CD.

> **Lợi thế:** Với nền tảng kiến trúc backend, tư duy hệ thống và thiết kế API vững chắc, đây là mảng bạn có thể tỏa sáng nhất. Việc hiểu rõ cách hệ thống (như database, cache, message broker) giao tiếp với nhau giúp bạn tìm ra những lỗ hổng logic (Business Logic Flaws) mà các công cụ quét tự động thường bỏ sót.

#### <font color="#245bdb">GRC (Governance, Risk, and Compliance - Quản trị, Rủi ro & Tuân thủ)</font>

Mảng làm việc nhiều với giấy tờ, quy trình, tiêu chuẩn (ISO 27001, PCI-DSS) để đảm bảo doanh nghiệp tuân thủ luật pháp và tiêu chuẩn bảo mật.

### 3. Nhìn lại lộ trình dưới góc độ bao quát

![[Foundation-1784707978125.webp]]

Lộ trình bạn cấu trúc đang đi theo một trục rất chuẩn và thực tế cho một kỹ sư muốn chuyển hướng hoặc trang bị thêm kỹ năng AppSec/Pentest:

1. **Giai đoạn 1 (Nền tảng):** Chơi ở tầng **Network & System**. Bạn không thể hack hoặc bảo vệ một hệ thống nếu không biết cách các gói tin TCP/IP di chuyển, hoặc cách phân quyền user trên Linux.
2. **Giai đoạn 2 (Web Security):** Đánh trực diện vào tầng **Application**. Việc làm chủ Burp Suite và hiểu sâu OWASP Top 10 là vũ khí sắc bén nhất. Các lỗ hổng như SQLi, XSS, IDOR (Broken Access Control) chính là những gì diễn ra ở đây.
3. **Giai đoạn 3 (Pentest mở rộng):** Trang bị thêm tư duy và bộ công cụ của một **Hacker mũ trắng** toàn diện. Không chỉ dùng công cụ, mà hiểu quy trình từ lúc dò quét (Reconnaissance) đến lúc khai thác (Exploitation) và duy trì quyền truy cập (Maintaining Access).


![[Foundation-1784707099718.webp|443|615x448]]

=> Dựa vào bản mô tả công việc (JD) trong ảnh, vị trí này là một **sự pha trộn giữa cả Red Team và Blue Team**. Trong ngành An toàn thông tin, những vị trí yêu cầu kỹ năng giao thoa như thế này thường được gọi là **Purple Team** hoặc Kỹ sư An toàn thông tin tổng hợp (General Security Engineer).

### 🔴 Các yêu cầu thuộc mảng Red Team (Tấn công / Kiểm thử)

- **Đánh giá ATTT:** Chủ động đi tìm lỗ hổng trên thiết bị, ứng dụng, mạng.
- **Sử dụng công cụ tấn công/dò quét:** Nmap, Nessus (vulnerability scanner) và đặc biệt là Burp Suite (công cụ số 1 cho Web Pentest).
- **Đánh giá Whitebox:** Yêu cầu đọc hiểu mã nguồn để tìm lỗi từ bên trong (rất gần với AppSec).
- **Tư duy tấn công:** Tự nghiên cứu kỹ thuật tấn công mới qua TryHackMe, HackTheBox.
- **Chứng chỉ:** Ưu tiên OSCP (chứng chỉ thực hành rất có giá trị của Red Team) và CEH.

### 🔵 Các yêu cầu thuộc mảng Blue Team (Phòng thủ / Phản ứng sự cố)

- **Nhận diện và phân tích Webshell:** Đây là công việc rà soát và điều tra sự cố (Incident Response / Threat Hunting) khi hệ thống có dấu hiệu bị xâm nhập.
- **Cách khắc phục lỗ hổng:** Không chỉ biết tìm ra OWASP Top 10, mà phải biết tư vấn cách vá lỗi (Remediation).
- **Vận hành và xử lý:** Triển khai công cụ bảo mật và trực tiếp xử lý các sự cố bảo mật.
- **Chứng chỉ:** Ưu tiên CND (Certified Network Defender - thiên về phòng thủ) và Security+ (chứng chỉ nền tảng tổng hợp).

**Tóm lại:** Vị trí này nghiêng nhiều hơn về công tác kiểm thử (Red/AppSec) trong các công việc hàng ngày, nhưng khi hệ thống có biến (ví dụ: bị upload webshell), bạn sẽ phải lập tức đội mũ xanh (Blue) vào để phân tích và xử lý sự cố.