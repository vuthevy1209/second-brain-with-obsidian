# 🛡️ DMZ — Demilitarized Zone (Vùng Đặt Server Public)

## 1. DMZ Là Gì?

**DMZ (Demilitarized Zone - Vùng phi quân sự)** trong mạng máy tính là một mạng con (subnetwork) vật lý hoặc logic trung gian, nằm giữa mạng nội bộ đáng tin cậy (Internal Network) và một mạng không đáng tin cậy (thường là Internet). 

Mục đích chính của DMZ là cung cấp thêm một lớp bảo mật cho mạng nội bộ (LAN). Các dịch vụ mạng và máy chủ cần tiếp xúc với Internet (public-facing) sẽ được đặt trong DMZ. Nếu các máy chủ này bị tấn công và thỏa hiệp (compromised), kẻ tấn công chỉ có quyền truy cập vào DMZ mà không thể thâm nhập sâu vào mạng nội bộ chứa dữ liệu nhạy cảm.

**💡 Analogy (Ví dụ ẩn dụ):** Hãy tưởng tượng một tòa nhà an ninh cao. 
- **Internet** là con đường công cộng bên ngoài.
- **Internal Network (Mạng nội bộ)** là khu vực văn phòng làm việc và két sắt chứa tài liệu mật (chỉ nhân viên được vào).
- **DMZ** chính là **Phòng tiếp tân (Lobby)**. Khách từ ngoài đường (Internet) có thể bước vào sảnh tiếp tân để giao dịch (Web, Mail), nhưng họ bị chặn lại bởi các cửa an ninh và nhân viên bảo vệ (Firewall) không cho phép họ tiến vào khu vực văn phòng làm việc.

---

## 2. Tại Sao Cần DMZ?

Việc thiết lập DMZ là một tiêu chuẩn bảo mật cốt lõi trong kiến trúc mạng doanh nghiệp. Dưới đây là các lý do tại sao chúng ta cần DMZ:

| Tiêu chí | Lợi ích khi sử dụng DMZ (Có DMZ) | Rủi ro khi không có DMZ (Không DMZ) |
| :--- | :--- | :--- |
| **Bảo mật mạng nội bộ** | Kẻ tấn công chiếm được Web Server sẽ bị kẹt lại ở DMZ, không thể quét (scan) hoặc tấn công trực tiếp vào Database/DC nội bộ. | Web Server đặt cùng mạng LAN. Nếu Web bị hack, hacker có thể dễ dàng pivot (di chuyển ngang) sang các máy chủ quan trọng khác. |
| **Kiểm soát Truy cập (Access Control)** | Quản trị viên dễ dàng áp dụng chính sách (Policies) khắt khe cho traffic từ DMZ vào Internal. | Khó phân tách traffic hợp lệ và traffic độc hại trên cùng một subnet. |
| **Hiệu suất & Băng thông** | Giảm tải cho mạng nội bộ vì traffic từ Internet chỉ đi đến DMZ rồi dừng lại. | Các luồng dữ liệu (traffic) public đổ dồn vào core switch của mạng nội bộ gây nghẽn cổ chai (bottleneck). |
| **Bảo vệ chống Spoofing** | Có thể cấu hình Firewall chặn các gói tin giả mạo IP nội bộ từ bên ngoài. | Dễ bị tấn công IP Spoofing do thiếu điểm kiểm tra tập trung. |
| **Khả năng giám sát (Monitoring)** | Cung cấp một điểm chốt chặn lý tưởng để đặt NIDS/NIPS giám sát traffic public. | Traffic phân tán hoặc bị lẫn lộn, làm giảm độ chính xác của IDS/IPS. |

---

## 3. Kiến Trúc DMZ

Có hai kiến trúc DMZ phổ biến nhất được triển khai trong môi trường Enterprise.

### 3.1 Single Firewall (Three-Legged Firewall)
Sử dụng một Firewall duy nhất có ít nhất 3 Network Interfaces (Cổng mạng).

```text
                        [Internet]
                             |
                             | (Untrusted Traffic)
                             v
                   +-------------------+
                   |                   |
                   |     FIREWALL      |
                   |  (3 Interfaces)   |
                   |                   |
                   +-------------------+
                     /               \
       (Public Traffic)             (Private Traffic)
             /                           \
            v                             v
   +-----------------+           +-----------------+
   |      DMZ        |           |  INTERNAL LAN   |
   | (Web, FTP, DNS) |           |  (DC, DB, File) |
   +-----------------+           +-----------------+
```

**Ưu điểm:**
- Chi phí thấp (chỉ cần mua 1 thiết bị Firewall).
- Quản trị tập trung, dễ cấu hình (chỉ 1 bảng Rule).

**Nhược điểm:**
- Single Point of Failure (SPOF): Nếu Firewall này bị sập hoặc có lỗ hổng (Zero-day vulnerability), toàn bộ mạng nội bộ và DMZ đều gặp nguy hiểm.

### 3.2 Dual Firewall (Screened Subnet)
Sử dụng hai Firewall riêng biệt, tạo ra một vùng đệm (Screened Subnet) ở giữa. 

```text
                        [Internet]
                             |
                             v
                   +-------------------+
                   | FRONT-END FIREWALL| (Firewall 1)
                   |  (Vendor A - e.g. | 
                   |   Palo Alto)      |
                   +-------------------+
                             |
                             v
   +---------------------------------------------------+
   |                    DMZ NETWORK                    |
   |      [Web Server]    [Mail Relay]    [VPN Gateway]|
   +---------------------------------------------------+
                             |
                             v
                   +-------------------+
                   | BACK-END FIREWALL | (Firewall 2)
                   |  (Vendor B - e.g. |
                   |   Cisco ASA/Forti)|
                   +-------------------+
                             |
                             v
                     [INTERNAL NETWORK]
                  (Active Directory, SQL, File)
```

**Ưu điểm:**
- Bảo mật cực cao (Defense in Depth). Nếu Front-end Firewall bị vượt qua, Back-end Firewall vẫn bảo vệ mạng nội bộ.
- Thường dùng thiết bị của 2 hãng khác nhau (Vendor Diversity) để tránh một lỗ hổng firmware ảnh hưởng cả hai.

**Nhược điểm:**
- Chi phí đầu tư (CAPEX) và vận hành (OPEX) đắt đỏ.
- Quản lý phức tạp, dễ bị lỗi cấu hình (misconfiguration) giữa 2 lớp Firewall gây đứt gãy dịch vụ.

---

## 4. Các Servers Thường Đặt Trong DMZ

Những máy chủ cần giao tiếp trực tiếp với Internet bắt buộc phải đặt ở DMZ.
1. **Web Servers (IIS, Apache, Nginx):** Phục vụ website cho người dùng công cộng.
2. **Mail Relay / Edge Transport Servers:** Chuyển tiếp email từ Internet vào Mail Server nội bộ (VD: Exchange Edge Transport Server). Lọc Spam/Malware trước khi vào LAN.
3. **Authoritative DNS Servers:** Cung cấp thông tin phân giải tên miền (A, MX records) cho các truy vấn từ bên ngoài Internet.
4. **FTP/SFTP Servers:** Cho phép đối tác/khách hàng upload/download file.
5. **Reverse Proxy Servers / WAF:** Đứng ra nhận request, kiểm tra bảo mật (WAF) và điều hướng (proxy) vào Web Server thực sự.
6. **VPN Gateways / Remote Access Servers:** Nơi kết thúc (terminate) các kết nối VPN từ nhân viên làm việc từ xa (DirectAccess, RRAS, AlwaysOn VPN).

---

## 5. Các Servers KHÔNG BAO GIỜ Được Đặt Trong DMZ

Tuyệt đối không đặt các máy chủ lưu trữ dữ liệu cốt lõi và xác thực ở DMZ. Nếu cần, DMZ chỉ được phép gọi vào chúng qua các port cụ thể.
1. **Domain Controllers (Active Directory):** Chứa toàn bộ thông tin tài khoản, mật khẩu, chính sách của doanh nghiệp. Đặt DC ngoài DMZ là thảm họa bảo mật.
2. **Database Servers (SQL Server, Oracle):** Chứa dữ liệu khách hàng, tài chính. Web Server ở DMZ sẽ query vào DB Server ở Internal thông qua port 1433 (SQL).
3. **File Servers (SMB/NFS):** Chứa tài liệu nội bộ doanh nghiệp.
4. **Internal DNS/DHCP Servers:** Cấp phát IP và phân giải tên miền cho thiết bị nội bộ.

---

## 6. Firewall Rules Cho DMZ

Quy tắc Vàng trong thiết kế DMZ là áp dụng nguyên tắc **Deny by Default** và chỉ cho phép những luồng traffic thực sự cần thiết (Least Privilege).

### 6.1 Nguyên tắc dòng chảy (Traffic Flow Principles)
- **Internet ➡️ DMZ:** Cho phép (Chỉ mở các Port dịch vụ cụ thể như 80/443, 25).
- **DMZ ➡️ Internet:** Hạn chế (Chỉ mở port cho việc Update hoặc trả response). Cấm DMZ tự ý initiate connection ra ngoài (tránh việc server bị hack làm botnet).
- **DMZ ➡️ Internal:** CỰC KỲ HẠN CHẾ (Chỉ mở những port cần thiết như SQL 1433, LDAP 389 từ một IP DMZ cụ thể đến một IP DB cụ thể).
- **Internal ➡️ DMZ:** Cho phép một chiều (VD: Admin SSH/RDP vào DMZ server để quản trị).
- **Internet ➡️ Internal:** **CẤM HOÀN TOÀN (Block All)**.

### 6.2 Bảng Rules Mẫu (Kiến trúc Dual Firewall)

**Front-end Firewall (Internet ↔ DMZ)**
| Rule | Source | Destination | Port/Protocol | Action | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Any | Web Server (DMZ) | TCP 80, 443 | ALLOW | Web Traffic |
| 2 | Any | Mail Edge (DMZ) | TCP 25 | ALLOW | Nhận Email |
| 3 | DMZ Servers | Any | TCP 80, 443 | ALLOW | Để server tải Updates |
| 4 | Any | Any | Any | DENY | Implicit Deny |

**Back-end Firewall (DMZ ↔ Internal)**
| Rule | Source | Destination | Port/Protocol | Action | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Web Server (DMZ) | SQL DB (Internal) | TCP 1433 | ALLOW | Web truy vấn Database |
| 2 | Mail Edge (DMZ) | Exchange (Internal)| TCP 25, 2525 | ALLOW | Mail Edge đẩy mail vào trong |
| 3 | Admin Subnet (Int) | DMZ Servers | TCP 3389, 22 | ALLOW | IT quản trị server DMZ |
| 4 | Any | Any | Any | DENY | Implicit Deny |

---

## 7. Cấu Hình DMZ Trên Windows Server

Mặc dù DMZ thường được triển khai bằng Hardware/Network Firewall, bạn hoàn toàn có thể xây dựng một DMZ bằng chính Windows Server thông qua **Routing and Remote Access (RRAS)** và **Windows Defender Firewall with Advanced Security**.

### 7.1 Multi-NIC Server & RRAS
Dùng Windows Server làm Router (Single Firewall Architecture). Server cần 3 Card mạng (NICs).
- NIC 1 (External): Nối Internet (192.0.2.1)
- NIC 2 (DMZ): Nối vSwitch DMZ (10.0.1.0/24)
- NIC 3 (Internal): Nối vSwitch Internal (192.168.1.0/24)

Cài đặt RRAS để bật tính năng định tuyến:
```powershell
Install-WindowsFeature -Name Routing -IncludeManagementTools
Install-WindowsFeature -Name RemoteAccess -IncludeManagementTools
# Sau đó cấu hình NAT từ Internal/DMZ ra External qua GUI (rrasmgmt.msc)
```

### 7.2 Windows Firewall Rules PowerShell
Giả sử bạn có một Web Server (IIS) trong DMZ, bạn cần cấu hình Windows Firewall nội tại trên OS để khóa chặt hệ thống.

```powershell
# Chặn toàn bộ traffic Inbound mặc định (nếu chưa chặn)
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block

# Chỉ mở Port 80 và 443 từ Internet
New-NetFirewallRule -DisplayName "Allow Web HTTP/HTTPS" -Direction Inbound -LocalPort 80,443 -Protocol TCP -Action Allow

# Cấu hình RDP chỉ cho phép từ dải IP Quản trị viên (Internal: 192.168.1.50)
New-NetFirewallRule -DisplayName "Allow Admin RDP" -Direction Inbound -LocalPort 3389 -Protocol TCP -RemoteAddress 192.168.1.50 -Action Allow

# Chặn DMZ Server truy cập ra Internet tùy tiện (Ngoại trừ Windows Update)
# Đòi hỏi cấu hình Outbound rule chặt chẽ.
```

### 7.3 Exchange Edge Transport
Trong hệ thống Microsoft Exchange, máy chủ lưu trữ Mailboxes (chứa dữ liệu) nằm trong Internal Network. Microsoft cung cấp role **Edge Transport** thiết kế riêng để nằm ở DMZ.
- Edge Server không gia nhập Domain (Stand-alone server).
- Sử dụng công nghệ **EdgeSync** (thông qua port LDAP bảo mật - TCP 50636) để đồng bộ thông tin danh bạ từ Internal Exchange Server ra DMZ theo 1 chiều, đảm bảo DMZ không thể ghi đè dữ liệu vào AD.

---

## 8. Reverse Proxy Trong DMZ (Web Application Proxy)

Một kiến trúc phổ biến trong MCSA/MCSE là triển khai **Web Application Proxy (WAP)** trong DMZ.
- WAP nhận các request HTTPS từ Internet.
- Nó giao tiếp với **Active Directory Federation Services (AD FS)** ở mạng Internal để xác thực người dùng (SSO) TRƯỚC KHI cho phép traffic đi vào ứng dụng nội bộ.
- Server WAP nằm ở DMZ không join domain.
- Lợi ích: Ẩn cấu trúc mạng nội bộ, Pre-authentication, ngăn chặn các cuộc tấn công DDoS ở tầng ứng dụng (L7) nhắm thẳng vào Backend Web Servers.

---

## 9. DNS Split-Brain (Split DNS)

Khi có DMZ, doanh nghiệp thường gặp vấn đề: Làm sao để người dùng Internet truy cập `mail.contoso.com` ra Public IP (ở DMZ), nhưng nhân viên ngồi trong cty gõ `mail.contoso.com` lại truy cập thẳng vào Private IP (LAN) để tăng tốc độ?

Giải pháp là **DNS Split-Brain (Split-horizon DNS)**:
1. **External DNS (Đặt ở DMZ hoặc thuê Cloud):** 
   - Chứa Zone `contoso.com`. 
   - Bản ghi `mail.contoso.com -> A -> 203.0.113.10` (Public IP)
2. **Internal DNS (AD DNS đặt trong LAN):** 
   - Chứa Zone `contoso.com`.
   - Bản ghi `mail.contoso.com -> A -> 192.168.1.100` (Private IP)

Khi client truy vấn, tùy vào việc họ đang ở ngoài Internet hay trong LAN, họ sẽ hỏi DNS Server tương ứng và nhận được IP thích hợp. Trên Windows Server, có thể dùng **DNS Policies** (Windows Server 2016+) để cấu hình Split-brain trên cùng 1 server thay vì 2 server vật lý.

---

## 10. Monitoring DMZ

Bởi vì DMZ là "tiền tuyến", việc giám sát là bắt buộc:
1. **Triển khai NIDS/NIPS (Network Intrusion Detection/Prevention System):** Đặt sensor tại công tắc (switch) DMZ qua tính năng Port Mirroring (SPAN) để quét mã độc, SQL Injection.
2. **Centralized Logging (SIEM):** Các máy chủ trong DMZ dễ bị thỏa hiệp, do đó Log (Event Viewer) phải được đẩy liên tục (forward) về một SIEM server (như Splunk, ELK) nằm ở mạng Internal. Nếu hacker xóa log trên DMZ server, bản sao đã nằm an toàn ở Internal.
   - Cấu hình Windows Event Forwarding (WEF) từ DMZ về Internal Collector.
3. **File Integrity Monitoring (FIM):** Theo dõi sự thay đổi trái phép trên các file hệ thống và file cấu hình Web (VD: `web.config` của IIS).

---

## 11. Best Practices (Thực Hành Tốt Nhất)

1. **Không Join Domain cho máy chủ DMZ:** Các server ở DMZ (trừ khi dùng Read-Only Domain Controller - RODC cho mục đích đặc biệt) nên là Standalone Workgroup. Nếu bị hack, Active Directory không bị lộ.
2. **Least Privilege Routing:** Không bật Routing trên các Server ở DMZ. Vô hiệu hóa IP Forwarding.
3. **MFA cho Quản trị viên:** Bất kỳ kết nối Remote Desktop/SSH nào từ LAN vào DMZ hoặc từ Internet vào VPN Gateway đều phải có Multi-Factor Authentication.
4. **Patch Management:** Cập nhật bản vá (Patching) cho máy chủ DMZ phải là ưu tiên số 1. Luôn test trên môi trường staging trước khi apply.
5. **Disable Unnecessary Services:** Tắt tất cả các dịch vụ Windows không dùng tới trên DMZ Server (VD: Print Spooler, SMBv1, Server Service).
6. **Sử dụng WAF:** Luôn đặt Web Application Firewall trước các IIS Web Server trong DMZ.
7. **Lọc Egress Traffic (Outbound):** Chặn các DMZ server truy cập Internet tự do. Chỉ cho phép gọi đến các IP Update cụ thể của Microsoft hoặc qua một Proxy Server.
8. **Micro-segmentation:** Trong chính DMZ, hãy tách riêng Web DMZ, Mail DMZ, và VPN DMZ thành các VLAN khác nhau.
9. **Sử dụng Reverse Proxy:** Không bao giờ public trực tiếp Application Server. Luôn dùng Reverse Proxy hứng traffic.
10. **Hardening OS:** Áp dụng CIS Benchmarks (Center for Internet Security) cho Windows Server trước khi đưa ra DMZ.
11. **Giới hạn kết nối Database:** Chỉ cho phép IP của Web Server (DMZ) được kết nối đến IP của DB (Internal) trên đúng port 1433, sử dụng tài khoản SQL hạn chế quyền (chỉ EXECUTE stored procedures, không có quyền DROP bảng).

---

## 12. Câu Hỏi Ôn Tập

1. Mục đích chính của việc thiết lập mạng DMZ là gì?
2. Kiến trúc Screened Subnet (Dual Firewall) khác biệt thế nào so với Three-Legged Firewall?
3. Tại sao KHÔNG BAO GIỜ đặt Active Directory Domain Controller vào DMZ?
4. Nếu một Web Server trong DMZ cần lấy dữ liệu từ SQL Server nội bộ, nguyên tắc cấu hình Firewall Rule ở Back-end Firewall là gì?
5. Role nào của Microsoft Exchange Server được thiết kế chuyên biệt để hoạt động trong môi trường DMZ?
6. Web Application Proxy (WAP) trong DMZ phối hợp với thành phần nào trong mạng Internal để cung cấp tính năng Pre-authentication?
7. Cấu hình DNS Split-Brain giải quyết bài toán gì cho doanh nghiệp?
8. Tại sao các máy chủ đặt trong DMZ thường được khuyến cáo không nên join vào Domain chính của doanh nghiệp?

---
**Liên kết mở rộng:**
[[Firewall]] · [[ACL]] · [[IDS]] · [[IPS]] · [[VPN]] · [[Segmentation]]
