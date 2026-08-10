# 🚨 IDS — Intrusion Detection System (Hệ thống Phát hiện Xâm nhập)

## 1. IDS là gì?

**Intrusion Detection System (IDS)** là một hệ thống hoặc phần mềm giám sát mạng hoặc hệ thống để phát hiện các hoạt động bất thường, vi phạm chính sách, hoặc các dấu hiệu của một cuộc tấn công.

> [!NOTE] Analogy
> Hãy tưởng tượng IDS như **Camera An Ninh** kết hợp với **Hệ thống Chuông Báo Động** trong một tòa nhà. Nó liên tục quan sát (giám sát traffic), nhận diện kẻ trộm (phát hiện chữ ký tấn công) và hú còi (gửi cảnh báo). Tuy nhiên, nó **CHỈ CẢNH BÁO** mà **KHÔNG HÀNH ĐỘNG** (không đóng cửa, không bắt giữ kẻ trộm). Việc ngăn chặn thuộc về bảo vệ hoặc một hệ thống khác (như [[IPS]] - Intrusion Prevention System hoặc [[Firewall]]).

Đặc điểm cốt lõi của IDS là tính năng **Passive (Thụ động)**. Nó lắng nghe các traffic (bằng cách sao chép traffic thông qua port mirroring / SPAN) mà không can thiệp trực tiếp vào dòng dữ liệu.

---

## 2. Tại sao cần IDS?

| Lý do | Mô tả chi tiết |
| :--- | :--- |
| **Nhận diện mối đe dọa sớm** | Firewall thường chỉ chặn dựa trên IP/Port tĩnh. IDS phân tích payload của gói tin để phát hiện malware hoặc exploit đang cố gắng vượt qua lớp phòng thủ vòng ngoài. |
| **Giám sát hoạt động nội bộ** | Kẻ tấn công có thể đã có mặt trong mạng (Insider Threat hoặc Lateral Movement). IDS giúp theo dõi các dấu hiệu này bên trong mạng LAN. |
| **Đáp ứng Compliance (Tuân thủ)** | Các tiêu chuẩn bảo mật như PCI-DSS, HIPAA, ISO 27001 đều yêu cầu hệ thống giám sát liên tục (Continuous Monitoring). |
| **Cung cấp dữ liệu Forensic** | Log từ IDS là nguồn thông tin vô giá khi cần điều tra nguyên nhân, thời gian và phương thức của một cuộc tấn công đã xảy ra. |
| **Tự động hóa cảnh báo** | Liên kết với hệ thống SIEM (Security Information and Event Management) để tự động báo cho Admin khi có các Event quan trọng xảy ra. |

---

## 3. Phân loại IDS

### 3.1. Phân loại theo vị trí triển khai (NIDS vs HIDS)

#### a) NIDS (Network Intrusion Detection System)
Giám sát toàn bộ traffic trên một phân đoạn mạng (network segment). Triển khai ở các điểm choke points (như ngay sau Firewall, trong DMZ).

#### b) HIDS (Host Intrusion Detection System)
Giám sát và phân tích các hoạt động bên trong một máy tính cụ thể (host). Nó kiểm tra các file hệ thống, registry, event logs, chạy các tiến trình (processes) trên hệ điều hành như Windows Server.

```text
========================================================================
                      SƠ ĐỒ TRIỂN KHAI NIDS & HIDS
========================================================================

    [Internet]
        |
        v
  +-----------+
  |  Router   |
  +-----------+
        |
        v
 +=============+
 |  Firewall   |
 +=============+
        |
        +-----> [ NIDS Sensor ] (Port Mirroring/SPAN) - Giám sát toàn bộ mạng
        |
        v
   +---------+ (Core Switch)
   | Switch  |-----------------+
   +---------+                 |
        |                      |
        v                      v
 +--------------+       +--------------+
 | Web Server 1 |       | Web Server 2 |
 |  [ HIDS ]    |       |  [ HIDS ]    |
 +--------------+       +--------------+
 (HIDS theo dõi Log,    (HIDS theo dõi Log,
  File, Registry)        File, Registry)
```

### 3.2. Phân loại theo phương pháp phát hiện

| Phương pháp | Cách thức hoạt động | Ưu điểm | Nhược điểm | Ví dụ |
| :--- | :--- | :--- | :--- | :--- |
| **Signature-based** (Dựa trên chữ ký) | So sánh traffic/log với một cơ sở dữ liệu các "chữ ký" (mẫu) của các cuộc tấn công đã biết. | Nhanh, chính xác cao (ít False Positive) với các mã độc đã biết. | Không thể phát hiện tấn công Zero-day hoặc các biến thể malware mới. | Antivirus truyền thống, Snort rules. |
| **Anomaly-based** (Dựa trên sự bất thường) | Tạo ra một "baseline" (mức cơ sở) cho các hoạt động bình thường. Nếu có gì vượt quá baseline, sẽ cảnh báo. | Phát hiện được các cuộc tấn công chưa từng biết (Zero-day). | Sinh ra nhiều cảnh báo giả (False Positive) do hành vi người dùng thay đổi. | Traffic bình thường là 100MB/s, đột nhiên tăng lên 2GB/s lúc 2h sáng. |
| **Heuristic-based** (Dựa trên hành vi/phân tích) | Dùng các thuật toán, Machine Learning, AI để phân tích hành vi của chuỗi lệnh hoặc mã khả nghi thay vì chỉ so khớp tĩnh. | Thích ứng tốt, kết hợp ưu điểm của cả 2 loại trên. | Đòi hỏi tài nguyên tính toán lớn (CPU/RAM), cần thời gian "huấn luyện" mô hình. | Phát hiện ransomware mã hóa hàng loạt file cùng lúc. |

---

## 4. Kiến trúc của một hệ thống IDS

Một hệ thống IDS hoàn chỉnh thường bao gồm 4 thành phần chính:

1. **Sensor (Cảm biến) / Agent**: Nằm ở các node (mạng hoặc host) để thu thập dữ liệu (Network packets, log files).
2. **Analyzer (Bộ phân tích)**: Nhận dữ liệu từ Sensor, sử dụng các engine (Signature/Anomaly) để phân tích và tìm kiếm dấu hiệu tấn công.
3. **Alert Database (Cơ sở dữ liệu cảnh báo)**: Nơi lưu trữ an toàn các cảnh báo được sinh ra từ Analyzer để phục vụ truy vấn.
4. **Console / Management Interface (Giao diện quản lý)**: Giao diện đồ họa (GUI) cho Administrator theo dõi cảnh báo, cấu hình rule, và tạo report.

---

## 5. IDS trên Windows Server

Trên Windows Server, việc triển khai **HIDS** chủ yếu dựa vào **Windows Event Log** và các chính sách **Audit Policy**. Bản thân Windows OS đã là một Sensor khổng lồ.

### 5.1. Windows Event Log
Hệ thống log cốt lõi của Windows, đặc biệt là log **Security** (Nơi lưu trữ các sự kiện liên quan đến đăng nhập, quyền truy cập file, quản lý tài khoản).
- Cần quyền **Administrator** để đọc Security log.

### 5.2. Cấu hình Audit Policy (Advanced Audit Policy Configuration)
Mặc định, Windows không ghi log tất cả mọi thứ để tiết kiệm tài nguyên. Ta cần bật Audit Policy.
**GUI Step**: `GPO` -> `Computer Configuration` -> `Policies` -> `Windows Settings` -> `Security Settings` -> `Advanced Audit Policy Configuration`

**PowerShell / Command Prompt (auditpol)**:
Kiểm tra cấu hình hiện tại:
```cmd
auditpol /get /category:*
```
Bật theo dõi Logon Thành công & Thất bại (Cực kỳ quan trọng để phát hiện Brute Force):
```cmd
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
```
Bật theo dõi truy cập File/Folder (Cần cấu hình SACL trên thư mục đó nữa):
```cmd
auditpol /set /subcategory:"File System" /success:enable /failure:enable
```

### 5.3. Các Event IDs Quan Trọng Cần Theo Dõi (The "Must-Knows")

| Event ID | Mô tả ý nghĩa (Báo hiệu điều gì) | IDS Alert Context |
| :--- | :--- | :--- |
| **4624** | Successful Logon (Đăng nhập thành công) | Kết hợp với thời gian bất thường hoặc IP lạ (VD: VPN từ quốc gia khác). |
| **4625** | Failed Logon (Đăng nhập thất bại) | Dấu hiệu rõ ràng của Brute Force / Password Spraying nếu số lượng lớn trong thời gian ngắn. |
| **4720** | A user account was created (Tạo tài khoản mới) | Attacker tạo backdoor account (Persistence). |
| **4726** | A user account was deleted (Xóa tài khoản) | Xóa dấu vết. |
| **4732** | A member was added to a security-enabled local group | Privilege Escalation (Đặc quyền leo thang) khi attacker tự add vào group `Administrators`. |
| **4740** | A user account was locked out | Hậu quả của việc Brute Force quá nhiều lần. |
| **1102** | The audit log was cleared (Xóa log Audit) | **CỰC KỲ NGUY HIỂM!** Kẻ tấn công xóa log để che đậy hành vi (Anti-Forensics). |

### 5.4. Truy vấn Log bằng PowerShell

Tìm kiếm các lần đăng nhập thất bại (Event 4625) trong 24 giờ qua:
```powershell
Get-EventLog -LogName Security -InstanceId 4625 -After (Get-Date).AddDays(-1)
# Lưu ý: Get-EventLog là lệnh cũ, tốt hơn nên dùng Get-WinEvent
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625; StartTime=(Get-Date).AddDays(-1)}
```

Lọc các sự kiện xóa Log (Event 1102):
```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=1102}
```

### 5.5. Windows Event Forwarding (WEF)
Trong hệ thống mạng có hàng trăm Windows Server, Admin không thể login từng máy để check log. **WEF** cho phép tập trung toàn bộ Event Logs từ các máy tính (Client/Server) về một máy chủ trung tâm (Windows Event Collector - WEC).
- Yêu cầu cấu hình WinRM (`winrm qc`).
- Giúp bảo vệ Log không bị xóa cục bộ bởi kẻ tấn công.

---

## 6. Sysmon (System Monitor) — HIDS nâng cao cho Windows

Windows Event Log mặc định vẫn thiếu một số thông tin chi tiết (ví dụ: Network connections của từng process, Hash của file thực thi). **Sysmon** (một phần của Sysinternals Suite từ Microsoft) giải quyết vấn đề này. Khi cài đặt, nó hoạt động dưới dạng device driver khởi động cùng hệ thống.

### 6.1. Các Event IDs nổi bật của Sysmon

| Sysmon ID | Ý nghĩa (Phát hiện) |
| :--- | :--- |
| **Event 1** | Process creation (Tạo tiến trình mới) - Có luôn cả CommandLine (như `powershell.exe -enc <base64>`). |
| **Event 3** | Network connection (Kết nối mạng) - Giám sát malware gọi về C2 (Command & Control). |
| **Event 7** | Image loaded (Load DLL) - Phát hiện DLL Hijacking. |
| **Event 8** | CreateRemoteThread - Phát hiện kỹ thuật Process Injection (ví dụ: malware chèn code vào `explorer.exe`). |
| **Event 10** | ProcessAccess - Khi một process đọc bộ nhớ của process khác (như công cụ Mimikatz đọc LSASS để lấy mật khẩu). |
| **Event 11** | FileCreate - Theo dõi file malware được drop xuống đĩa. |
| **Event 22** | DNSEvent - DNS query (Phát hiện truy cập domain độc hại). |

### 6.2. Cài đặt và Cấu hình Sysmon
Tải cấu hình Sysmon từ cộng đồng (ví dụ: cấu hình của SwiftOnSecurity) để tránh nhiễu log (bỏ qua các process an toàn của Windows).
```cmd
sysmon.exe -accepteula -i sysmonconfig-export.xml
```
Cập nhật cấu hình khi đang chạy:
```cmd
sysmon.exe -c sysmonconfig-export.xml
```

---

## 7. Các phần mềm IDS phổ biến

1. **Snort**: Tiên phong mã nguồn mở của Cisco. Sử dụng hệ thống Rule mạnh mẽ. (NIDS).
2. **Suricata**: Mã nguồn mở, hỗ trợ đa luồng (Multi-threading) tốt hơn Snort, phân tích sâu các giao thức. (NIDS/IPS).
3. **Zeek (trước đây là Bro)**: Phân tích mạng theo kiểu giám sát hành vi và giao thức, xuất ra các log định dạng gọn gàng phục vụ phân tích thay vì chỉ cảnh báo. (Network Security Monitor).
4. **OSSEC**: HIDS mã nguồn mở giám sát file integrity, registry, rootkit detection.
5. **Wazuh**: Nền tảng bảo mật mạnh mẽ phát triển từ OSSEC, tích hợp tốt với Elastic Stack, cung cấp cả SIEM/HIDS/EDR.

---

## 8. Các chỉ số đánh giá IDS (The Confusion Matrix)

Khi vận hành IDS, Admin phải đối mặt với các cảnh báo. Chúng được phân thành 4 loại:

| Thuật ngữ | Ý nghĩa | Ví dụ | Mức độ nghiêm trọng |
| :--- | :--- | :--- | :--- |
| **True Positive (TP)** | Tấn công thật + Báo động | Có Brute force -> IDS cảnh báo. | **Lý tưởng, Cần xử lý.** |
| **False Positive (FP)** | **Bình thường** + **Báo động (Báo động giả)** | Admin gõ sai pass 3 lần -> IDS báo bị Brute Force. | **Gây mệt mỏi** (Alert Fatigue) cho SOC team. Cần Tuning rule. |
| **True Negative (TN)** | Bình thường + Không báo động | Người dùng truy cập web bình thường -> Không báo. | **Lý tưởng.** |
| **False Negative (FN)** | **Tấn công thật** + **Không báo động (Bỏ lọt)** | Malware Zero-day vượt qua hệ thống mà IDS im lặng. | **THẢM HỌA (Worst Case)**. Hệ thống bị xâm nhập mà không ai hay biết. |

---

## 9. Các kỹ thuật né tránh IDS (IDS Evasion Techniques)

Kẻ tấn công không muốn bị phát hiện, chúng dùng nhiều kỹ thuật:
1. **Fragmentation (Phân mảnh IP)**: Cắt nhỏ payload độc hại thành nhiều gói tin nhỏ li ti khiến Signature-based IDS không thể ghép lại và không nhận diện được đoạn mã độc.
2. **Encryption (Mã hóa / TLS)**: Bọc payload trong đường hầm HTTPS/VPN. NIDS không có khóa giải mã sẽ không đọc được nội dung (Blind spot). (Cách chống: Dùng SSL Inspection/Decryption).
3. **Obfuscation / Encoding**: Sử dụng Base64, Hex encoding (VD: `%2E%2E%2F` thay vì `../` trong URL) để đánh lừa các quy tắc so khớp chuỗi tĩnh.
4. **Spoofing & Decoy**: Gửi hàng loạt cảnh báo giả (False Positives) từ các IP giả mạo để làm quá tải (DoS) IDS hoặc làm Admin mệt পণ্ডিত mỏi, sau đó mới ẩn giấu tấn công thật (Smokescreen).

---

## 10. Best Practices khi triển khai IDS

- **Tuning (Tinh chỉnh) là bắt buộc**: Không bật toàn bộ rule mặc định. Dành thời gian để tắt các "báo động giả" (False Positives) dựa trên đặc thù môi trường.
- **Bảo vệ Sensor và Log**: Đặt Server thu thập Log (Syslog, WEC) ở một vùng riêng biệt an toàn. Không cấp quyền Admin cho các thiết bị IDS.
- **Kết hợp HIDS và NIDS (Defense in Depth)**: NIDS lo phần mạng, HIDS lo phần Server Endpoint (vì NIDS mù khi gặp traffic mã hóa).
- **Network Segmentation**: Đặt NIDS Sensor ở các ngã tư quan trọng (VD: Giữa Internet và DMZ, Giữa DMZ và Internal LAN).
- **Thường xuyên cập nhật Signature**: Đối với Signature-based, cơ sở dữ liệu mẫu mã độc phải được update hàng ngày/giờ.

---

## 11. Câu hỏi ôn tập

1. Sự khác biệt căn bản giữa IDS và IPS là gì về khả năng phản ứng?
2. Trong mô hình mạng doanh nghiệp, nên đặt NIDS Sensor ở đâu là hợp lý nhất?
3. Tại sao Event ID 1102 trên Windows Server lại được xếp vào mức độ nghiêm trọng (Critical) cần điều tra ngay lập tức?
4. Trình bày khái niệm False Positive và False Negative. Tình huống nào nguy hiểm hơn đối với doanh nghiệp?
5. Kẻ tấn công dùng giao thức HTTPS để truyền tải mã độc. Phương pháp này lợi dụng điểm yếu nào của NIDS thông thường?
6. Lệnh `auditpol` trên Windows Server dùng để làm gì? Nêu cách bật giám sát Logon.
7. Sysmon (Event ID 1) cung cấp thông tin gì quan trọng mà Windows Event ID 4688 (Process Creation) mặc định không có hoặc cấu hình rất phức tạp mới có?
8. Kỹ thuật "Fragmentation" qua mặt IDS như thế nào?

---

**Liên kết mở rộng (Knowledge Graph):**
[[Firewall]] · [[ACL]] · [[IPS]] · [[DMZ]] · [[VPN]] · [[Segmentation]]
