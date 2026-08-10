# 🛡️ VPN — Virtual Private Network (Mạng riêng ảo)

## 1. VPN là gì?
**Virtual Private Network (VPN)** là một công nghệ cho phép tạo ra một "đường hầm" (tunnel) mã hóa, bảo mật để kết nối các thiết bị hoặc mạng cục bộ (LAN) lại với nhau thông qua một mạng công cộng, thường là Internet. 

**Analogy:** Tưởng tượng Internet như một hệ thống đường cao tốc công cộng, ai cũng có thể nhìn thấy xe của bạn. VPN giống như việc bạn xây một đường hầm riêng bí mật ngầm dưới lòng đất nối thẳng từ nhà đến công ty, không ai trên mặt đất có thể thấy bạn đang chở gì hay đi đâu.

## 2. Tại sao cần VPN?

| Lý do | Lợi ích chi tiết |
| :--- | :--- |
| **Bảo mật dữ liệu (Confidentiality)** | Mã hóa toàn bộ lưu lượng, ngăn chặn Packet Sniffing/Man-in-the-Middle (MitM) trên mạng công cộng. |
| **Bảo toàn dữ liệu (Integrity)** | Đảm bảo dữ liệu không bị chỉnh sửa trên đường truyền (thường dùng băm mật mã - Hashing). |
| **Xác thực (Authentication)** | Đảm bảo chỉ người dùng hoặc thiết bị hợp lệ mới được phép truy cập mạng nội bộ. |
| **Vượt rào cản địa lý (Geo-spoofing)** | Đổi IP để truy cập tài nguyên bị giới hạn vị trí địa lý hoặc bypass firewall. |
| **Tiết kiệm chi phí** | Thay vì thuê đường truyền riêng (Leased Line) đắt đỏ, VPN dùng Internet có sẵn với chi phí cực rẻ. |

## 3. Các loại VPN chính

### 3.1. Remote Access VPN (Client-to-Site)
Người dùng làm việc từ xa (Remote Worker) sử dụng phần mềm VPN Client để kết nối vào mạng nội bộ của công ty.

```text
[Laptop Client] 
      | (VPN Client Software)
      V
   (Internet) === Đường hầm VPN ===> [VPN Gateway/Server] ---> [Mạng LAN Công ty]
```
*Đặc điểm:* Yêu cầu cài đặt phần mềm, xác thực người dùng.

### 3.2. Site-to-Site VPN
Kết nối toàn bộ mạng LAN của một văn phòng (như chi nhánh) với một mạng LAN khác (như trụ sở chính) thông qua Internet.

```text
[Mạng LAN Chi nhánh]                        [Mạng LAN Trụ sở chính]
      |                                              |
 [VPN Router A] === Đường hầm VPN qua Internet ===> [VPN Router B]
```
*Đặc điểm:* Trong suốt với người dùng cuối (không cần cài Client). Router tự mã hóa và giải mã.

### 3.3. SSL VPN (Clientless)
Cung cấp quyền truy cập qua trình duyệt web sử dụng HTTPS (SSL/TLS).
*Đặc điểm:* Dễ triển khai, thường chỉ cấp quyền truy cập cho một số ứng dụng Web cụ thể chứ không cho toàn bộ mạng.

## 4. Các Giao thức VPN (VPN Protocols)

| Giao thức | Mức độ bảo mật | Tốc độ | Cổng (Port) | Nhận xét |
| :--- | :--- | :--- | :--- | :--- |
| **PPTP** | Rất yếu | Rất nhanh | TCP 1723, GRE 47 | Đã bị crack, KHÔNG BAO GIỜ NÊN DÙNG trong môi trường doanh nghiệp. |
| **L2TP/IPsec** | Cao | Chậm | UDP 500, 1701, 4500 | An toàn (nhờ IPsec mã hóa), nhưng overhead cao nên tốc độ bị giảm. Dễ bị chặn bởi NAT/Firewall. |
| **SSTP** | Rất cao | Nhanh | TCP 443 (HTTPS) | Đặc sản của Microsoft. Xuyên qua hầu hết Firewall và Proxy dễ dàng vì dùng port HTTPS. |
| **IKEv2/IPsec** | Rất cao | Rất nhanh | UDP 500, 4500 | Tự động kết nối lại khi rớt mạng (như từ WiFi sang 4G). Hỗ trợ chuẩn trên hầu hết HĐH hiện đại. |
| **OpenVPN** | Rất cao | Trung bình | Tùy chỉnh (UDP 1194) | Mã nguồn mở, cực kỳ an toàn, linh hoạt nhưng khó cấu hình trên Windows Server native (thường dùng appliance riêng). |
| **WireGuard** | Rất cao | Cực kỳ nhanh | Tùy chỉnh (UDP) | Hiện đại, gọn nhẹ, đang trở thành tiêu chuẩn mới. |

## 5. IPsec Chi Tiết (QUAN TRỌNG)
**IPsec (Internet Protocol Security)** là một bộ giao thức (framework) dùng để bảo vệ truyền tải dữ liệu ở Layer 3 (Network Layer).

### 5.1. Các thành phần chính của IPsec
- **AH (Authentication Header - Protocol 51):** Chỉ cung cấp Xác thực và Tính toàn vẹn. **Không mã hóa (No Encryption)** dữ liệu. Hiện nay ít dùng.
- **ESP (Encapsulating Security Payload - Protocol 50):** Cung cấp cả Mã hóa (Confidentiality), Xác thực và Tính toàn vẹn. Là thành phần cốt lõi của IPsec VPN.
- **IKE (Internet Key Exchange):** Dùng để thương lượng thuật toán và trao đổi khóa bí mật một cách an toàn giữa 2 thiết bị trước khi đường hầm truyền dữ liệu được thiết lập.
- **SA (Security Association):** Thỏa thuận giữa 2 bên về các thông số mã hóa/xác thực sẽ dùng.

### 5.2. Các chế độ hoạt động (Modes)
- **Transport Mode:** Chỉ mã hóa Data (Payload). Header IP gốc được giữ nguyên. Thường dùng trong mạng LAN hoặc Client-to-Site khi đã có 1 tunnel khác bọc lại (như L2TP/IPsec).
- **Tunnel Mode:** Mã hóa toàn bộ gói tin gốc (cả IP Header gốc và Data), sau đó bọc thêm một IP Header mới. Thường dùng trong Site-to-Site VPN để bảo vệ IP nội bộ.

### 5.3. IKE Phase 1 và Phase 2
Quá trình thiết lập IPsec gồm 2 giai đoạn:
- **Phase 1 (Main Mode / Aggressive Mode):** Xây dựng một kênh kết nối an toàn ban đầu. 2 bên xác thực lẫn nhau và thiết lập IKE SA (Management Tunnel).
- **Phase 2 (Quick Mode):** Trong kênh an toàn của Phase 1, 2 bên tiếp tục thương lượng để tạo ra IPsec SA. Đây là đường hầm (Data Tunnel) thực sự để truyền dữ liệu người dùng.

## 6. Cấu hình VPN trên Windows Server (RRAS)

**RRAS (Routing and Remote Access Service)** là role trên Windows Server cung cấp tính năng VPN và Định tuyến.

### 6.1. Cài đặt RRAS (PowerShell)
```powershell
# Cài đặt role DirectAccess and VPN (RAS)
Install-WindowsFeature RemoteAccess -IncludeManagementTools
Install-WindowsFeature DirectAccess-VPN -IncludeManagementTools
```

### 6.2. Cấu hình VPN Server
Các bước cấu hình cơ bản (GUI):
1. Mở **Routing and Remote Access** console.
2. Chuột phải vào tên Server -> **Configure and Enable Routing and Remote Access**.
3. Chọn **Custom Configuration** -> Check **VPN access**.
4. Cấp phát IP cho Client: Tab **IPv4** -> Chọn DHCP hoặc **Static address pool**.
5. Cấp quyền truy cập cho User: Mở **Active Directory Users and Computers**, chọn User -> tab **Dial-in** -> Check **Allow access**.

### 6.3. Quản lý bằng PowerShell
```powershell
# Cho phép user 'vyvt' được phép kết nối VPN
Set-ADUser -Identity vyvt -DialInPrivilege AllowAccess

# Tạo một Address Pool tĩnh cho VPN Client
Add-VpnS2SInterface -Name "VPNConnection" -Destination "10.0.0.1" -IPv4Subnet "192.168.10.0/24:10"
```

## 7. NPS (Network Policy Server) — RADIUS cho VPN
Thay vì cấu hình tab Dial-in cho từng User, ta dùng **NPS** (bản triển khai RADIUS của Microsoft) để quản lý tập trung.
- VPN Server (RRAS) đóng vai trò là **RADIUS Client**.
- NPS là **RADIUS Server**, chứa các Network Policies (vd: Chỉ cho phép nhóm "VPN Users" kết nối, yêu cầu xác thực MS-CHAPv2 hoặc EAP-TLS).
- Lợi ích: Quản lý chính sách tập trung, ghi log đầy đủ, hỗ trợ xác thực qua chứng chỉ (Certificates/Smartcard).

## 8. Split Tunneling vs Full Tunneling

**Vấn đề:** Khi máy khách kết nối VPN, tất cả traffic đi đâu?

### 8.1. Full Tunneling (Mặc định)
Tất cả lưu lượng (kể cả vào mạng công ty hay ra Facebook, Youtube) đều đi qua VPN về công ty.
* Ưu điểm: Bảo mật tối đa, dễ kiểm soát qua Firewall công ty.
* Nhược điểm: Chiếm băng thông lớn của công ty, tốc độ internet của Client bị chậm.

```text
[Client] === VPN ===> [Công ty] ---> [Internet (Facebook)]
```

### 8.2. Split Tunneling (Đường hầm phân chia)
Chỉ lưu lượng muốn vào mạng công ty (ví dụ: 192.168.1.x) mới chui vào VPN. Lưu lượng ra Internet công cộng đi trực tiếp từ mạng nhà người dùng.
* Ưu điểm: Tiết kiệm băng thông cho công ty, truy cập internet của Client rất nhanh.
* Nhược điểm: Nguy cơ bảo mật nếu máy tính Client bị dính mã độc từ Internet.

```text
[Client] === VPN ===> [Công ty] (Tài nguyên nội bộ)
   |
   +---> [Internet] (Đi trực tiếp ra Facebook, Youtube)
```

## 9. DirectAccess / Always On VPN

- **DirectAccess:** Tính năng cũ của Microsoft. Máy tính tự động kết nối an toàn về mạng nội bộ ngay khi có kết nối Internet (trước cả khi người dùng đăng nhập Windows). Dựa rất nhiều vào IPv6. Đã bị Microsoft ngừng phát triển (Deprecating).
- **Always On VPN:** Là sự thay thế cho DirectAccess. Tự động kết nối, tích hợp sâu vào Windows 10/11. Hỗ trợ IKEv2, xác thực qua Certificate máy tính hoặc người dùng. An toàn hơn, dễ cấu hình và tương thích với hạ tầng IPv4.

## 10. Best Practices
1. **Tuyệt đối không dùng PPTP.** Tắt PPTP trên RRAS nếu không dùng.
2. Ưu tiên sử dụng **SSTP** hoặc **IKEv2** (kèm chứng chỉ CA) cho Client-to-Site.
3. Sử dụng **NPS (RADIUS)** để quản lý chính sách và xác thực (EAP-TLS thay vì MS-CHAPv2).
4. Áp dụng MFA (Multi-Factor Authentication) cho kết nối VPN.
5. Cân nhắc kỹ khi sử dụng Split Tunneling; chỉ dùng nếu băng thông trụ sở hạn chế.
6. Cấu hình DHCP riêng biệt hoặc Static Pool riêng để dễ dàng tạo rule Firewall giới hạn quyền của subnet VPN.

## 11. Câu hỏi ôn tập

1. Sự khác biệt giữa Tunnel Mode và Transport Mode trong IPsec là gì?
2. Giao thức VPN nào của Microsoft sử dụng Port 443 và rất hiệu quả để vượt tường lửa?
3. Mô tả sự khác nhau giữa Split Tunneling và Full Tunneling. Phương pháp nào an toàn hơn?
4. RRAS đóng vai trò gì trong hệ thống VPN trên Windows Server?
5. IKE Phase 1 và Phase 2 khác nhau như thế nào?
6. Tại sao không nên sử dụng PPTP cho doanh nghiệp hiện nay?
7. Sự khác biệt giữa AH và ESP trong bộ giao thức IPsec là gì?
8. Tại sao NPS lại cần thiết khi triển khai VPN quy mô lớn thay vì cấu hình trên tab Dial-in của Active Directory?

---
*Liên kết liên quan:* [[Firewall]] · [[ACL]] · [[IDS]] · [[IPS]] · [[DMZ]] · [[Segmentation]]
