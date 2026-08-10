# 📡 DHCP — Cấp IP tự động (Dynamic Host Configuration Protocol)

## 1. DHCP là gì? (What is DHCP?)

**DHCP (Dynamic Host Configuration Protocol)** là một giao thức mạng chuẩn thuộc tầng Application (tầng ứng dụng - theo mô hình OSI hoặc TCP/IP). Chức năng chính của DHCP là **tự động cấp phát các thông số cấu hình mạng** cho các thiết bị (client) trong hệ thống, bao gồm:
- **IP Address**: Địa chỉ định danh thiết bị trên mạng.
- **Subnet Mask**: Mặt nạ mạng, dùng để phân biệt phần Network ID và Host ID.
- **Default Gateway**: Cổng giao tiếp mặc định để thiết bị kết nối với các mạng khác.
- **DNS Server**: Địa chỉ máy chủ phân giải tên miền.

**💡 Simple Analogy (Một ví dụ dễ hiểu):**
Hãy tưởng tượng một khách sạn (Mạng). Khi khách (Client) đến thuê phòng, lễ tân (DHCP Server) sẽ phát cho họ một chìa khóa phòng (IP Address), bản đồ khách sạn (Subnet Mask), cửa ra vào chính (Default Gateway), và cuốn sổ danh bạ điện thoại (DNS Server). Thay vì khách phải tự tìm phòng trống và nhớ đường đi, lễ tân làm điều đó tự động và hiệu quả.

---

## 2. Tại sao cần DHCP? (Why is DHCP needed?)

Việc gán IP thủ công chỉ khả thi cho hệ thống rất nhỏ. Trong môi trường doanh nghiệp vừa và lớn, DHCP là một thành phần cốt lõi không thể thiếu. Dưới đây là bảng so sánh giữa cấp IP tĩnh (Static IP) và DHCP:

| Tiêu chí | Cấp phát tĩnh (Static IP) | Cấp phát bằng DHCP |
| :--- | :--- | :--- |
| **Quản lý (Management)** | Phải nhập tay từng máy, rất tốn thời gian và dễ nhầm lẫn. | Tự động hóa hoàn toàn từ một điểm tập trung. |
| **Xung đột IP (IP Conflict)** | Dễ xảy ra nếu lỡ gán cùng một IP cho hai máy khác nhau. | Hiếm khi xảy ra vì Server quản lý dải IP trống một cách chặt chẽ. |
| **Tính cơ động (Mobility)** | Thiết bị di chuyển sang mạng khác phải đổi IP bằng tay. | Tự động nhận IP mới phù hợp với mạng đang kết nối. |
| **Khắc phục lỗi (Troubleshooting)**| Khó kiểm soát và cập nhật thông số đồng loạt. | Dễ dàng thay đổi thông số mạng cho toàn bộ mạng bằng cách chỉnh cấu hình trên Server. |

---

## 3. DHCP hoạt động như thế nào? (How does DHCP work) — DORA Process

Hoạt động cấp phát IP của DHCP là một quá trình tương tác gồm 4 bước, thường được viết tắt là **DORA**: **D**iscover, **O**ffer, **R**equest, **A**cknowledge.

### Sơ đồ DORA Process (ASCII Diagram)

```text
  [DHCP Client]                                            [DHCP Server]
       |                                                         |
       | 1. DHCP Discover (Broadcast)                            |
       |-------------------------------------------------------->|
       | Tớ mới vào mạng, có Server nào cấp cho tớ 1 IP không?   |
       |                                                         |
       | 2. DHCP Offer (Unicast/Broadcast)                       |
       |<--------------------------------------------------------|
       | Chào cậu! Tớ có IP 192.168.1.50 trống này, lấy không?   |
       |                                                         |
       | 3. DHCP Request (Broadcast)                             |
       |-------------------------------------------------------->|
       | Cảm ơn! Tớ lấy cái IP 192.168.1.50 đó nhé. Các Server   |
       | khác rút lại Offer giùm tớ nha.                         |
       |                                                         |
       | 4. DHCP Acknowledge (Unicast/Broadcast)                 |
       |<--------------------------------------------------------|
       | Ok! Đã ghi nhận. Đây là cấu hình đầy đủ (Mask, GW, DNS).|
       |                                                         |
```

### Chi tiết các bước DORA:
1. **Discover (Tìm kiếm):** Khi thiết bị kết nối vào mạng và được cấu hình nhận IP động, nó gửi một gói tin *Broadcast* đến địa chỉ 255.255.255.255 với cổng đích (Destination Port) là 67 (UDP) để tìm DHCP Server.
2. **Offer (Cấp phát):** Bất kỳ DHCP Server nào nhận được gói Discover sẽ kiểm tra dải IP còn trống và gửi lại gói *Offer* chứa đề xuất một IP cụ thể kèm theo Subnet Mask.
3. **Request (Yêu cầu):** Client có thể nhận được nhiều Offer từ các Server khác nhau. Nó thường chọn Offer đầu tiên nhận được và gửi lại gói *Request* kiểu Broadcast để báo cho Server được chọn biết rằng nó chấp nhận IP đó, đồng thời thông báo cho các Server khác biết để họ thu hồi IP đề xuất.
4. **Acknowledge (Xác nhận):** Server được chọn gửi gói *ACK* để chính thức xác nhận việc cấp phát IP và gửi kèm các Option khác (Gateway, DNS, Lease time...).

### Lease Time và Renewal (Thời gian thuê và gia hạn)
- **Lease Time:** Là khoảng thời gian mà Client được phép sử dụng IP đó. Mặc định trên Windows Server là 8 ngày cho môi trường LAN.
- **T1 Timer (Renewal Time - 50% Lease):** Khi hết 50% thời hạn thuê, Client sẽ chủ động gửi gói tin DHCP Request (Unicast) đến DHCP Server đã cấp IP để xin gia hạn. Nếu Server còn sống, nó gửi ACK để gia hạn.
- **T2 Timer (Rebinding Time - 87.5% Lease):** Nếu bước gia hạn lúc T1 thất bại (Server cũ chết), khi đến 87.5% thời hạn, Client gửi gói tin DHCP Request (Broadcast) để cầu cứu *bất kỳ* DHCP Server nào trong mạng gia hạn giúp.

---

## 4. Các thành phần chính của DHCP

Để cấu hình một DHCP Server, bạn cần hiểu các khái niệm cơ bản sau:

1. **Scope (Phạm vi IP):** Là một dải địa chỉ IP liên tục trong một subnet mà Server có quyền cấp phát. (VD: `192.168.1.100` đến `192.168.1.200`).
2. **Exclusion Range (IP loại trừ):** Là các dải IP nằm bên trong Scope nhưng được loại trừ, không cấp phát cho Client (thường dùng cho các Server, Router đã set IP tĩnh nhưng IP đó lỡ nằm trong Scope).
3. **Reservation (Đặt trước IP):** Gắn cố định một IP cụ thể với một địa chỉ MAC cụ thể. Bất cứ khi nào thiết bị đó kết nối mạng, nó luôn nhận được IP cố định này từ DHCP.
4. **DHCP Options:** Các thông số cấu hình mở rộng gửi kèm với IP. Phổ biến nhất:
   - **Option 003**: Router / Default Gateway.
   - **Option 006**: DNS Servers.
   - **Option 015**: DNS Domain Name (VD: `corp.contoso.com`).
   - **Option 042**: NTP Server (Time Server).
5. **Superscope:** Là tập hợp nhiều Scope được gộp lại nhằm hỗ trợ cấp phát nhiều dải mạng (logical subnets) trên cùng một mạng vật lý (physical subnet).
6. **Multicast Scope:** Dùng để cấp phát dải địa chỉ Class D (Multicast IP: 224.0.0.0 - 239.255.255.255) cho các ứng dụng truyền phát đa phương tiện.

---

## 5. Cấu hình DHCP trên Windows Server

Trên Windows Server, DHCP là một Server Role mà bạn phải cài đặt.

### Bước 1: Cài đặt DHCP Role
Bạn có thể cài qua Server Manager hoặc bằng PowerShell:
```powershell
Install-WindowsFeature -Name DHCP -IncludeManagementTools
```

### Bước 2: Authorize DHCP in Active Directory (Quan trọng!)
Trong môi trường Domain (Active Directory), một DHCP Server mới dựng lên sẽ **không được phép hoạt động** trừ khi nó được ủy quyền (Authorized) bởi Enterprise Admin. Điều này nhằm ngăn chặn các máy chủ DHCP lạ cướp quyền (Rogue DHCP Server).
```powershell
# Ví dụ authorize Server có IP 192.168.1.10
Add-DhcpServerInDC -DnsName "dhcp1.contoso.com" -IPAddress 192.168.1.10
```

### Bước 3: Tạo Scope
Ví dụ tạo một Scope cho mạng LAN 192.168.1.0/24, cấp IP từ 100 đến 200:
```powershell
Add-DhcpServerv4Scope -Name "LAN_Network" -StartRange 192.168.1.100 -EndRange 192.168.1.200 -SubnetMask 255.255.255.0 -State Active
```

### Bước 4: Cấu hình Exclusion Range
Loại trừ dải IP từ `192.168.1.110` đến `192.168.1.120` khỏi Scope vừa tạo:
```powershell
Add-DhcpServerv4ExclusionRange -ScopeId 192.168.1.0 -StartRange 192.168.1.110 -EndRange 192.168.1.120
```

### Bước 5: Cấu hình DHCP Options
Set Default Gateway (003) và DNS Server (006) cho Scope:
```powershell
Set-DhcpServerv4OptionValue -ScopeId 192.168.1.0 -OptionId 3 -Value 192.168.1.1
Set-DhcpServerv4OptionValue -ScopeId 192.168.1.0 -OptionId 6 -Value "192.168.1.5, 8.8.8.8"
```

### Bước 6: Cấu hình Reservation
Đặt trước IP `192.168.1.150` cho máy in có MAC `00-11-22-33-44-55`:
```powershell
Add-DhcpServerv4Reservation -ScopeId 192.168.1.0 -IPAddress 192.168.1.150 -ClientId "00-11-22-33-44-55" -Description "Printer HP"
```

---

## 6. DHCP Failover (Khả năng chịu lỗi)

Từ Windows Server 2012, Microsoft giới thiệu tính năng DHCP Failover giúp 2 DHCP Server cùng đồng bộ và chia sẻ một Scope để dự phòng.

**Hai chế độ hoạt động:**
1. **Load Balance (Cân bằng tải):** Mặc định. Hai Server chia sẻ việc cấp phát IP dựa trên tỷ lệ (VD: 50%-50%). Thường dùng cho các Server nằm chung một Site (LAN).
2. **Hot Standby (Dự phòng nóng):** Một Server đóng vai trò Active (chịu trách nhiệm 100% cấp IP). Server thứ 2 là Passive, chỉ đứng nhìn. Khi Active chết, Passive mới nhảy vào thay thế. Thường dùng khi có 1 Server ở Site chính và 1 Server ở Site dự phòng.

**Cấu hình Failover bằng PowerShell:**
```powershell
# Thiết lập Failover kiểu Load Balance giữa Server1 và Server2
Add-DhcpServerv4Failover -ComputerName "Server1.contoso.com" -Name "Failover_LAN" -PartnerServer "Server2.contoso.com" -ScopeId 192.168.1.0 -LoadBalancePercent 50 -SharedSecret "MySecretKey123"
```

---

## 7. DHCP Relay Agent

**Vấn đề:** Các gói tin DHCP Discover là **Broadcast** (địa chỉ đích 255.255.255.255). Mặc định, các thiết bị Router/Layer 3 Switch **KHÔNG** forward gói tin Broadcast qua các mạng (subnet) khác nhau. Do đó, nếu Client ở Vlan 10 và Server ở Vlan 20, quá trình DORA sẽ thất bại.

**Giải pháp:** Sử dụng **DHCP Relay Agent**.
- Relay Agent chặn gói tin DHCP Broadcast của Client, đóng gói nó thành dạng **Unicast** rồi gửi trực tiếp đến địa chỉ IP thật của DHCP Server ở mạng khác.
- Trên thiết bị Router/Switch (như Cisco), tính năng này được cấu hình bằng lệnh `ip helper-address <IP_DHCP_Server>`.
- Trên Windows Server, có thể cài đặt thông qua role **Routing and Remote Access (RRAS)**.

---

## 8. DHCP Security (Bảo mật DHCP)

### 1. Rogue DHCP Server (DHCP giả mạo)
Kẻ gian cắm một DHCP Server giả vào mạng, cấp IP bậy bạ (ví dụ Gateway trỏ về máy của kẻ gian) để thực hiện tấn công Man-in-the-Middle.
- **Phòng chống (Windows):** Tính năng **Authorization** trong Active Directory ngăn các Server Windows giả mạo hoạt động.
- **Phòng chống (Switch):** Sử dụng tính năng **DHCP Snooping** trên Switch. Switch chỉ cho phép các gói tin DHCPOffer đi ra từ cổng mà Admin đã chỉ định là "Trusted Port" (Cổng cắm DHCP Server thật).

### 2. MAC Filtering
Tính năng trên DHCP Server Windows cho phép chặn (Deny) hoặc cho phép (Allow) các Client nhận IP dựa vào địa chỉ MAC vật lý của chúng.

---

## 9. Troubleshooting DHCP (Khắc phục sự cố)

### Các lệnh ở phía Client
- `ipconfig /release` : Trả lại IP hiện tại đang thuê cho Server.
- `ipconfig /renew` : Bắt đầu lại quá trình DORA (hoặc xin gia hạn) để lấy IP mới.
- `ipconfig /all` : Xem chi tiết toàn bộ IP, MAC, DNS, Gateway, và thời hạn Lease.

### Hiện tượng APIPA (169.254.x.x)
Nếu một thiết bị Windows cấu hình nhận IP động nhưng không tìm thấy DHCP Server nào, hệ điều hành sẽ tự động gán một địa chỉ IP thuộc dải **169.254.0.0/16**. Đây gọi là tính năng **APIPA** (Automatic Private IP Addressing).
👉 *Khi thấy máy Client nhận IP dạng 169.254.x.x, nguyên nhân chắc chắn là lỗi kết nối mạng vật lý tới DHCP Server hoặc bản thân Server đang sập/hết IP.*

### Event Logs trên Server
Vào Event Viewer > Applications and Services Logs > Microsoft > Windows > DHCP-Server > Operational để xem các log liên quan đến việc cấp phát, xung đột IP.

---

## 10. Best Practices

1. **Authorization:** Luôn authorize Server mới trong môi trường AD để tránh Rogue Server.
2. **Lease Time hợp lý:** Với môi trường Office, Desktop ít di chuyển: để mặc định 8 ngày. Với mạng Wi-Fi khách (Guest Wi-Fi, Quán cafe): nên để Lease time thấp (ví dụ 1 - 2 tiếng) để giải phóng IP nhanh chóng.
3. **High Availability:** Luôn cấu hình DHCP Failover để đảm bảo không bị gián đoạn mạng khi 1 Server chết.
4. **IP tĩnh cho Server:** Router, Switch, Server (File, Web, DC) tuyệt đối phải cấu hình IP tĩnh và IP đó phải nằm ngoài các dải cấp phát (Exclusion Range) của DHCP.
5. **Backups:** Mặc định Windows tự động backup Database DHCP 60 phút một lần vào `%systemroot%\System32\dhcp\backup`. Hãy đảm bảo thư mục này được backup ra ổ đĩa/hệ thống khác.

---

## 11. Câu hỏi ôn tập (Review Questions)

1. Giao thức DHCP hoạt động trên Port nào? (UDP 67 trên Server, 68 trên Client).
2. Liệt kê và giải thích 4 bước trong tiến trình DORA.
3. Nếu thiết bị nhận được địa chỉ IP `169.254.20.50`, điều này có nghĩa là gì?
4. T1 Timer và T2 Timer khác nhau như thế nào trong quá trình gia hạn IP?
5. Sự khác biệt giữa Reservation và Exclusion Range là gì?
6. Để cấp phát Default Gateway và DNS cho Client thông qua DHCP, ta dùng DHCP Option số mấy?
7. Trong môi trường AD, điều gì xảy ra nếu ta cài DHCP Server nhưng chưa Authorize nó?
8. Tính năng DHCP Failover hỗ trợ mấy chế độ? Đặc điểm của từng chế độ là gì?
9. Khi Client và Server nằm ở hai Subnet (VLAN) khác nhau, thành phần mạng nào là bắt buộc để DHCP có thể hoạt động?
10. Gói tin DHCP Discover là Unicast hay Broadcast? Tại sao?

---

### Liên kết (Obsidian Links)
- [[Active Directory]]
- [[Domain]]
- [[Group Policy (GPO)]]
- [[DNS]]
- [[File Server]]
