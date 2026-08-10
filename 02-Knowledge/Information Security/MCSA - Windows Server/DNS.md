# 🌐 MCSA: DNS — Phân giải tên (Domain Name System)

## 1. DNS là gì?
**DNS (Domain Name System)** là hệ thống phân giải tên miền (tên dễ nhớ với con người) thành địa chỉ IP (địa chỉ dễ hiểu với máy tính) để định tuyến dữ liệu trên mạng. 

* 💡 **Analogy (Ví dụ minh họa):** Hãy tưởng tượng DNS như một **Danh bạ điện thoại** của Internet. Con người nhớ tên như "google.com", nhưng trình duyệt cần địa chỉ IP như "142.250.x.x" để kết nối đến máy chủ. DNS sẽ tìm tên "google.com" trong danh bạ và trả về số điện thoại "142.250.x.x".

## 2. Tại sao cần DNS?
| Đặc điểm | Lợi ích / Lý do cần thiết |
| :--- | :--- |
| **Tính thân thiện với người dùng** | Giúp người dùng không phải nhớ các dãy số IP phức tạp (vd: IPv4 `192.168.1.1` hay IPv6 `2001:db8::1`). Nhớ `microsoft.com` dễ hơn nhiều. |
| **Tính linh hoạt & Sẵn sàng cao** | Khi máy chủ đổi IP, tên miền không cần đổi. Quản trị viên chỉ cần cập nhật DNS Record. Người dùng cuối không bị gián đoạn. |
| **Cân bằng tải (Load Balancing)** | Một tên miền (ví dụ: `google.com`) có thể ánh xạ đến nhiều IP khác nhau (Round Robin DNS), giúp phân tán lượng truy cập. |
| **Hạ tầng cốt lõi của Active Directory** | AD DS không thể hoạt động nếu không có DNS. DNS định vị các dịch vụ cốt lõi của AD như Domain Controller, Kerberos, Global Catalog qua SRV records. |
| **Tích hợp dịch vụ email** | Email server cần DNS (MX records) để biết nơi gửi email tới (ví dụ: `user@example.com` → tìm mail server của `example.com`). |

## 3. Cách DNS hoạt động

### 3.1. Phân loại Query (Truy vấn)
- **Recursive query (Truy vấn đệ quy):** DNS client yêu cầu DNS server trả về câu trả lời hoàn chỉnh (IP hoặc lỗi "không tìm thấy"). DNS server phải làm mọi việc (hỏi các server khác) để tìm bằng được câu trả lời cho client.
- **Iterative query (Truy vấn lặp):** DNS server (thường là Root hoặc TLD) không trực tiếp trả về IP cuối cùng mà trả về một "gợi ý" (địa chỉ của DNS server khác có thể biết). Người hỏi (Recursive Resolver) phải tiếp tục đi hỏi server mới đó.

### 3.2. DNS Resolution Flow (Luồng phân giải DNS)
Quá trình phân giải tên miền `www.microsoft.com` diễn ra như sau:

```text
[ Client (Trình duyệt) ] 
      | (1) Recursive Query for www.microsoft.com
      v
[ Local DNS Server (Recursive Resolver) ] <--- Cache: Nếu có sẵn thì trả về ngay (8)
      | (2) Iterative Query 
      |-------------------------------------> [ Root DNS Server (.) ]
      <-------------------------------------  (3) Trả về IP của TLD Server (.com)
      | (4) Iterative Query
      |-------------------------------------> [ TLD DNS Server (.com) ]
      <-------------------------------------  (5) Trả về IP của Authoritative Server (microsoft.com)
      | (6) Iterative Query
      |-------------------------------------> [ Authoritative DNS Server (microsoft.com) ]
      <-------------------------------------  (7) Trả về IP của www.microsoft.com (A Record)
      |
      v (8) Trả về IP cho Client
[ Client ] ---> Kết nối tới IP của www.microsoft.com
```

### 3.3. DNS Cache
Để tối ưu tốc độ và giảm tải mạng, các kết quả DNS được lưu trữ tạm thời (Cache) ở nhiều cấp:
- **Browser Cache:** Trình duyệt lưu kết quả.
- **OS Cache:** Hệ điều hành Windows lưu cache (`ipconfig /displaydns`).
- **Resolver Cache:** Local DNS Server lưu kết quả cho các client trong mạng.
Mỗi bản ghi được lưu theo thời gian **TTL (Time to Live)**. Hết TTL, bản ghi bị xóa và query mới sẽ được thực hiện lại.

## 4. Các loại DNS Record

| Loại Record | Viết tắt của | Chức năng & Mô tả | Ví dụ |
| :--- | :--- | :--- | :--- |
| **A** | Address (IPv4) | Ánh xạ hostname thành địa chỉ IPv4. Đây là record phổ biến nhất. | `server1.corp.com` → `192.168.1.10` |
| **AAAA** | Address (IPv6) | Ánh xạ hostname thành địa chỉ IPv6. | `server1.corp.com` → `fe80::1ff:fe23:4567:890a` |
| **CNAME** | Canonical Name | Tạo bí danh (alias) trỏ đến một tên miền khác (không trỏ trực tiếp đến IP). | `www.corp.com` trỏ đến `server1.corp.com` |
| **MX** | Mail Exchanger | Xác định Mail Server chịu trách nhiệm nhận email cho domain. Có độ ưu tiên (Priority). | `corp.com` MX `10 mail1.corp.com` |
| **NS** | Name Server | Xác định DNS Server nào là Authoritative (có thẩm quyền) quản lý domain này. | `corp.com` NS `ns1.corp.com` |
| **PTR** | Pointer | Ngược lại với A record. Ánh xạ IP thành hostname (dùng cho Reverse Lookup). Dùng để chống spam. | `10.1.168.192.in-addr.arpa` → `server1.corp.com` |
| **SRV** | Service Locator | Xác định máy chủ nào cung cấp một dịch vụ cụ thể (như LDAP, Kerberos trong AD). | `_ldap._tcp.corp.com` → `dc1.corp.com` |
| **SOA** | Start of Authority | Record đầu tiên trong một zone, chứa thông tin quản trị: Primary DNS, admin email, Serial number, thời gian refresh/retry/expire. | `SOA dc1.corp.com admin.corp.com (1001 900 600...)` |
| **TXT** | Text | Chứa dữ liệu văn bản tùy ý. Thường dùng để cấu hình bảo mật email (SPF, DKIM, DMARC) hoặc xác minh domain. | `corp.com` TXT `"v=spf1 include:spf.protection.outlook.com -all"` |

## 5. DNS Zones

### 5.1. Phân loại theo Hướng (Direction)
- **Forward Lookup Zone (Vùng tra cứu xuôi):** Phân giải Hostname → IP (chứa A, AAAA, CNAME...).
- **Reverse Lookup Zone (Vùng tra cứu ngược):** Phân giải IP → Hostname (chứa PTR records).

### 5.2. Phân loại theo Vai trò (Type)
- **Primary Zone (Vùng chính):** Là bản copy gốc (Read/Write) của dữ liệu zone. Quản trị viên chỉ có thể tạo/xóa/sửa records tại đây. Dữ liệu lưu trong file text `.dns` (nếu không dùng AD).
- **Secondary Zone (Vùng phụ):** Là bản copy Read-only từ Primary Zone. Dùng để dự phòng (Redundancy) và giảm tải (Load balancing). Cập nhật dữ liệu thông qua cơ chế **Zone Transfer**.
- **Stub Zone:** Một dạng zone Read-only đặc biệt, CHỈ chứa các bản ghi SOA, NS và A record của các Name Server của zone đó. Giúp tăng tốc độ truy vấn đến zone khác mà không cần copy toàn bộ dữ liệu.

### 5.3. AD-Integrated Zone (Tích hợp Active Directory)
Trong MCSA, đây là khái niệm cực kỳ quan trọng. Khi cài DNS trên Domain Controller (DC), ta có thể lưu DNS Zone trực tiếp vào cơ sở dữ liệu của Active Directory (thay vì file text).
- **Ưu điểm:**
  - **Replication (Đồng bộ):** Dữ liệu DNS được đồng bộ tự động và an toàn thông qua cơ chế đồng bộ của AD (AD Replication) tới tất cả các DC.
  - **Multi-master:** Mọi DC chạy DNS đều giữ bản sao Read/Write. Không còn khái niệm "Primary/Secondary". Có thể tạo record ở bất kỳ DC nào.
  - **Secure Dynamic Updates:** Chỉ các máy tính đã join domain (có tài khoản an toàn) mới được phép tự động cập nhật IP của chúng vào DNS.

## 6. DNS trên Windows Server

### 6.1. Cài đặt DNS Role
Sử dụng Server Manager hoặc PowerShell:
```powershell
# Cài đặt role DNS và công cụ quản lý
Install-WindowsFeature -Name DNS -IncludeManagementTools
```

### 6.2. Tạo Zones bằng PowerShell
```powershell
# Tạo Forward Lookup Zone cơ bản (Primary, File-backed)
Add-DnsServerPrimaryZone -Name "corp.local" -ZoneFile "corp.local.dns"

# Tạo AD-Integrated Zone (đồng bộ toàn domain)
Add-DnsServerPrimaryZone -Name "secure.local" -ReplicationScope "Domain"

# Tạo Reverse Lookup Zone cho mạng 192.168.1.0/24 (AD-integrated)
Add-DnsServerPrimaryZone -NetworkId "192.168.1.0/24" -ReplicationScope "Domain"
```

### 6.3. Tạo Resource Records
```powershell
# Tạo A Record
Add-DnsServerResourceRecordA -ZoneName "corp.local" -Name "webserver" -IPv4Address "192.168.1.100"

# Tạo CNAME
Add-DnsServerResourceRecordCName -ZoneName "corp.local" -Name "www" -HostNameAlias "webserver.corp.local"

# Tạo PTR Record trong Reverse Zone
Add-DnsServerResourceRecordPTR -ZoneName "1.168.192.in-addr.arpa" -Name "100" -PtrDomainName "webserver.corp.local"
```

### 6.4. Forwarders & Conditional Forwarders
Nếu Local DNS không biết địa chỉ (không có cache, không chứa zone), nó sẽ đi hỏi:
- **Forwarder:** Trỏ TẤT CẢ truy vấn không biết (vd: ra Internet) tới một DNS server cụ thể (vd: 8.8.8.8 của Google).
- **Conditional Forwarder:** Chỉ trỏ truy vấn cho **một domain cụ thể** tới một IP cụ thể.
  - *Ví dụ:* Công ty bạn (`corp.local`) mua lại công ty khác (`partner.local`). Bạn tạo Conditional Forwarder: "Nếu ai hỏi tên miền `*.partner.local`, hãy đi hỏi DNS IP 10.0.0.5".

```powershell
# Cấu hình Forwarder toàn cục
Set-DnsServerForwarder -IPAddress "8.8.8.8", "1.1.1.1"

# Cấu hình Conditional Forwarder
Add-DnsServerConditionalForwarderZone -Name "partner.local" -MasterServers "10.0.0.5"
```

### 6.5. DNS Scavenging (Dọn dẹp tự động)
Trong môi trường sử dụng DHCP, IP của client thường xuyên thay đổi. Nếu máy tính tắt/đổi IP mà không xóa record cũ, DNS sẽ bị "rác" (Stale records).
- **Aging & Scavenging** là tính năng tự động xóa các record quá cũ.
- Cần bật ở 3 cấp độ: Trên DNS Server → Trên Zone → Bật thuộc tính "Time stamp" trên record.

```powershell
# Bật Scavenging trên Server, chạy tự động mỗi 7 ngày
Set-DnsServerScavenging -ScavengingState $true -ScavengingInterval (New-TimeSpan -Days 7)

# Bật Scavenging trên Zone cụ thể
Set-DnsServerPrimaryZone -Name "corp.local" -Aging $true -NoRefreshInterval (New-TimeSpan -Days 7) -RefreshInterval (New-TimeSpan -Days 7)
```

## 7. DNS và Active Directory

### 7.1. Tại sao AD cần DNS?
DNS là "xương sống" của AD DS. Khác với NT4.0 ngày xưa dùng WINS/NetBIOS, Windows 2000+ dùng DNS để định vị (Locate) Domain Controller.
Khi một máy client muốn đăng nhập, nó phải tìm xem máy chủ DC ở đâu. Nó làm vậy bằng cách truy vấn **SRV Records**.

### 7.2. SRV Records quan trọng
Khi tạo DC, dịch vụ Netlogon sẽ đăng ký rất nhiều SRV records vào zone của domain (trong thư mục `_msdcs`).
- `_ldap._tcp.dc._msdcs.corp.local`: Giúp client tìm DC để thực hiện LDAP query.
- `_kerberos._tcp.dc._msdcs.corp.local`: Giúp client tìm Key Distribution Center (KDC) để xác thực mật khẩu.
- `_gc._tcp.corp.local`: Tìm Global Catalog server.

### 7.3. DNS Dynamic Update (DDNS)
Client tự động đăng ký và cập nhật A/PTR record của mình lên DNS Server khi nhận IP từ DHCP.
- **Secure only:** Tính năng bảo mật chỉ có trên AD-Integrated zones. Chỉ những máy tính đã join domain mới có quyền tạo và sửa record của chính nó. Chống tình trạng "cướp" tên (Name hijacking) từ các thiết bị lạ.

## 8. DNS Security

| Tính năng | Giải thích |
| :--- | :--- |
| **DNSSEC (DNS Security Extensions)** | Ký điện tử (Digital signatures) vào các DNS records. Client khi nhận record có thể xác minh xem kết quả có bị giả mạo trên đường truyền hay không, đảm bảo tính vẹn toàn (Integrity). |
| **DoH (DNS over HTTPS)** | Mã hóa các truy vấn DNS (bình thường là Cleartext qua UDP 53) bằng giao thức HTTPS (TCP 443). Ngăn chặn ISP nghe lén thói quen duyệt web của người dùng. |
| **DNS Poisoning/Spoofing** | Một kỹ thuật tấn công: Kẻ tấn công tiêm (inject) các bản ghi DNS giả mạo vào Cache của DNS Server. Người dùng gõ `bank.com` nhưng bị trỏ tới IP máy chủ của hacker (Phishing). DNSSEC giúp chống lại điều này. |
| **Split DNS (Split-Brain DNS)** | Tạo 2 zone cùng tên (ví dụ: `corp.com`). Internal zone (trong mạng LAN) phân giải `www.corp.com` ra IP nội bộ (192.168.1.10). External zone (trên Internet) phân giải cùng tên đó ra IP Public. Bảo vệ mô hình mạng bên trong. |

## 9. Troubleshooting DNS

### 9.1. Các lệnh kiểm tra cơ bản
```cmd
:: Xem cache DNS hiện tại trên máy client
ipconfig /displaydns

:: Xóa cache (rất hay dùng khi vừa đổi IP trên server nhưng client vẫn nhận IP cũ)
ipconfig /flushdns

:: Truy vấn DNS tương tác (như dig trên Linux)
nslookup www.google.com
nslookup -type=mx corp.local
```

### 9.2. Lệnh PowerShell mới
```powershell
# Truy vấn chi tiết hơn nslookup, trả về dạng object
Resolve-DnsName -Name "dc1.corp.local" -Type SRV

# Xóa DNS cache bằng PowerShell
Clear-DnsClientCache
```

### 9.3. Kiểm tra sự khỏe mạnh của DNS cho AD
```cmd
:: Kiểm tra các dịch vụ của Domain Controller, bao gồm test chuyên sâu cho DNS
dcdiag /test:dns
```
Lệnh này sẽ kiểm tra xem DC có đăng ký đủ SRV records chưa, Forwarders cấu hình đúng không, và có lỗi Delegation nào không.

### 9.4. Lỗi thường gặp
- **Lỗi 1:** Client join domain báo lỗi "DNS name does not exist".
  - *Sửa:* Kiểm tra lại card mạng của Client, phần "Preferred DNS server" PHẢI trỏ về IP của Domain Controller. Không được trỏ ra `8.8.8.8` hoặc Router Wifi.
- **Lỗi 2:** NS Record bị mất.
  - *Sửa:* Khởi động lại dịch vụ Netlogon trên DC (`Restart-Service netlogon`), DC sẽ tự động đăng ký lại tất cả các record thiết yếu.

## 10. Best Practices (Thực hành Tốt nhất)
1. **Luôn dùng AD-Integrated Zones** cho mạng nội bộ để tận dụng bảo mật Secure Dynamic Updates và replication đa chiều.
2. **2 là 1, 1 là không (Redundancy):** Luôn phải có ít nhất 2 DNS Servers trong hệ thống mạng.
3. **Cấu hình DNS Client đúng cách trên DC:** Primary DNS trỏ về IP của DC khác, Secondary DNS trỏ về IP loopback (`127.0.0.1`) hoặc chính nó. Không trỏ ra Internet.
4. **Bật Scavenging:** Tránh tình trạng "phình to" database và xung đột IP cho các máy trạm dùng DHCP.
5. **Giới hạn Zone Transfer:** Chỉ cho phép Zone Transfer sang các Name Servers có trong danh sách NS tab (chống hacker tải toàn bộ sơ đồ mạng).

---

## 11. Câu hỏi ôn tập
1. So sánh sự khác nhau giữa Recursive Query và Iterative Query.
2. Tại sao A record và CNAME lại khác nhau? Cho ví dụ trường hợp nên dùng CNAME.
3. Chức năng của PTR record là gì và nó nằm ở loại Zone nào?
4. Lợi ích lớn nhất khi sử dụng AD-Integrated Zone so với Standard Primary Zone là gì?
5. Máy client Windows muốn đăng nhập vào Active Directory thì cần tìm bản ghi DNS loại nào?
6. Conditional Forwarder khác Forwarder thông thường như thế nào?
7. "Secure only" Dynamic Updates giúp giải quyết rủi ro bảo mật gì?
8. Tại sao một máy tính vừa đổi địa chỉ IP mà máy khác ping bằng hostname vẫn ra IP cũ? Cách khắc phục nhanh nhất?
9. Lệnh cmd nào dùng để kiểm tra tính toàn vẹn của DNS đối với Domain Controller?
10. Mục đích của tính năng DNS Scavenging là gì? Nếu không bật sẽ gây hậu quả gì?

---
**Liên kết mở rộng (Obsidian Links):**
- [[Active Directory]]
- [[Domain]]
- [[Group Policy (GPO)]]
- [[DHCP]]
- [[File Server]]
- [[Firewall]]
