# 🛡️ Firewall — Lọc lưu lượng mạng

## 1. Firewall là gì?
Firewall (Tường lửa) là một hệ thống bảo mật mạng dựa trên phần cứng hoặc phần mềm (hoặc kết hợp cả hai), có chức năng giám sát, kiểm soát và lọc lưu lượng mạng vào (inbound) và ra (outbound) dựa trên một bộ quy tắc bảo mật được thiết lập trước (security rules). 

**Analogy đơn giản:**
Hãy tưởng tượng mạng nội bộ (Internal Network) của bạn là một tòa nhà văn phòng và Internet là đường phố công cộng bên ngoài. Firewall đóng vai trò như một **nhân viên bảo vệ (Security Guard)** ở cửa ra vào.
- Nếu nhân viên tòa nhà muốn ra ngoài ăn trưa (Outbound traffic), bảo vệ sẽ kiểm tra thẻ và ghi nhận.
- Nếu một người lạ từ ngoài muốn vào tòa nhà (Inbound traffic), bảo vệ sẽ hỏi: "Anh có hẹn trước không?", "Anh gặp ai, tầng mấy?". Nếu nằm trong danh sách được phép (Allow Rules), họ được vào; nếu không, họ bị chặn lại (Block Rules).

## 2. Mục đích của Firewall

| Mục đích | Giải thích chi tiết |
| :--- | :--- |
| **Bảo vệ mạng nội bộ** | Ngăn chặn các truy cập trái phép từ Internet hoặc các mạng không tin cậy vào hệ thống mạng nội bộ. |
| **Kiểm soát truy cập** | Quản lý và giới hạn những người dùng, dịch vụ, hoặc ứng dụng nào được phép truy cập ra bên ngoài hoặc nhận kết nối từ bên ngoài. |
| **Lọc lưu lượng độc hại** | Ngăn chặn các loại mã độc, virus, trojan lây lan qua các cổng dịch vụ không bảo mật. |
| **Theo dõi và ghi log** | Ghi lại lịch sử (logging) các kết nối mạng, hỗ trợ điều tra sự cố bảo mật (Forensics) và giám sát băng thông. |
| **Đảm bảo tính riêng tư** | Ẩn các thông tin về cấu trúc mạng nội bộ (thông qua NAT tích hợp) khỏi sự dòm ngó của kẻ tấn công bên ngoài. |

## 3. Phân loại Firewall

### 3.1 Theo hình thức triển khai

#### a. Hardware Firewall (Tường lửa phần cứng)
- **Định nghĩa:** Là một thiết bị vật lý chuyên dụng (Appliance) độc lập, được đặt giữa mạng nội bộ và Internet (thường đứng sau hoặc tích hợp trên Router).
- **Ví dụ:** Cisco ASA, Fortinet FortiGate, Palo Alto Networks, pfSense (khi cài trên bare-metal).
- **Ưu điểm:** Hiệu suất cao, không tiêu tốn tài nguyên của máy chủ, bảo vệ toàn bộ mạng.
- **Nhược điểm:** Chi phí đầu tư ban đầu cao, cần không gian Rack và kỹ năng cấu hình phần cứng.

#### b. Software Firewall (Tường lửa phần mềm)
- **Định nghĩa:** Là phần mềm cài đặt trực tiếp trên một hệ điều hành (Host-based) của máy tính cá nhân hoặc máy chủ.
- **Ví dụ:** Windows Defender Firewall, iptables (Linux), UFW, ZoneAlarm.
- **Ưu điểm:** Giá thành rẻ (hoặc miễn phí đi kèm HĐH), dễ cấu hình linh hoạt cho từng thiết bị cụ thể.
- **Nhược điểm:** Tiêu thụ tài nguyên CPU/RAM của hệ thống, chỉ bảo vệ được máy tính đó (trừ khi máy tính đóng vai trò là Gateway).

#### c. Cloud Firewall (FWaaS - Firewall as a Service)
- **Định nghĩa:** Tường lửa được cung cấp dưới dạng dịch vụ trên nền tảng điện toán đám mây.
- **Ví dụ:** AWS Network Firewall, Azure Firewall, Cloudflare WAF.
- **Ưu điểm:** Khả năng mở rộng không giới hạn (Scalability), tính sẵn sàng cao, không cần bảo trì phần cứng vật lý.
- **Nhược điểm:** Phụ thuộc vào nhà cung cấp dịch vụ, chi phí thuê bao tính theo tháng/năm hoặc lưu lượng.

---

### 3.2 Theo cách hoạt động (Kiến trúc)

#### a. Packet Filtering Firewall (Tường lửa lọc gói tin)
Thế hệ Firewall đầu tiên. Hoạt động ở tầng Network và Transport (Layer 3 & 4 của OSI).
- **Cách hoạt động:** Kiểm tra từng gói tin (packet) đơn lẻ dựa trên: Địa chỉ IP nguồn/đích, Cổng (Port) nguồn/đích, Giao thức (TCP/UDP/ICMP). Không quan tâm đến trạng thái của kết nối.
- **Sơ đồ:**
```text
[Internet] --> [Packet] --> | Firewall | --> [Kiểm tra Rule: IP, Port] --> Allow/Drop
```
- **Ưu điểm:** Rất nhanh, ít độ trễ, ít tốn tài nguyên.
- **Nhược điểm:** Dễ bị đánh lừa (IP Spoofing), không hiểu ngữ cảnh của ứng dụng.

#### b. Stateful Inspection Firewall (Tường lửa kiểm tra trạng thái)
Thế hệ thứ hai. Hoạt động từ Layer 3 đến Layer 4, có theo dõi thông tin ở Layer 5.
- **Cách hoạt động:** Không chỉ kiểm tra thông tin tĩnh (IP, Port) mà còn theo dõi **trạng thái** của các kết nối (State Table). Nếu một máy tính bên trong chủ động tạo kết nối ra ngoài (vd: TCP SYN), firewall sẽ tự động mở cổng cho gói tin phản hồi (TCP SYN-ACK) đi vào mà không cần tạo rule Inbound rườm rà.
- **Sơ đồ:**
```text
Inside Client ---[TCP SYN]---> | Firewall (Lưu State) | ---[TCP SYN]---> Outside Server
Inside Client <---[SYN-ACK]--- | Firewall (Match State)| <---[SYN-ACK]--- Outside Server
```
- **Ưu điểm:** Bảo mật tốt hơn Packet Filtering, thông minh hơn.
- **Nhược điểm:** Nếu bảng trạng thái (State Table) đầy, firewall có thể bị tấn công DoS.

#### c. Application Layer / Proxy Firewall (Tường lửa lớp ứng dụng)
Hoạt động ở Layer 7 của mô hình OSI.
- **Cách hoạt động:** Đóng vai trò là trung gian (Proxy) giữa Client và Server. Nó có thể "mở" gói tin ra và đọc hiểu nội dung của giao thức (ví dụ: HTTP, FTP, SMTP). Nó có thể block một lệnh cụ thể (ví dụ: cấm tải lên file .exe qua HTTP).
- **Ưu điểm:** Bảo mật cực cao, ngăn chặn được mã độc giấu trong tải trọng (payload).
- **Nhược điểm:** Xử lý chậm, gây độ trễ (latency), tốn rất nhiều tài nguyên.

#### d. Next-Generation Firewall (NGFW - Tường lửa thế hệ mới)
Thế hệ firewall hiện đại nhất hiện nay.
- **Cách hoạt động:** Tích hợp Stateful Inspection với Application Intelligence (nhận diện ứng dụng - ví dụ: phân biệt được traffic của Skype và Facebook dù cùng dùng chung cổng 443 HTTPS), kết hợp với IPS (Hệ thống phòng chống xâm nhập), Antivirus, Deep Packet Inspection (DPI).
- **Ví dụ:** Palo Alto, FortiGate, Check Point.

---

## 4. Windows Firewall with Advanced Security (WFAS)

Trong Windows Server (và Windows 10/11), tường lửa tích hợp là một **Software Firewall** loại **Stateful Inspection**. Trình quản lý nâng cao được gọi là **Windows Defender Firewall with Advanced Security (WFAS)**.

### 4.1 Firewall Profiles (Cấu hình Tường lửa)
Windows Firewall sử dụng khái niệm **Network Location Awareness (NLA)** để tự động áp dụng các bộ quy tắc (Profile) khác nhau tùy thuộc vào loại mạng mà server đang kết nối:

1. **Domain Profile:** Áp dụng khi máy tính được gia nhập (join) vào một Active Directory Domain và có thể kết nối được tới Domain Controller. (Tin cậy nhất, thường mở nhiều port nội bộ).
2. **Private Profile:** Áp dụng cho mạng nội bộ (mạng nhà, mạng văn phòng không có Domain) khi người dùng chọn "Trust this network".
3. **Public Profile:** Áp dụng khi kết nối vào các mạng công cộng (Quán Cafe, Sân bay, Khách sạn). (Bảo mật khắt khe nhất, mặc định block hầu hết Inbound).

> [!NOTE] 
> Một máy tính có thể có nhiều card mạng (NIC) và mỗi card có thể được gán một Profile khác nhau cùng lúc.

### 4.2 Inbound vs Outbound Rules
- **Inbound Rules (Luật vào):** Kiểm soát traffic từ bên ngoài cố gắng kết nối *vào* máy chủ. 
  - *Mặc định:* **Block all** (Chặn tất cả kết nối Inbound không khớp với bất kỳ Allow Rule nào).
- **Outbound Rules (Luật ra):** Kiểm soát traffic từ máy chủ khởi tạo kết nối ra bên ngoài.
  - *Mặc định:* **Allow all** (Cho phép tất cả kết nối Outbound không khớp với bất kỳ Block Rule nào).

### 4.3 Các tiêu chí cấu hình Rule
Một Rule trong WFAS có thể được cấu hình cực kỳ chi tiết dựa trên:
- **Program:** Chỉ định file `.exe` cụ thể (ví dụ: `C:\nginx\nginx.exe`).
- **Protocol and Ports:** Giao thức (TCP, UDP, ICMPv4/v6) và số hiệu Cổng (Local Port, Remote Port).
- **Scope (IP Address):** Địa chỉ IP nguồn (Local) và đích (Remote) - có thể là một IP, một dải mạng (Subnet) hoặc các địa chỉ định sẵn (Local subnet, Internet, DNS servers).
- **Advanced / Interface:** Chỉ áp dụng Rule cho một loại card mạng cụ thể (LAN, Wireless, Remote Access/VPN).
- **Services:** Áp dụng cho một dịch vụ hệ thống của Windows (Windows Service) mà không cần biết file thực thi nằm ở đâu.

### 4.4 Connection Security Rules (IPsec)
Khác với Firewall Rules thông thường (chỉ là Allow/Block), **Connection Security Rules** không chặn giao tiếp mà nó **bắt buộc** luồng giao tiếp giữa hai máy tính phải được xác thực (Authentication) hoặc mã hóa (Encryption) bằng giao thức **IPsec**.
- Ví dụ: Bắt buộc mọi giao tiếp giữa Web Server và SQL Server phải được mã hóa bằng IPsec để tránh bị nghe lén (Sniffing) trên đường truyền nội bộ.

---

### 4.5 Cấu hình Firewall bằng Command Line

#### a. Sử dụng PowerShell (Khuyên dùng trong Windows Server hiện đại)

```powershell
# Xem tất cả các Firewall Rule hiện có (có lọc bằng tên)
Get-NetFirewallRule -DisplayName "File and Printer Sharing*"

# Tạo một Inbound Rule mới cho Web Server (HTTP - Port 80)
New-NetFirewallRule -DisplayName "Allow Web HTTP" `
                    -Direction Inbound `
                    -Action Allow `
                    -Protocol TCP `
                    -LocalPort 80 `
                    -Profile Domain,Private

# Block (Chặn) ứng dụng ping (ICMPv4) đi vào
New-NetFirewallRule -DisplayName "Block Ping Inbound" `
                    -Direction Inbound `
                    -Action Block `
                    -Protocol ICMPv4 `
                    -IcmpType 8

# Disable / Enable một Rule đã có
Disable-NetFirewallRule -DisplayName "Allow Web HTTP"
Enable-NetFirewallRule -DisplayName "Allow Web HTTP"

# Xóa một Rule
Remove-NetFirewallRule -DisplayName "Block Ping Inbound"

# Xem trạng thái của các Firewall Profiles
Get-NetFirewallProfile | Format-Table Name, Enabled, DefaultInboundAction, DefaultOutboundAction
```

#### b. Sử dụng netsh advfirewall (Command Prompt - Legacy)

```cmd
:: Bật Firewall cho mọi profile
netsh advfirewall set allprofiles state on

:: Mở port 3389 cho RDP
netsh advfirewall firewall add rule name="Allow RDP" dir=in action=allow protocol=TCP localport=3389

:: Xóa rule
netsh advfirewall firewall delete rule name="Allow RDP"
```

## 5. Triển khai Firewall Rules qua Group Policy (GPO)
Trong môi trường Doanh nghiệp (Active Directory), Admin không đi cấu hình Firewall từng máy một mà sử dụng **Group Policy** để triển khai hàng loạt.

- **Đường dẫn trong GPMC (Group Policy Management Console):**
  `Computer Configuration` -> `Policies` -> `Windows Settings` -> `Security Settings` -> `Windows Defender Firewall with Advanced Security`
- **Cách thức hoạt động:** Các rules tạo trong GPO sẽ được đẩy xuống các máy Client/Server. Rules từ GPO có độ ưu tiên cao hơn Local Rules (nếu có xung đột, tùy thuộc vào cấu hình "Rule Merging").

> [!TIP]
> **Best Practice GPO:** Nên tắt tính năng "Local firewall rules apply" trong Group Policy Properties nếu bạn muốn môi trường an toàn tuyệt đối, tránh việc Local Admin trên máy trạm tự tạo rule mở port trái phép.

## 6. Bảng so sánh các loại Firewall theo chức năng

| Tiêu chí | Packet Filtering | Stateful Inspection | Proxy / App Layer | NGFW |
| :--- | :--- | :--- | :--- | :--- |
| **OSI Layer** | 3 & 4 | 3, 4 (và trạng thái L5) | 7 | 3 -> 7 |
| **Kiểm tra trạng thái** | ❌ Không | ✅ Có | ✅ Có | ✅ Có |
| **Nhận diện ứng dụng** | ❌ Không | ❌ Không | ✅ Có | ✅ Có (Deep Packet) |
| **Tích hợp IPS/AV** | ❌ Không | ❌ Không | Tùy loại | ✅ Có |
| **Hiệu năng / Tốc độ** | Rất cao | Cao | Thấp | Khá cao (Nhờ phần cứng chuyên dụng) |

## 7. Best Practices (Thực hành Tốt nhất)

1. **Deny by Default:** Nguyên tắc cốt lõi: Block TẤT CẢ các truy cập Inbound, chỉ Allow một số port/service thực sự cần thiết (Implicit Deny).
2. **Càng cụ thể càng tốt:** Khi tạo rule, đừng mở cho IP `Any`. Hãy giới hạn cụ thể IP nguồn được phép truy cập (VD: Chỉ mạng LAN của IT mới được SSH/RDP vào Server).
3. **Quản lý tập trung qua GPO:** Sử dụng Group Policy để đồng bộ Firewall rules cho toàn bộ hệ thống Server/Client thay vì làm thủ công.
4. **Không bao giờ tắt Firewall hoàn toàn:** Ngay cả khi đang troubleshoot lỗi kết nối, đừng tắt hẳn Firewall. Hãy dùng logs hoặc audit mode để kiểm tra rule nào đang block.
5. **Thường xuyên Audit (Kiểm toán) Rules:** Định kỳ rà soát và xóa các rule cũ, rule của nhân viên đã nghỉ việc, hoặc rule tạo tạm thời để test.
6. **Bảo vệ ICMP thận trọng:** Cân nhắc việc chặn Ping (ICMP) từ Internet vào để tránh bị dò quét (reconnaissance), nhưng nên mở Ping nội bộ để dễ dàng xử lý sự cố.
7. **Sử dụng IPS/IDS bổ trợ:** Software Firewall của Windows không phải là NGFW. Nên đặt Server phía sau một Hardware Firewall/NGFW ở biên mạng.
8. **Logging (Ghi nhật ký):** Kích hoạt tính năng log cho "Dropped packets" trong WFAS Profile Properties để phân tích khi có sự cố mạng hoặc nghi ngờ bị tấn công.

## 8. Câu hỏi ôn tập

1. Sự khác biệt chính giữa Packet Filtering và Stateful Inspection Firewall là gì?
2. Trong Windows Firewall, hành vi mặc định đối với Inbound Traffic và Outbound Traffic là gì?
3. Khi Server join vào Domain, Firewall profile nào sẽ tự động được kích hoạt?
4. Lệnh PowerShell nào được dùng để tạo một rule chặn port 21 (FTP) từ bên ngoài vào máy chủ?
5. GPO đường dẫn nào dùng để cấu hình Windows Firewall tập trung cho hệ thống mạng Domain?
6. Connection Security Rules khác với Inbound/Outbound Rules ở điểm nào?
7. Tại sao NGFW lại an toàn hơn Stateful Firewall truyền thống?

---
**Liên kết mở rộng:**
[[ACL]] · [[IDS]] · [[IPS]] · [[DMZ]] · [[VPN]] · [[Segmentation]]
