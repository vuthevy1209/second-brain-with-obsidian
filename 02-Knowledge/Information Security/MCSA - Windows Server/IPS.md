# 🛡️ IPS (Intrusion Prevention System) - Hệ thống Phòng chống Xâm nhập

## 1. IPS là gì?
**IPS (Intrusion Prevention System)** là một hệ thống bảo mật mạng hoạt động như một lớp phòng thủ chủ động, liên tục giám sát mạng hoặc hệ thống để tìm kiếm các hoạt động độc hại và **tự động thực hiện các hành động để ngăn chặn (block/drop)** những hành vi đó trước khi chúng có thể gây hại. 

Nếu như IDS (Intrusion Detection System) chỉ mang tính chất phát hiện và cảnh báo, thì IPS là sự tiến hóa vượt bậc với khả năng can thiệp trực tiếp vào luồng dữ liệu (traffic flow).

> **💡 Analogy (Ví dụ minh họa):** 
> - **IDS** giống như một chiếc camera an ninh: Nó ghi hình lại cảnh có kẻ trộm đột nhập và phát còi báo động, nhưng kẻ trộm vẫn có thể lấy đồ đi mất.
> - **IPS** giống như một nhân viên bảo vệ được trang bị vũ khí: Khi thấy kẻ đột nhập, bảo vệ không chỉ thổi còi cảnh báo mà còn lao ra khống chế, còng tay kẻ gian, bảo vệ an toàn tuyệt đối cho tài sản.

---

## 2. IDS vs IPS: Sự khác biệt cốt lõi

Sự khác biệt lớn nhất giữa IDS và IPS nằm ở **vị trí triển khai (Deployment Location)** và **khả năng can thiệp (Action)**.

### Bảng so sánh chi tiết: IDS và IPS

| Tiêu chí | IDS (Intrusion Detection System) | IPS (Intrusion Prevention System) |
| :--- | :--- | :--- |
| **Chức năng chính** | Phát hiện (Detect) & Cảnh báo (Alert) | Phát hiện (Detect) & Ngăn chặn (Prevent) |
| **Vị trí triển khai** | Out-of-band / Passive (Bên ngoài luồng dữ liệu, nhận bản sao dữ liệu qua SPAN/Mirror port) | Inline / Active (Nằm trực tiếp trên luồng dữ liệu, mọi traffic phải đi qua nó) |
| **Tác động đến mạng** | Không làm chậm mạng, không ảnh hưởng trực tiếp nếu hệ thống lỗi | Có thể tăng độ trễ (latency), nếu lỗi có thể gây gián đoạn mạng (Single point of failure) |
| **Hành động khi phát hiện** | Ghi log, gửi alert cho SIEM/Admin | Drop packet, Block IP, Reset connection |
| **False Positives** | Gây phiền toái (Alert fatigue) | Nguy hiểm (Có thể chặn traffic hợp lệ, gây gián đoạn dịch vụ) |
| **Bảo vệ chống Zero-day** | Không bảo vệ ngay lập tức được | Có thể ngăn chặn ngay lập tức nếu dựa trên Anomaly/Behavior |

### Sơ đồ vị trí (ASCII Art Diagram)

**1. Mô hình IDS (Out-of-band / Passive Mode):**
```text
      Internet
         |
    [ Firewall ] 
         |
         +----------------(SPAN / Port Mirror)----------------+
         |                                                    |
         v                                                    v
[ Core Switch ] ====================================> [ IDS Sensor ]
         |                                           (Chỉ nhận copy,
         v                                            không can thiệp)
[ Internal Network ]
```

**2. Mô hình IPS (Inline / Active Mode):**
```text
      Internet
         |
    [ Firewall ] 
         |
         v (Mọi traffic BẮT BUỘC đi qua IPS)
  [ IPS Appliance ] ---- (Nếu phát hiện độc hại -> DROP)
         |
         v (Traffic sạch được cho đi tiếp)
[ Core Switch ]
         |
         v
[ Internal Network ]
```

---

## 3. Phân loại IPS

Hệ thống IPS được phân loại dựa trên **vị trí bảo vệ** và **phương pháp phát hiện**.

### 3.1. Phân loại theo vị trí bảo vệ

*   **NIPS (Network Intrusion Prevention System):**
    *   Giám sát toàn bộ luồng giao thông mạng. Thường được đặt ở các chokepoint (điểm nghẽn) như sau Firewall chính hoặc trước các phân vùng quan trọng (DMZ).
    *   **Phạm vi:** Toàn bộ network segment.
*   **HIPS (Host Intrusion Prevention System):**
    *   Phần mềm cài đặt trực tiếp trên các máy trạm (Endpoint) hoặc máy chủ (Server). Giám sát các tiến trình bộ nhớ, file system, registry và network traffic của riêng máy tính đó.
    *   **Phạm vi:** Một máy tính (Host) cụ thể. WIndows Defender là một ví dụ mạnh mẽ về HIPS.
*   **WIPS (Wireless Intrusion Prevention System):**
    *   Chuyên giám sát mạng không dây (Wi-Fi), phân tích các giao thức chuẩn 802.11 để ngăn chặn Rogue AP, MAC Spoofing, Deauthentication attacks.

### 3.2. Phân loại theo phương pháp phân tích (Detection Methods)

1.  **Signature-based (Dựa trên chữ ký):**
    *   So sánh traffic với một cơ sở dữ liệu các "chữ ký" (mẫu mã độc hoặc kiểu tấn công đã biết).
    *   *Ưu điểm:* Chính xác cao, ít False Positives.
    *   *Nhược điểm:* Không thể phát hiện tấn công Zero-day (chưa có chữ ký).
2.  **Anomaly-based (Dựa trên sự bất thường / Behavior-based):**
    *   Xây dựng một "baseline" (mức cơ sở) của hoạt động mạng bình thường thông qua Machine Learning hoặc thống kê. Bất cứ sai lệch nào so với baseline (ví dụ: bỗng nhiên một server gửi 10GB dữ liệu ra ngoài lúc 2h sáng) sẽ bị chặn.
    *   *Ưu điểm:* Bắt được Zero-day attacks.
    *   *Nhược điểm:* Tỷ lệ False Positives cao, cần thời gian "learning" (huấn luyện).
3.  **Policy-based (Dựa trên chính sách):**
    *   Chỉ cho phép hoặc từ chối các hành động theo quy tắc do quản trị viên đặt ra một cách cứng nhắc (ví dụ: Chặn mọi kết nối Telnet bất kể nội dung là gì).
4.  **Reputation-based (Dựa trên danh tiếng):**
    *   Tích hợp Threat Intelligence để chặn ngay các kết nối đến/từ các địa chỉ IP, Domain đã bị cộng đồng bảo mật đánh dấu là độc hại (Botnet C&C, Malware distribution sites).

---

## 4. Hành động của IPS (IPS Actions/Responses)

Khi một IPS Inline phát hiện traffic độc hại, nó có thể thực hiện một hoặc nhiều hành động sau:

| Action | Mô tả chi tiết |
| :--- | :--- |
| **Drop (Silent Drop)** | Hủy bỏ gói tin ngay lập tức mà không phản hồi lại cho bên gửi. Kẻ tấn công không biết gói tin đã đi đâu (Time out). |
| **Reject (Reset/RST)** | Chặn gói tin và gửi lại một cờ TCP RST (Reset) cho cả Client và Server để ngắt kết nối ngay lập tức một cách "lịch sự". Giúp giải phóng tài nguyên. |
| **Block / Shun** | Chặn hoàn toàn địa chỉ IP của kẻ tấn công trong một khoảng thời gian nhất định (thêm vào Blacklist). |
| **Alert / Log** | Chỉ ghi log và cảnh báo (hoạt động giống như IDS) thường dùng trong quá trình tuning ban đầu. |
| **Allow / Pass** | Bỏ qua và cho phép gói tin đi tiếp (thường dùng cho các ngoại lệ - exceptions). |
| **Rate Limit** | Không chặn hoàn toàn mà bóp băng thông (Throttle) kết nối xuống mức an toàn, hữu ích khi chống DDoS. |
| **Quarantine** | Cách ly Host bị nhiễm bệnh (HIPS) khỏi mạng nội bộ bằng cách đổi VLAN của nó hoặc áp dụng tường lửa nội bộ chặn mọi kết nối trừ kết nối đến Server quản lý. |
| **Redirect** | Chuyển hướng traffic độc hại vào một hệ thống Honeypot để theo dõi và thu thập thêm thông tin tình báo về kẻ tấn công. |

---

## 5. IPS trên Windows Server (HIPS)

Trên môi trường MCSA Windows Server, IPS được hiện thực hóa mạnh mẽ dưới dạng HIPS thông qua hệ sinh thái **Windows Defender / Windows Security** và các công cụ quản lý thực thi ứng dụng.

### 5.1. Windows Defender Exploit Guard (WDEG)

Exploit Guard là tính năng HIPS chủ lực trên Windows Server (từ Server 2016/2019 trở đi). Nó bao gồm 4 thành phần chính:

#### a) Attack Surface Reduction (ASR) Rules
Bộ quy tắc ngăn chặn các kỹ thuật tấn công thường thấy qua tài liệu Office, script, và email.
*   *Ví dụ:* Chặn ứng dụng Office tạo các tiến trình con (child processes), chặn các script obfuscated.
*   **Cấu hình qua PowerShell:**
```powershell
# Bật tính năng ASR bằng PowerShell (Block mode)
# Guid bên dưới là cho rule: "Block all Office applications from creating child processes"
Set-MpPreference -AttackSurfaceReductionRules_Ids D4F940AB-401B-4EFC-AADC-AD5F3C50688A -AttackSurfaceReductionRules_Actions Enabled

# Kiểm tra trạng thái ASR
Get-MpPreference | Select-Object AttackSurfaceReductionRules_Ids, AttackSurfaceReductionRules_Actions
```

#### b) Controlled Folder Access (Bảo vệ chống Ransomware)
Ngăn chặn các ứng dụng không đáng tin cậy mã hóa, sửa đổi hoặc xóa file trong các thư mục quan trọng.
```powershell
# Bật Controlled Folder Access ở chế độ Block
Set-MpPreference -EnableControlledFolderAccess Enabled

# Thêm một thư mục vào danh sách cần bảo vệ nghiêm ngặt
Add-MpPreference -ControlledFolderAccessProtectedFolders "C:\Finance_Data"

# Cho phép (Whitelist) một ứng dụng an toàn ghi vào thư mục đó
Add-MpPreference -ControlledFolderAccessAllowedApplications "C:\Apps\TrustedAccountingApp.exe"
```

#### c) Network Protection (Bảo vệ cấp độ mạng)
Ngăn chặn các ứng dụng trên Windows Server kết nối ra các domain/IP độc hại (Reputation-based HIPS).
```powershell
# Bật Network Protection ở chế độ Block
Set-MpPreference -EnableNetworkProtection Enabled
```

#### d) Exploit Protection
Thay thế EMET cũ, bảo vệ chống lại các lỗ hổng khai thác bộ nhớ (Memory exploitation) như DEP (Data Execution Prevention), ASLR (Address Space Layout Randomization).
```powershell
# Xem cấu hình Exploit Protection hiện tại của hệ thống
Get-ProcessMitigation -System
```

### 5.2. Windows Defender Application Control (WDAC)
Chính sách kiểm soát ứng dụng mạnh mẽ nhất trên Windows. Chuyển mô hình từ "Default Allow" sang "Default Deny" (Trust Nothing). Chỉ những đoạn mã (script/exe) có chữ ký điện tử hợp lệ từ tổ chức (Certificate) hoặc nằm trong Whitelist mới được phép thực thi.

### 5.3. AppLocker
Phiên bản dễ cấu hình hơn của WDAC. Dùng để giới hạn ai (User/Group nào) được phép chạy ứng dụng/script nào dựa trên Path, Publisher (Certificate), hoặc File Hash.
```powershell
# Ví dụ tạo Policy AppLocker qua PowerShell
# Lấy file hiện tại để tạo hash rule
$hash = Get-AppLockerFileInformation -Path "C:\Scripts\AdminScript.ps1"

# Tạo một rule cho phép nhóm "IT Admins" chạy file này dựa trên Hash
New-AppLockerPolicy -RuleType Hash -User "CONTOSO\IT Admins" -Action Allow -FileInformation $hash | Set-AppLockerPolicy -Merge
```

---

## 6. IPS trong NGFW (Next-Generation Firewall)

Trong các hệ thống mạng doanh nghiệp hiện đại, IPS độc lập đang dần biến mất và được tích hợp sâu vào bên trong **NGFW (Next-Generation Firewall)** (hay còn gọi là UTM - Unified Threat Management).

- **Palo Alto Networks:** Tính năng Threat Prevention của họ thực hiện kiểm tra packet chỉ với một lần (Single-pass architecture), giúp IPS chạy tốc độ cao mà không làm chậm mạng.
- **Fortinet (FortiGate):** Sử dụng các chip ASIC chuyên dụng (NP - Network Processors và CP - Content Processors) để offload quá trình xử lý signature của IPS, đảm bảo throughput cực lớn.
- **Cisco Firepower:** Được xây dựng dựa trên engine mã nguồn mở huyền thoại là **Snort**, tích hợp mạnh mẽ với hệ sinh thái tình báo Talos của Cisco.

---

## 7. Deployment Strategy (Chiến lược triển khai IPS)

Triển khai IPS trên mạng thực tế rất nhạy cảm vì nếu cấu hình sai, bạn sẽ "đánh sập" hệ thống nội bộ do False Positives (chặn nhầm traffic hợp lệ).

### 7.1. Chế độ hoạt động (Operation Modes)
- **Inline (Prevention):** Thiết bị đặt trực tiếp trên luồng mạng. Nếu phát hiện vi phạm, packet bị chặn (Block).
- **Inline (Detection/Simulation):** Thiết bị vẫn đặt trên luồng mạng, đi qua thiết bị, nhưng chỉ **Ghi log** và **Cảnh báo** chứ không chặn. Dùng để test cấu hình xem có ảnh hưởng production không.
- **Passive:** Giống như IDS, chỉ nhận bản sao dữ liệu (SPAN).

### 7.2. Fail-Open vs Fail-Close
Vì IPS là một Single Point of Failure, điều gì xảy ra nếu phần cứng IPS bị sập nguồn, quá tải hoặc hỏng phần mềm?
- **Fail-Open (Hardware Bypass):** Khi IPS chết, thiết bị tự động chập mạch các cổng mạng lại với nhau thành một đoạn cáp thẳng. Mạng tiếp tục hoạt động bình thường, nhưng bị mất lớp bảo vệ. (Thường áp dụng cho Doanh nghiệp, ưu tiên Availability).
- **Fail-Close:** Khi IPS chết, mạng bị đứt hoàn toàn. Không có traffic nào được đi qua. (Thường áp dụng cho Ngân hàng, Quân đội, ưu tiên Security tuyệt đối).

### 7.3. Quy trình deploy chuẩn: Detection → Tuning → Prevention
1. **Giai đoạn 1 (Detection Mode):** Đặt IPS ở chế độ chỉ cảnh báo (Alert-only). Giữ nguyên trạng thái từ 2-4 tuần.
2. **Giai đoạn 2 (Tuning):** Phân tích các log. Lọc bỏ các False Positives (Ví dụ: Ứng dụng nội bộ A có hành vi giống mã độc, tạo whitelist cho nó).
3. **Giai đoạn 3 (Prevention Mode):** Khi đã chắc chắn 99% các log cảnh báo là mã độc thật sự, mới chuyển sang chế độ Block.

---

## 8. Snort / Suricata IPS Rules

**Snort** và **Suricata** là 2 engine mã nguồn mở phổ biến nhất cho IPS/IDS. Chúng sử dụng ngôn ngữ viết rules riêng biệt nhưng có cấu trúc tương tự nhau.

### Cú pháp chung của một Rule:
`[Action] [Protocol] [Source IP] [Source Port] -> [Dest IP] [Dest Port] (Options; msg:"Thông báo"; sid:12345;)`

### Các Action phổ biến trong IPS Rules:
- `alert`: Tạo cảnh báo, gói tin vẫn qua được (chế độ IDS).
- `drop`: Chặn gói tin ngay lập tức (không phản hồi).
- `reject`: Chặn gói tin và gửi TCP RST hoặc ICMP Port Unreachable.
- `pass`: Bỏ qua gói tin, cho phép đi qua.

### Ví dụ về IPS Rules:

**1. Chặn (Drop) kết nối SSH từ bên ngoài Internet vào mạng DMZ:**
```text
drop tcp $EXTERNAL_NET any -> $DMZ_NET 22 (msg:"BLOCKED - External SSH attempt to DMZ"; sid:1000001; rev:1;)
```

**2. Gửi Reset (Reject) khi phát hiện dấu hiệu rà quét nmap (XMAS Scan):**
```text
reject tcp any any -> $HOME_NET any (msg:"BLOCKED - Nmap XMAS Scan Detected"; flags:F,P,U; sid:1000002; rev:1;)
```

**3. Tạo ngoại lệ (Pass) cho IP quản trị viên scan mạng nội bộ:**
```text
pass tcp 192.168.1.50 any -> $HOME_NET any (msg:"ALLOW - Admin Scanners"; sid:1000003;)
```

---

## 9. Bảng so sánh: Snort vs Suricata vs Windows Defender vs NGFW IPS

| Tính năng | Snort | Suricata | Windows Defender (HIPS) | NGFW IPS (Palo/Forti) |
| :--- | :--- | :--- | :--- | :--- |
| **Phân loại** | NIPS / NIDS | NIPS / NIDS | HIPS | NIPS (Tích hợp Firewall) |
| **Kiến trúc luồng** | Single-threaded (Bản 2.x) / Multi-threaded (Bản 3) | Multi-threaded (Tối ưu rất tốt cho hệ thống lớn) | Tích hợp sâu vào Kernel Windows | Phần cứng chuyên dụng (ASIC/FPGA) |
| **Giá cả** | Miễn phí (Open-source) | Miễn phí (Open-source) | Kèm theo license Windows | Rất đắt (CapEx + License hằng năm) |
| **Mức độ quản lý** | Phức tạp (CLI, cần tool thứ 3) | Phức tạp (CLI, cần ELK stack) | GPO, Intune, SCCM, PowerShell | Giao diện đồ họa (GUI) trực quan |
| **Ứng dụng chính** | Server Linux/Gateway | Server bảo mật tốc độ cao | Bảo vệ Endpoints/Servers nội bộ | Gateway doanh nghiệp quy mô lớn |

---

## 10. Best Practices khi cấu hình IPS

1.  **Luôn áp dụng "Tuning" thường xuyên:** Update signature liên tục nhưng phải tuning để giảm thiểu False Positives.
2.  **Khởi đầu bằng Monitor/Detection Mode:** Không bao giờ bật Block ngay lập tức trên hệ thống đang chạy (Production) để tránh gián đoạn dịch vụ.
3.  **Tối ưu hóa Rulesets:** Tắt các rule không liên quan đến hệ thống. (Ví dụ: Bạn dùng 100% Windows Server, hãy tắt các rule IPS quét lỗ hổng của Linux/Apache để tăng tốc độ xử lý).
4.  **Bảo vệ IPS bằng mã hóa SSL/TLS Inspection:** 80% traffic hiện nay là HTTPS. Nếu IPS không giải mã SSL, nó sẽ mù hoàn toàn. Cần cấu hình SSL Decryption trên Firewall/IPS.
5.  **Placement hợp lý:** Không đặt IPS ngoài cùng (trước Firewall). Đặt IPS *sau* Firewall để Firewall drop bớt các traffic rác (DDoS, port scan), giúp IPS tập trung CPU phân tích các payload phức tạp.
6.  **Sử dụng Hardware Bypass:** Đảm bảo IPS có module Fail-Open để mạng không bị chết khi IPS treo.
7.  **Kết hợp Anomaly & Signature:** Bật cả 2 tính năng, nhưng Alert cho Anomaly và Block cho Signature (đã chắc chắn).
8.  **Tích hợp SIEM:** Đổ log của IPS/HIPS vào hệ thống SIEM tập trung (như Splunk, ELK) để có cái nhìn toàn cảnh về các chuỗi tấn công (Kill Chain).
9.  **Triển khai HIPS (WDEG) trên máy chủ:** Dù có NGFW IPS ở vòng ngoài, máy chủ nội bộ vẫn cần Windows Defender Exploit Guard để chống lại các cuộc tấn công lây lan nội bộ (Lateral Movement).
10. **Phân đoạn mạng (Segmentation):** Áp dụng IPS giữa các phân vùng mạng khác nhau (VD: giữa LAN và DMZ) chứ không chỉ ở biên mạng.

---

## 11. Câu hỏi ôn tập (Review Questions)

1. Sự khác biệt mang tính quyết định giữa IDS và IPS là gì? Tại sao doanh nghiệp lại thích IPS hơn?
2. Nêu ưu điểm và nhược điểm của phương pháp phát hiện dựa trên bất thường (Anomaly-based) so với Dựa trên chữ ký (Signature-based).
3. Khi IPS cấu hình chế độ Fail-Open, điều gì xảy ra khi hệ thống IPS bị sập nguồn?
4. Trong các hành động của IPS, sự khác nhau giữa **Drop** và **Reject** là gì? Khi nào nên dùng cái nào?
5. Trong Windows Server, làm thế nào để ngăn chặn Ransomware mã hóa các thư mục nhạy cảm? Sử dụng tính năng nào của WDEG?
6. Bạn đang viết một script PowerShell để cấu hình ASR Rules. Làm thế nào để lấy danh sách các Rule hiện đang được kích hoạt?
7. Giải thích tại sao việc bật Block Mode ngay lập tức cho IPS trên một hệ thống đang hoạt động ổn định là một ý tồi. Nêu quy trình chuẩn.
8. Viết một quy tắc Snort/Suricata đơn giản để ngăn chặn (drop) mọi kết nối TCP từ bên ngoài vào port 3389 (RDP) của mạng nội bộ.

---

## 12. Liên kết mở rộng (Obsidian Links)

- [[Firewall]] - Tường lửa (thường tích hợp chung IPS tạo thành NGFW)
- [[ACL]] - Access Control Lists (Lớp bảo vệ cơ bản trước khi packet tới IPS)
- [[IDS]] - Intrusion Detection System (Tiền thân của IPS)
- [[DMZ]] - Khu phi quân sự (Nơi bắt buộc phải có hệ thống IPS bảo vệ nghiêm ngặt)
- [[VPN]] - Cần thiết lập IPS scan bên trong đường hầm VPN để chống malware lọt vào từ client từ xa.
- [[Segmentation]] - Phân đoạn mạng (Chiến lược Micro-segmentation kết hợp IPS nội bộ).
