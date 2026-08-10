# 🏢 Active Directory — Quản lý người dùng tập trung

## 1. Active Directory là gì?

**Active Directory (AD)** là dịch vụ **thư mục (directory service)** của Microsoft, cung cấp khả năng **quản lý tập trung** toàn bộ tài nguyên trong mạng doanh nghiệp: **users, computers, groups, printers, policies, permissions...**

> 💡 **Ví dụ đơn giản:** AD giống như **sổ danh bạ + hệ thống quản lý nhân sự** của công ty — lưu trữ thông tin tất cả nhân viên, phòng ban, thiết bị, và quy định ai được làm gì.

---

## 2. Tại sao cần Active Directory?

### Không có AD (Workgroup)

```
┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
│ PC 1 │   │ PC 2 │   │ PC 3 │   │ PC 4 │
│      │   │      │   │      │   │      │
│User A│   │User A│   │User A│   │User A│
│User B│   │User B│   │User B│   │User B│
└──────┘   └──────┘   └──────┘   └──────┘
  ⚠️ Mỗi máy quản lý user riêng
  ⚠️ Thêm 1 user = phải tạo trên TẤT CẢ máy
  ⚠️ Đổi mật khẩu = phải đổi trên TẤT CẢ máy
  ⚠️ Không có chính sách bảo mật thống nhất
```

### Có AD (Domain)

```
                 ┌──────────────────┐
                 │ Domain Controller│
                 │   (Active Dir)   │
                 │                  │
                 │ • User Database  │
                 │ • Group Policy   │
                 │ • Authentication │
                 │ • Authorization  │
                 └────────┬─────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     ┌────┴───┐     ┌────┴───┐     ┌────┴───┐
     │  PC 1  │     │  PC 2  │     │  PC 3  │
     │        │     │        │     │        │
     │ Login  │     │ Login  │     │ Login  │
     │ với AD │     │ với AD │     │ với AD │
     └────────┘     └────────┘     └────────┘
  ✅ Quản lý tập trung
  ✅ Thêm 1 user = tạo 1 lần trên AD, dùng ở MỌI máy
  ✅ Đổi mật khẩu 1 lần = áp dụng mọi nơi
  ✅ Chính sách bảo mật thống nhất (GPO)
```

---

## 3. Các thành phần cốt lõi của Active Directory

### 3.1. Active Directory Domain Services (AD DS)

Đây là thành phần **chính** và quan trọng nhất:

| Thành phần | Chức năng |
|---|---|
| **AD DS** | Lưu trữ và quản lý objects (users, computers, groups...) |
| **AD CS** | Certificate Services — Quản lý chứng chỉ số (PKI) |
| **AD FS** | Federation Services — Single Sign-On (SSO) liên tổ chức |
| **AD LDS** | Lightweight Directory Services — AD "nhẹ" cho ứng dụng |
| **AD RMS** | Rights Management Services — Bảo vệ tài liệu |

### 3.2. Cấu trúc Logic

```
Forest (Rừng)
└── Domain (Miền)
    └── Organizational Unit - OU (Đơn vị tổ chức)
        └── Objects (Đối tượng)
            ├── Users (Người dùng)
            ├── Computers (Máy tính)
            ├── Groups (Nhóm)
            ├── Printers (Máy in)
            └── Shared Folders (Thư mục chia sẻ)
```

#### Forest (Rừng)
- **Container lớn nhất** trong AD
- Một forest có thể chứa **nhiều domains**
- Tất cả domains trong cùng forest **chia sẻ**:
  - Schema (cấu trúc dữ liệu)
  - Global Catalog
  - Configuration partition
- **Trust tự động** giữa các domains trong cùng forest

#### Domain (Miền)
- Đơn vị quản trị **cơ bản** trong AD
- Mỗi domain có:
  - **Database riêng** (NTDS.dit)
  - **Policy riêng** (Group Policy)
  - **Admin riêng** (Domain Admins)
- Ví dụ: `company.local`, `corp.example.com`

#### Organizational Unit — OU (Đơn vị tổ chức)
- **Container** dùng để **tổ chức** objects trong domain
- Có thể **lồng nhau** (nested OU)
- Dùng để **áp dụng Group Policy (GPO)**
- Dùng để **ủy quyền quản trị** (delegation)

```
Domain: company.local
├── OU=Hanoi
│   ├── OU=IT
│   │   ├── User: admin01
│   │   └── Computer: SRV-DC01
│   ├── OU=HR
│   │   ├── User: hr01
│   │   └── User: hr02
│   └── OU=Sales
│       └── User: sales01
├── OU=HCM
│   ├── OU=IT
│   └── OU=Marketing
└── OU=Servers
    ├── Computer: SRV-WEB01
    └── Computer: SRV-DB01
```

### 3.3. Cấu trúc Vật lý

#### Domain Controller (DC)
- Server chạy **AD DS** role
- Lưu trữ **bản sao database AD** (NTDS.dit)
- Xử lý **xác thực** (authentication) và **ủy quyền** (authorization)
- **Multi-master replication** — tất cả DC đều có thể ghi (writable)
- **Nên có ít nhất 2 DC** cho mỗi domain (redundancy)

#### Site
- Đại diện cho **vị trí vật lý** (văn phòng, data center)
- Dùng để tối ưu **replication traffic** giữa các DC
- Client sẽ **xác thực với DC gần nhất** (same site)

```
┌─────────────────┐         WAN Link          ┌─────────────────┐
│   Site: Hanoi   │ ◄──────────────────────► │   Site: HCM     │
│                 │    Replication            │                 │
│  DC1  DC2       │    (scheduled)           │  DC3  DC4       │
│  PC1  PC2  PC3  │                          │  PC4  PC5  PC6  │
└─────────────────┘                          └─────────────────┘
```

#### Global Catalog (GC)
- **Chỉ mục** chứa **một phần thông tin** của tất cả objects trong **toàn forest**
- Dùng cho:
  - **Universal Group membership** lookup
  - **Cross-domain search** (tìm kiếm xuyên domain)
  - **UPN logon** (user@company.local)
- Ít nhất **1 DC mỗi site** nên là GC server

---

## 4. Objects trong Active Directory

### 4.1. User Account

```powershell
# Tạo user mới
New-ADUser -Name "Nguyen Van A" `
    -SamAccountName "nguyenvana" `
    -UserPrincipalName "nguyenvana@company.local" `
    -GivenName "A" `
    -Surname "Nguyen Van" `
    -DisplayName "Nguyen Van A" `
    -Path "OU=IT,OU=Hanoi,DC=company,DC=local" `
    -AccountPassword (ConvertTo-SecureString "P@ssw0rd123" -AsPlainText -Force) `
    -Enabled $true `
    -ChangePasswordAtLogon $true

# Xem thông tin user
Get-ADUser -Identity "nguyenvana" -Properties *

# Tìm kiếm user
Get-ADUser -Filter { Department -eq "IT" } -Properties Department

# Disable user (khi nghỉ việc)
Disable-ADAccount -Identity "nguyenvana"

# Reset password
Set-ADAccountPassword -Identity "nguyenvana" `
    -NewPassword (ConvertTo-SecureString "NewP@ss123" -AsPlainText -Force) `
    -Reset

# Unlock account (sau khi bị khóa)
Unlock-ADAccount -Identity "nguyenvana"

# Xóa user
Remove-ADUser -Identity "nguyenvana"
```

### 4.2. Computer Account

```powershell
# Xem tất cả computers trong domain
Get-ADComputer -Filter * | Format-Table Name, DistinguishedName

# Tìm computer không hoạt động > 90 ngày
$90days = (Get-Date).AddDays(-90)
Get-ADComputer -Filter { LastLogonDate -lt $90days } -Properties LastLogonDate |
    Format-Table Name, LastLogonDate

# Di chuyển computer đến OU khác
Move-ADObject -Identity "CN=PC-SALES01,CN=Computers,DC=company,DC=local" `
    -TargetPath "OU=Sales,OU=Hanoi,DC=company,DC=local"
```

### 4.3. Groups

| Loại Group | Scope | Sử dụng cho |
|---|---|---|
| **Domain Local** | Trong 1 domain | Gán permissions cho tài nguyên |
| **Global** | Trong 1 domain, nhưng có thể dùng ở domain khác | Tổ chức users theo phòng ban |
| **Universal** | Toàn forest | Gán quyền xuyên domain |

| Loại Group | Type | Mô tả |
|---|---|---|
| **Security Group** | Security | Gán permissions (NTFS, share, GPO filtering) |
| **Distribution Group** | Distribution | Gửi email (không gán permissions) |

#### Chiến lược AGDLP (Best Practice)

```
A   → Account (User)
G   → Global Group (theo phòng ban/chức năng)
DL  → Domain Local Group (gắn với tài nguyên)
P   → Permission (NTFS/Share permission)

Ví dụ:
User "Vy"
  → thêm vào Global Group "GG-IT-Staff"
    → thêm vào Domain Local Group "DL-FileServer-Read"
      → gán NTFS Read permission cho "\\SRV-FILE\Data"
```

```powershell
# Tạo Security Group
New-ADGroup -Name "GG-IT-Staff" `
    -GroupScope Global `
    -GroupCategory Security `
    -Path "OU=Groups,DC=company,DC=local" `
    -Description "Global group for IT Staff"

New-ADGroup -Name "DL-FileServer-Read" `
    -GroupScope DomainLocal `
    -GroupCategory Security `
    -Path "OU=Groups,DC=company,DC=local"

# Thêm user vào group
Add-ADGroupMember -Identity "GG-IT-Staff" -Members "nguyenvana"

# Thêm group vào group (AGDLP)
Add-ADGroupMember -Identity "DL-FileServer-Read" -Members "GG-IT-Staff"

# Xem members của group
Get-ADGroupMember -Identity "GG-IT-Staff" | Format-Table Name, ObjectClass

# Xem user thuộc groups nào
Get-ADPrincipalGroupMembership -Identity "nguyenvana" | Format-Table Name
```

---

## 5. FSMO Roles (Flexible Single Master Operations)

Dù AD là **multi-master**, có 5 vai trò chỉ **1 DC giữ tại một thời điểm**:

### Forest-wide Roles (1 cho toàn forest)

| Role | Chức năng |
|---|---|
| **Schema Master** | Quản lý thay đổi Schema (cấu trúc database AD) |
| **Domain Naming Master** | Quản lý thêm/xóa domain trong forest |

### Domain-wide Roles (1 cho mỗi domain)

| Role | Chức năng |
|---|---|
| **PDC Emulator** | Đồng bộ thời gian, xử lý password change ưu tiên, tương thích legacy |
| **RID Master** | Cấp phát RID (Relative ID) cho objects mới |
| **Infrastructure Master** | Cập nhật references xuyên domain |

```powershell
# Xem DC nào giữ FSMO roles
netdom query fsmo

# Hoặc PowerShell
Get-ADForest | Format-List SchemaMaster, DomainNamingMaster
Get-ADDomain | Format-List PDCEmulator, RIDMaster, InfrastructureMaster

# Transfer FSMO role (khi cần chuyển sang DC khác)
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
    -OperationMasterRole PDCEmulator, RIDMaster, InfrastructureMaster

# Seize FSMO role (khi DC cũ bị hỏng, không thể transfer)
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
    -OperationMasterRole SchemaMaster -Force
```

---

## 6. Xác thực trong Active Directory

### 6.1. Kerberos (Mặc định)

```
1. User đăng nhập → gửi request đến KDC (DC)
        │
        ▼
2. KDC xác minh credentials → trả về TGT (Ticket Granting Ticket)
        │
        ▼
3. User muốn truy cập File Server → gửi TGT đến KDC
        │
        ▼
4. KDC trả về Service Ticket (ST) cho File Server
        │
        ▼
5. User gửi Service Ticket đến File Server → Được truy cập
```

| Thành phần | Mô tả |
|---|---|
| **KDC** | Key Distribution Center — chạy trên Domain Controller |
| **TGT** | Ticket Granting Ticket — "vé vào cổng" (có hạn 10h) |
| **Service Ticket** | "Vé dịch vụ" — để truy cập 1 service cụ thể |
| **Port** | TCP/UDP 88 |

### 6.2. NTLM (Legacy — tránh dùng)

- Giao thức xác thực **cũ**, kém an toàn hơn Kerberos
- Dùng **challenge-response** (không dùng tickets)
- Vẫn được dùng khi:
  - Client dùng **IP** thay vì hostname
  - Truy cập tài nguyên **ngoài domain**
  - **Legacy applications**

> ⚠️ NTLM dễ bị tấn công **Pass-the-Hash**, **Relay Attack**. Nên **disable NTLM** nếu có thể.

---

## 7. Replication (Nhân bản)

### 7.1. Intra-site Replication (Cùng site)
- Tự động, **ngay lập tức** (15 giây delay mặc định)
- Dùng **RPC over IP**
- **Không nén** dữ liệu (vì LAN nhanh)

### 7.2. Inter-site Replication (Khác site)
- Theo **lịch trình** (schedule) — mặc định mỗi 180 phút
- Dùng **RPC over IP** hoặc **SMTP** (chỉ cho schema/config)
- **Nén** dữ liệu (tiết kiệm WAN bandwidth)

```powershell
# Kiểm tra replication status
repadmin /replsummary
repadmin /showrepl

# Force replication
repadmin /syncall /AdeP

# Kiểm tra replication health
dcdiag /test:replications
```

---

## 8. Cài đặt Active Directory (Lab)

### 8.1. Cài AD DS Role

```powershell
# Bước 1: Cài đặt AD DS role
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools

# Bước 2: Promote server thành Domain Controller
# Tạo Forest mới
Install-ADDSForest `
    -DomainName "company.local" `
    -DomainNetBIOSName "COMPANY" `
    -ForestMode "WinThreshold" `
    -DomainMode "WinThreshold" `
    -InstallDns:$true `
    -SafeModeAdministratorPassword (ConvertTo-SecureString "RecoveryP@ss" -AsPlainText -Force) `
    -Force:$true

# Thêm DC thứ 2 vào domain hiện có
Install-ADDSDomainController `
    -DomainName "company.local" `
    -InstallDns:$true `
    -Credential (Get-Credential) `
    -SafeModeAdministratorPassword (ConvertTo-SecureString "RecoveryP@ss" -AsPlainText -Force)
```

### 8.2. Kiểm tra AD

```powershell
# Kiểm tra domain
Get-ADDomain

# Kiểm tra forest
Get-ADForest

# Kiểm tra DC
Get-ADDomainController -Filter *

# Health check
dcdiag /v
dcdiag /test:dns

# Kiểm tra AD database
Get-ItemProperty "C:\Windows\NTDS\ntds.dit" | Format-List Length, LastWriteTime
```

---

## 9. Active Directory Recycle Bin

```powershell
# Bật AD Recycle Bin (KHÔNG thể tắt sau khi bật)
Enable-ADOptionalFeature -Identity "Recycle Bin Feature" `
    -Scope ForestOrConfigurationSet `
    -Target "company.local"

# Xem objects đã xóa
Get-ADObject -Filter { isDeleted -eq $true } -IncludeDeletedObjects |
    Format-Table Name, ObjectClass, WhenChanged

# Restore object đã xóa
Get-ADObject -Filter { Name -like "*nguyenvana*" -and isDeleted -eq $true } `
    -IncludeDeletedObjects | Restore-ADObject
```

---

## 10. Bảo mật Active Directory

### Nguyên tắc bảo mật AD

| Nguyên tắc | Thực hiện |
|---|---|
| **Least Privilege** | Không cho user quyền Domain Admin khi không cần |
| **Tiered Admin Model** | Tách admin thành Tier 0 (DC), Tier 1 (Server), Tier 2 (Workstation) |
| **Protected Users Group** | Thêm admin vào group này → tăng bảo mật Kerberos |
| **LAPS** | Local Administrator Password Solution — mật khẩu local admin unique cho mỗi máy |
| **Audit** | Bật audit logon, account management, directory service access |
| **Backup AD** | Backup System State của DC định kỳ |

```powershell
# Kiểm tra password policy
Get-ADDefaultDomainPasswordPolicy

# Đặt password policy
Set-ADDefaultDomainPasswordPolicy -Identity "company.local" `
    -MinPasswordLength 12 `
    -PasswordHistoryCount 24 `
    -MaxPasswordAge "90.00:00:00" `
    -MinPasswordAge "1.00:00:00" `
    -ComplexityEnabled $true `
    -LockoutThreshold 5 `
    -LockoutDuration "00:30:00" `
    -LockoutObservationWindow "00:30:00"

# Fine-Grained Password Policy (cho group cụ thể)
New-ADFineGrainedPasswordPolicy -Name "Admin-Password-Policy" `
    -Precedence 10 `
    -MinPasswordLength 16 `
    -PasswordHistoryCount 48 `
    -MaxPasswordAge "30.00:00:00" `
    -LockoutThreshold 3 `
    -ComplexityEnabled $true

# Áp dụng cho group
Add-ADFineGrainedPasswordPolicySubject -Identity "Admin-Password-Policy" `
    -Subjects "Domain Admins"
```

---

## 11. Câu hỏi ôn tập

1. **Active Directory** dùng để làm gì?
2. Sự khác biệt giữa **Workgroup** và **Domain** là gì?
3. **Forest**, **Domain**, **OU** — mối quan hệ giữa chúng?
4. **Domain Controller** là gì? Tại sao cần ít nhất 2 DC?
5. **FSMO Roles** có bao nhiêu? Kể tên và chức năng.
6. **Kerberos** xác thực như thế nào? (mô tả flow)
7. **AGDLP** là gì? Tại sao nên dùng?
8. **Global Catalog** là gì? Chức năng?
9. Sự khác biệt giữa **Intra-site** và **Inter-site** replication?
10. Kể 3 biện pháp bảo mật Active Directory.

---

> 🔗 **Liên kết:** [[Domain]] · [[Group Policy (GPO)]] · [[DNS]] · [[DHCP]] · [[File Server]]
