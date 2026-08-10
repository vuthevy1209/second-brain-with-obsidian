# 🪓 Phân mảnh mạng (Network Segmentation) — Chia nhỏ mạng để giảm rủi ro

## 1. Network Segmentation là gì?
**Network Segmentation** (Phân mảnh mạng) là một kỹ thuật kiến trúc chia một mạng máy tính lớn thành nhiều mạng con (subnet) hoặc phân đoạn (segment) nhỏ hơn, độc lập với nhau. Quá trình giao tiếp giữa các phân đoạn này được kiểm soát chặt chẽ thông qua các thiết bị như Firewall, Router hoặc Switch layer 3.

**Tương tự (Analogy):** 
Hãy tưởng tượng một con tàu chở khách khổng lồ. Nếu toàn bộ thân dưới của con tàu là một không gian trống (Flat Network), một lỗ thủng nhỏ cũng sẽ khiến nước tràn vào toàn bộ tàu và làm nó chìm. Tuy nhiên, nếu thân dưới được chia thành nhiều khoang kín nước (Segmentation), khi một khoang bị thủng, nước chỉ tràn vào khoang đó. Các khoang khác vẫn an toàn và con tàu tiếp tục nổi. Trong không gian mạng, "nước" chính là mã độc (malware), hacker hoặc broadcast storm.

## 2. Tại sao cần Segmentation?

### Mạng phẳng (Flat Network) — Rủi ro cực lớn
Trong một Flat Network, tất cả các thiết bị (Server, PC, Máy in, Camera) đều nằm trong chung một Broadcast Domain và có thể giao tiếp trực tiếp với nhau mà không có sự kiểm soát nào.

```ascii
[Internet]
    |
 [Firewall]
    |
 [Core Switch] -------------------------
  |          |          |          |
[DB Srv]  [Web Srv]  [User PC]  [Guest WiFi]
(10.0.0.1)(10.0.0.2)(10.0.0.10) (10.0.0.50)
```
*Tất cả ở cùng VLAN 1 - 10.0.0.0/24*

**Rủi ro:** Nếu "User PC" bị nhiễm Ransomware, nó sẽ lây lan trực tiếp sang "DB Srv" và "Web Srv" với tốc độ ánh sáng vì không có "cửa" nào ngăn cản.

### Mạng đã phân mảnh (Segmented Network) — Lợi ích
```ascii
                            [Internet]
                                |
                           [Firewall]
                                |
                          [Core Switch]
                                |
       +----------------+-------+-------+----------------+
       |                |               |                |
    [VLAN 10]        [VLAN 20]       [VLAN 30]        [VLAN 40]
      DMZ              App/DB          Users            Guest
 (10.0.10.0/24)   (10.0.20.0/24)  (10.0.30.0/24)   (10.0.40.0/24)
       |                |               |                |
   [Web Srv]        [DB Srv]        [User PC]      [Guest WiFi]
```

### Bảng So Sánh

| Tiêu chí | Flat Network (Không Segment) | Segmented Network (Có Segment) |
| :--- | :--- | :--- |
| **Bảo mật (Security)** | Rất kém. Nếu một thiết bị bị xâm nhập, hacker có thể quét và tấn công toàn mạng (Lateral Movement). | Rất cao. Hacker bị nhốt trong một Segment. Phải vượt qua Firewall/ACL để sang Segment khác. |
| **Hiệu suất (Performance)** | Kém. Gói tin Broadcast (ARP, DHCP) gửi tới toàn bộ thiết bị, gây lãng phí băng thông, dễ xảy ra Broadcast Storm. | Tốt. Broadcast domain được thu nhỏ. Thiết bị chỉ nhận các bản tin broadcast cần thiết. |
| **Quản lý (Management)** | Khó khăn khi mạng phình to. Khó xác định nguồn gốc sự cố. | Dễ dàng cô lập sự cố, theo dõi luồng dữ liệu (traffic flow). |
| **Tuân thủ (Compliance)** | Rất khó đáp ứng các tiêu chuẩn như PCI-DSS (yêu cầu tách biệt dữ liệu thẻ tín dụng). | Dễ dàng áp dụng chính sách bảo mật cho từng vùng (Zone) riêng biệt. |

## 3. Các phương pháp Segmentation

### 3.1. VLAN (Virtual Local Area Network) - Quan trọng nhất
VLAN chia một Switch vật lý thành nhiều Switch logic. Các thiết bị khác VLAN không thể giao tiếp trực tiếp ở Layer 2. Để giao tiếp, chúng phải qua Layer 3 (Router hoặc Layer 3 Switch) — quá trình này gọi là **Inter-VLAN Routing**.

*Cấu hình cơ bản trên Cisco Switch:*
```bash
# Tạo VLAN
Switch(config)# vlan 10
Switch(config-vlan)# name Users

# Gán port vào VLAN
Switch(config)# interface gigabitEthernet 0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
```

*Inter-VLAN Routing (Router-on-a-Stick):*
```bash
Router(config)# interface gigabitEthernet 0/0.10
Router(config-subif)# encapsulation dot1Q 10
Router(config-subif)# ip address 10.0.10.1 255.255.255.0
```

### 3.2. Subnetting (Chia mạng con ở Layer 3)
Phân chia không gian địa chỉ IP lớn thành các mạng nhỏ hơn. Ví dụ chia `10.0.0.0/16` thành nhiều subnet `/24`. Subnetting thường đi kèm với VLAN (1 VLAN = 1 Subnet).

### 3.3. Physical Segmentation (Phân mảnh vật lý)
Sử dụng các thiết bị phần cứng (Switch, Router, cáp) hoàn toàn độc lập (Air-gapped) cho các mạng cực kỳ nhạy cảm (như mạng điều khiển SCADA trong nhà máy điện, mạng lõi của ngân hàng). Rất đắt đỏ và khó quản lý.

### 3.4. Micro-Segmentation (Zero Trust)
Phân mảnh ở mức độ chi tiết nhất (từng máy ảo - VM, hoặc từng process). Thay vì dựa vào thiết bị mạng phần cứng, Micro-segmentation sử dụng Software-Defined Networking (SDN) hoặc tường lửa dựa trên Host để bao bọc tường lửa xung quanh *từng máy chủ ảo*. Nếu 2 VM nằm chung 1 VLAN, chúng vẫn có thể bị chặn không cho giao tiếp.

## 4. Segmentation trên Windows Server

Quản trị viên Windows Server sử dụng hệ sinh thái của Microsoft để thực thi Segmentation.

### 4.1. Hyper-V Virtual Switch
Hyper-V cung cấp 3 loại Virtual Switch để cách ly luồng mạng của máy ảo (VM):
- **External Switch:** VM kết nối trực tiếp với mạng vật lý bên ngoài (như một thiết bị vật lý).
- **Internal Switch:** VM chỉ có thể giao tiếp với các VM khác trên cùng Host và với chính Host vật lý đó. Không ra được Internet ngoài trừ phi Host cấu hình NAT/Routing.
- **Private Switch:** VM chỉ giao tiếp được với các VM khác trên cùng Host. Hoàn toàn cách ly khỏi Host vật lý và mạng ngoài.

*PowerShell:*
```powershell
# Tạo Internal Switch cho mạng Backend Database an toàn
New-VMSwitch -Name "Backend_DB_Switch" -SwitchType Internal

# Tạo Private Switch cho môi trường Test Malware
New-VMSwitch -Name "Malware_Lab" -SwitchType Private
```

### 4.2. VLAN trên Hyper-V
Hyper-V cho phép gán VLAN ID trực tiếp cho Virtual Network Adapter của máy ảo, biến Hyper-V Virtual Switch thành một Trunk port ảo.

*PowerShell:*
```powershell
# Gán VM "SQL-Server-01" vào VLAN 50
Set-VMNetworkAdapterVlan -VMName "SQL-Server-01" -Access -VlanId 50

# Cấu hình Trunk cho VM (Ví dụ: Firewall ảo chạy trên Hyper-V cần nhận nhiều VLAN)
Set-VMNetworkAdapterVlan -VMName "vFirewall" -Trunk -AllowedVlanIdList "10,20,30-50" -NativeVlanId 1
```

### 4.3. Windows Defender Firewall with Advanced Security
Ngay cả trong cùng một Subnet/VLAN, sử dụng Windows Firewall trên Server để cô lập dịch vụ (Host-based Micro-segmentation).
Ví dụ: Chỉ cho phép máy chủ Web (IP: 10.0.20.5) truy cập cổng 1433 (SQL) trên máy chủ Database, chặn tất cả các IP khác trong cùng VLAN.

*PowerShell:*
```powershell
New-NetFirewallRule -DisplayName "Allow SQL from WebSrv Only" `
                    -Direction Inbound `
                    -LocalPort 1433 `
                    -Protocol TCP `
                    -Action Allow `
                    -RemoteAddress 10.0.20.5
```

### 4.4. IPsec Connection Security Rules
Windows Server hỗ trợ sử dụng IPsec để cô lập Domain (Server and Domain Isolation). Chỉ những máy tính thuộc Active Directory Domain và xác thực thành công qua Kerberos/IPsec mới được phép giao tiếp với Server. Kẻ tấn công cắm máy tính lạ vào VLAN sẽ bị từ chối kết nối IPsec.

## 5. Thiết kế Segmentation — Mô hình tham khảo

### Sơ đồ kiến trúc VLAN tiêu chuẩn Doanh nghiệp
```ascii
                                 [Internet]
                                      |
                              [Edge Firewall]
                                      |
                      +---------------+---------------+
                      |                               |
                 [DMZ VLAN 10]                  [Internal Core]
               (Public Facing)                        |
                 - Web Srv                      +-----+-----+-----+-----+
                 - Mail Relay                   |           |           |
                 - VPN Gateway           [VLAN 20]     [VLAN 30]   [VLAN 40]
                                          Servers       Users       Guest
                                            |             |           |
                                         - AD/DNS      - Sales PC  - BYOD
                                         - File Srv    - HR PC     - IoT
                                         - DB Srv
```

### Traffic Matrix (Ma trận luồng dữ liệu)
Việc xây dựng ma trận này giúp thiết lập các rule Firewall (ACL) giữa các Segments.

| Nguồn (Source) | Đích (Destination) | Cổng (Port) | Hành động (Action) | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Internet** | **DMZ (Web)** | TCP 443 | ALLOW | Khách hàng truy cập Web |
| **Internet** | **Servers / Users** | Bất kỳ | DENY | Chặn truy cập từ ngoài vào mạng nội bộ |
| **DMZ (Web)** | **Servers (DB)** | TCP 1433 | ALLOW | Web Backend truy vấn DB |
| **Users** | **Servers (File/AD)** | TCP 445, 389, 88 | ALLOW | User login và lấy dữ liệu |
| **Guest** | **Mạng nội bộ** | Bất kỳ | DENY | Guest chỉ được ra Internet |
| **Guest** | **Internet** | TCP 80, 443 | ALLOW | Guest truy cập web ngoài |

## 6. Tuân thủ (Compliance) và Segmentation

Network Segmentation không chỉ là kỹ thuật tốt mà còn là bắt buộc trong nhiều tiêu chuẩn:
- **PCI-DSS (Payment Card Industry):** Yêu cầu CDE (Cardholder Data Environment) phải được cách ly hoàn toàn khỏi các mạng khác. Segmentation giảm thiểu phạm vi (scope) cần đánh giá PCI, tiết kiệm chi phí Audit.
- **HIPAA (Y tế):** Phân mảnh mạng để bảo vệ ePHI (Dữ liệu sức khỏe bệnh nhân điện tử) khỏi các bộ phận không liên quan (như mạng Guest của bệnh viện).
- **ISO 27001 & NIST 800-53:** Đều có các Control yêu cầu phân tách luồng dữ liệu, ngăn chặn Lateral Movement và giới hạn vùng ảnh hưởng khi bị tấn công.

## 7. Zero Trust và Micro-Segmentation

**Zero Trust** thay đổi mô hình bảo mật từ "Tin tưởng nội bộ, phòng thủ bên ngoài" sang "Không tin tưởng ai, xác minh mọi thứ" (Never Trust, Always Verify).

### Nguyên tắc
1. Mạng nội bộ cũng nguy hiểm như Internet.
2. Không cho phép truy cập chỉ dựa trên địa chỉ IP hoặc VLAN.
3. Cấp quyền tối thiểu (Least Privilege) dựa trên Danh tính (Identity), Tình trạng thiết bị (Device Health), và Bối cảnh (Context).

### Áp dụng trên Windows
- **Credential Guard & Device Guard:** Bảo vệ thông tin xác thực trên OS.
- **Windows Hello for Business:** Thay thế mật khẩu bằng xác thực sinh trắc học/MFA.
- **Conditional Access (Azure AD/Entra ID):** Chỉ cho phép User truy cập Server nếu PC của họ đã cài Antivirus và cập nhật Patch mới nhất.
- **JIT (Just-In-Time) Access:** Quản trị viên chỉ được cấp quyền Admin truy cập Server vào đúng thời điểm cần thiết (ví dụ: trong 2 giờ) thay vì quyền vĩnh viễn.

## 8. Best Practices (Thực hành tốt nhất)

1. **Bắt đầu bằng Visibility:** Hiển thị và ghi log mọi luồng traffic hiện tại để biết "ai đang nói chuyện với ai" trước khi chặn.
2. **Nguyên tắc Đặc quyền tối thiểu (Least Privilege):** Mặc định Block-All giữa các VLANs, chỉ cho phép những Port/IP cụ thể (Default Deny).
3. **Tách biệt Management VLAN:** Tạo VLAN riêng (ví dụ VLAN 99) chỉ dành cho quản trị thiết bị mạng, iLO/iDRAC, Hyper-V Host. Chỉ IP của IT Admin mới vào được VLAN này.
4. **Tách biệt Mạng Khách (Guest Wi-Fi):** Đưa Guest Wi-Fi ra đường mạng riêng, đi thẳng ra Internet, không cho route ngược về Internal.
5. **Tách biệt Mạng IoT/Camera:** Camera IP, máy in, Smart TV cực kỳ dễ bị hack. Đưa chúng vào VLAN riêng không cho ra Internet.
6. **Sử dụng Micro-segmentation cho Data Center:** 2 Server cùng VLAN cũng phải giới hạn port liên lạc với nhau qua Host-based Firewall.
7. **Tránh "VLAN Hopping":** Không sử dụng VLAN 1 làm Native VLAN. Tắt DTP (Dynamic Trunking Protocol) trên các port của switch.
8. **Kiểm soát truy cập dựa trên Role (RBAC):** Kết hợp Segmentation với Active Directory Groups (Ai thuộc nhóm HR mới được đi qua Firewall vào Server HR).
9. **Mô phỏng trước khi triển khai (Test Mode):** Chạy Firewall rule ở chế độ "Log Only" (Monitor mode) vài tuần để đảm bảo không chặn nhầm traffic nghiệp vụ.
10. **Review định kỳ:** Kiểm tra lại Firewall Rules 6 tháng/lần. Xóa các rules của dự án cũ đã kết thúc (Orphaned Rules).
11. **Giới hạn Lateral Movement:** Tắt chia sẻ file SMB (Port 445) giữa các máy trạm (Client-to-Client) để chặn lây lan Ransomware. Chỉ cho Client truy cập SMB trên Server.

## 9. Câu hỏi ôn tập (Review Questions)

1. **Network Segmentation giải quyết vấn đề bảo mật lớn nhất nào của mạng phẳng (Flat Network)?**
2. **Sự khác biệt giữa VLAN và Subnet là gì?**
3. **Trong Hyper-V, Virtual Switch loại nào sẽ cách ly hoàn toàn máy ảo khỏi mạng vật lý và Host OS?**
4. **Làm thế nào để cấu hình Micro-segmentation giữa 2 máy chủ Windows chạy chung một VLAN?**
5. **Lợi ích của việc áp dụng Segmentation trong chuẩn PCI-DSS là gì?**
6. **"Lateral Movement" (Di chuyển ngang) là gì và Segmentation chặn nó như thế nào?**
7. **Tại sao việc đưa mạng Camera an ninh và IoT vào một VLAN riêng biệt là Best Practice?**
8. **VLAN Hopping là một kỹ thuật tấn công gì và cách phòng chống?**
9. **Lệnh PowerShell nào được dùng để gán VLAN ID cho máy ảo trong Hyper-V?**
10. **Mô hình bảo mật Zero Trust khác biệt với mô hình Perimeter Security truyền thống như thế nào về mặt tin tưởng mạng nội bộ?**

---
**Liên kết mở rộng:**
[[Firewall]] · [[ACL]] · [[IDS]] · [[IPS]] · [[DMZ]] · [[VPN]]
