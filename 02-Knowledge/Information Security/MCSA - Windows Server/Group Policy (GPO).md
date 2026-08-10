# 📜 Group Policy (GPO) — Áp chính sách cho máy và user

## 1. Group Policy là gì?

**Group Policy** là cơ chế quản lý tập trung của Windows, cho phép admin **áp dụng cấu hình và chính sách** (settings, restrictions, configurations) cho **hàng loạt users và computers** trong domain thông qua **Group Policy Objects (GPO)**.

> 💡 **Ví dụ đơn giản:** GPO giống như **nội quy công ty** — viết một lần, áp dụng cho tất cả nhân viên. Ví dụ: "Tất cả máy tính phải đổi mật khẩu mỗi 90 ngày" — chỉ cần tạo 1 GPO, tự động áp cho toàn bộ.

---

## 2. Tại sao cần Group Policy?

| Không có GPO | Có GPO |
|---|---|
| Cấu hình **từng máy** một | Cấu hình **1 lần**, áp cho **hàng nghìn máy** |
| Tốn thời gian, dễ sai sót | Nhanh, nhất quán, ít sai sót |
| Khó enforce security | Bắt buộc security settings cho tất cả |
| User có thể tự ý thay đổi settings | Admin kiểm soát, user không đổi được |

### GPO làm được gì?

```
Group Policy có thể:
├── 🔐 Security Settings
│   ├── Password Policy (độ dài, phức tạp, thời hạn)
│   ├── Account Lockout Policy
│   ├── Audit Policy
│   └── User Rights Assignment
│
├── 💻 Computer Configuration
│   ├── Cài đặt phần mềm (Software Installation)
│   ├── Windows Update settings
│   ├── Firewall Rules
│   ├── BitLocker (mã hóa ổ đĩa)
│   └── Startup/Shutdown Scripts
│
├── 👤 User Configuration
│   ├── Desktop settings (wallpaper, screensaver)
│   ├── Drive mapping (map ổ mạng)
│   ├── Folder Redirection (chuyển hướng My Documents)
│   ├── IE/Edge settings
│   ├── Logon/Logoff Scripts
│   └── Restrict Control Panel, CMD, Registry...
│
└── 📦 Software Deployment
    ├── Assign (bắt buộc cài)
    └── Publish (tùy chọn cài)
```

---

## 3. Kiến trúc Group Policy

### 3.1. GPO (Group Policy Object)

Mỗi GPO gồm **2 phần**:

| Phần | Lưu trữ ở | Chứa |
|---|---|---|
| **GPC** (Group Policy Container) | Active Directory (LDAP) | Metadata: version, status, links |
| **GPT** (Group Policy Template) | SYSVOL share (`\\domain\SYSVOL`) | Thực thể: settings, scripts, files |

```
SYSVOL location:
C:\Windows\SYSVOL\domain\Policies\{GUID}\
├── Machine\              ← Computer Configuration settings
│   ├── Registry.pol      ← Registry-based settings
│   ├── Scripts\          ← Startup/Shutdown scripts
│   │   ├── Startup\
│   │   └── Shutdown\
│   └── Microsoft\Windows NT\SecEdit\
│       └── GptTmpl.inf   ← Security settings
├── User\                 ← User Configuration settings
│   ├── Registry.pol
│   └── Scripts\
│       ├── Logon\
│       └── Logoff\
└── GPT.INI               ← Version information
```

### 3.2. GPO Links

GPO có thể **link** (gắn kết) đến:

```
┌─────────┐
│  Site    │ ← GPO cho cả site (ít dùng)
└────┬─────┘
     │
┌────┴─────┐
│  Domain  │ ← GPO cho toàn domain (Password Policy, Audit)
└────┬─────┘
     │
┌────┴─────┐
│   OU     │ ← GPO cho OU cụ thể (phổ biến nhất)
└────┬─────┘
     │
┌────┴─────┐
│ Child OU │ ← GPO cho OU con
└──────────┘
```

---

## 4. GPO Processing Order — LSDOU

### 4.1. Thứ tự xử lý GPO

```
L → Local GPO         (trên máy local)     — Ưu tiên THẤP nhất
S → Site GPO           (áp cho Site)
D → Domain GPO         (áp cho Domain)
OU → OU GPO            (áp cho OU)           — Ưu tiên CAO nhất
    └── Child OU GPO   (OU con override OU cha)
```

> 🔑 **Quy tắc:** GPO xử lý SAU sẽ **override** GPO xử lý TRƯỚC. Nghĩa là **OU GPO có quyền cao nhất**.

### 4.2. Ví dụ minh họa

```
Scenario: Đặt wallpaper

Local GPO:     Wallpaper = "nature.jpg"
Site GPO:      (không set)
Domain GPO:    Wallpaper = "company-logo.jpg"
OU GPO (IT):   Wallpaper = "it-team.jpg"

→ Kết quả: User trong OU IT thấy wallpaper = "it-team.jpg"
  (OU GPO override Domain GPO)
```

### 4.3. Đặc biệt: Enforcement & Inheritance Blocking

#### Enforced (No Override)
```
Domain GPO [Enforced] → KHÔNG thể bị override bởi OU GPO
                        → Ưu tiên CAO NHẤT
```

#### Block Inheritance
```
OU [Block Inheritance] → KHÔNG nhận GPO từ parent (Domain, Site)
                        → Nhưng vẫn bị override bởi Enforced GPO
```

#### Thứ tự ưu tiên cuối cùng:
```
1. Enforced GPO (cao nhất — không ai override được)
2. OU GPO (child OU > parent OU)
3. Domain GPO
4. Site GPO
5. Local GPO (thấp nhất)

⚠️ Enforced > Block Inheritance
```

---

## 5. Computer Configuration vs User Configuration

| | Computer Configuration | User Configuration |
|---|---|---|
| **Áp dụng cho** | Máy tính (Computer Account) | Người dùng (User Account) |
| **Khi nào áp dụng** | Khi máy **khởi động** (startup) | Khi user **đăng nhập** (logon) |
| **Ảnh hưởng** | Mọi user trên máy đó | Chỉ user đó, trên mọi máy |
| **Ví dụ** | Firewall, Windows Update, Audit | Wallpaper, Drive Map, Folder Redirect |
| **Path** | `Computer Configuration → ...` | `User Configuration → ...` |

### Loopback Processing (Trường hợp đặc biệt)

```
Bình thường:
Computer GPO áp theo OU của Computer
User GPO áp theo OU của User

Loopback Processing:
User GPO cũng áp theo OU của COMPUTER (thay vì OU của User)

Ví dụ: User "Vy" (OU=IT) đăng nhập vào máy ở OU=Kiosk
→ Loopback: User settings của OU=Kiosk áp cho Vy
→ Vy bị giới hạn như user Kiosk
```

| Mode | Mô tả |
|---|---|
| **Replace** | Bỏ qua User GPO gốc, chỉ dùng Computer's OU GPO |
| **Merge** | Kết hợp cả 2, Computer's OU GPO ưu tiên hơn khi conflict |

---

## 6. Tạo và quản lý GPO

### 6.1. Tạo GPO qua GUI

```
1. Mở Group Policy Management Console (gpmc.msc)
2. Chuột phải OU → "Create a GPO in this domain, and Link it here"
3. Đặt tên GPO (ví dụ: "IT-Security-Settings")
4. Chuột phải GPO → Edit
5. Cấu hình settings
6. Đóng Editor → GPO tự động áp dụng
```

### 6.2. Quản lý GPO bằng PowerShell

```powershell
# Import module
Import-Module GroupPolicy

# Tạo GPO mới
New-GPO -Name "Security-Baseline" -Comment "Baseline security settings"

# Link GPO đến OU
New-GPLink -Name "Security-Baseline" `
    -Target "OU=Workstations,DC=company,DC=local" `
    -LinkEnabled Yes

# Xem tất cả GPO
Get-GPO -All | Format-Table DisplayName, GpoStatus, CreationTime

# Xem GPO áp dụng cho OU nào
Get-GPO -Name "Security-Baseline" | Get-GPOReport -ReportType Html -Path "C:\report.html"

# Xem chi tiết GPO
Get-GPOReport -Name "Security-Baseline" -ReportType Html -Path "C:\gpo-report.html"
# Mở file HTML để xem báo cáo đầy đủ

# Disable GPO
(Get-GPO -Name "Security-Baseline").GpoStatus = "AllSettingsDisabled"

# Xóa GPO
Remove-GPO -Name "Security-Baseline"

# Backup GPO
Backup-GPO -Name "Security-Baseline" -Path "C:\GPO-Backup"

# Backup tất cả GPO
Backup-GPO -All -Path "C:\GPO-Backup"

# Restore GPO
Restore-GPO -Name "Security-Baseline" -Path "C:\GPO-Backup"

# Import GPO từ backup
Import-GPO -BackupGpoName "Security-Baseline" `
    -TargetName "Security-Baseline-New" `
    -Path "C:\GPO-Backup" `
    -CreateIfNeeded

# Copy GPO
Copy-GPO -SourceName "Security-Baseline" -TargetName "Security-Baseline-v2"
```

---

## 7. Các GPO Settings quan trọng cho MCSA

### 7.1. Password Policy

```
Computer Configuration
└── Policies
    └── Windows Settings
        └── Security Settings
            └── Account Policies
                └── Password Policy
                    ├── Enforce password history: 24 passwords
                    ├── Maximum password age: 90 days
                    ├── Minimum password age: 1 day
                    ├── Minimum password length: 12 characters
                    ├── Password must meet complexity: Enabled
                    └── Store passwords using reversible encryption: Disabled
```

### 7.2. Account Lockout Policy

```
Account Lockout Policy:
├── Account lockout threshold: 5 invalid attempts
├── Account lockout duration: 30 minutes
└── Reset account lockout counter after: 30 minutes
```

### 7.3. Audit Policy

```
Computer Configuration
└── Policies
    └── Windows Settings
        └── Security Settings
            └── Advanced Audit Policy Configuration
                ├── Account Logon
                │   └── Audit Kerberos Authentication Service: Success, Failure
                ├── Logon/Logoff
                │   └── Audit Logon: Success, Failure
                ├── Object Access
                │   └── Audit File System: Success, Failure
                ├── Account Management
                │   └── Audit User Account Management: Success, Failure
                └── Policy Change
                    └── Audit Audit Policy Change: Success, Failure
```

### 7.4. User Rights Assignment

```
Computer Configuration
└── Policies
    └── Windows Settings
        └── Security Settings
            └── Local Policies
                └── User Rights Assignment
                    ├── Allow log on locally: Administrators, Users
                    ├── Allow log on through RDP: Administrators, Remote Desktop Users
                    ├── Deny log on locally: Guests
                    ├── Access this computer from network: Administrators, Users
                    └── Shut down the system: Administrators
```

### 7.5. Windows Update

```
Computer Configuration
└── Policies
    └── Administrative Templates
        └── Windows Components
            └── Windows Update
                ├── Configure Automatic Updates: Enabled
                │   → 4 - Auto download and schedule install
                ├── Specify intranet Microsoft update service: 
                │   → http://wsus-server:8530
                └── No auto-restart with logged on users: Enabled
```

### 7.6. Software Restriction / AppLocker

```
Computer Configuration
└── Policies
    └── Windows Settings
        └── Security Settings
            └── Application Control Policies
                └── AppLocker
                    ├── Executable Rules
                    │   └── Allow Everyone: All files in Program Files
                    ├── Windows Installer Rules
                    └── Script Rules
```

### 7.7. Drive Mapping (User)

```
User Configuration
└── Preferences
    └── Windows Settings
        └── Drive Maps
            → Action: Create
            → Location: \\SRV-FILE\SharedData
            → Drive Letter: S:
            → Reconnect: Yes
```

### 7.8. Folder Redirection

```
User Configuration
└── Policies
    └── Windows Settings
        └── Folder Redirection
            └── Documents
                → Setting: Basic - Redirect everyone's folder
                → Target: \\SRV-FILE\Users\%USERNAME%\Documents
```

---

## 8. GPO Filtering & Scoping

### 8.1. Security Filtering
- Mặc định GPO áp cho **Authenticated Users**
- Có thể thay đổi để GPO chỉ áp cho **group/user cụ thể**

```
Ví dụ: GPO "Deploy-Office" chỉ áp cho group "GG-Office-Users"
→ Security Filtering: Xóa "Authenticated Users" → Thêm "GG-Office-Users"
```

### 8.2. WMI Filtering
- Lọc GPO dựa trên **thuộc tính máy tính** (OS, RAM, model...)

```
Ví dụ: Chỉ áp GPO cho Windows 10/11
WMI Filter:
SELECT * FROM Win32_OperatingSystem WHERE Version LIKE "10.%"

Ví dụ: Chỉ áp cho laptop
WMI Filter:
SELECT * FROM Win32_Battery WHERE BatteryStatus > 0
```

```powershell
# Tạo WMI Filter
$wmiFilter = New-Object Microsoft.GroupPolicy.WmiFilter
# (Thường tạo qua GUI: gpmc.msc → WMI Filters)
```

### 8.3. Item-Level Targeting (Preferences)
- Chỉ áp dụng cho **Group Policy Preferences**
- Lọc chi tiết: theo OU, Group, IP range, OS, Computer name...

---

## 9. Troubleshooting GPO

### 9.1. gpresult (Xem GPO đã áp dụng)

```cmd
:: Xem GPO áp dụng cho user hiện tại
gpresult /r

:: Xem chi tiết
gpresult /v

:: Xuất report HTML
gpresult /h "C:\gpo-result.html"

:: Xem GPO cho user/computer cụ thể
gpresult /user "COMPANY\nguyenvana" /r
gpresult /scope computer /r
```

### 9.2. gpupdate (Cập nhật GPO)

```cmd
:: Force update GPO ngay lập tức
gpupdate /force

:: Chỉ update Computer Policy
gpupdate /target:computer /force

:: Chỉ update User Policy
gpupdate /target:user /force
```

```powershell
# Force GPO update từ xa (trên DC)
Invoke-GPUpdate -Computer "PC-001" -Force -RandomDelayInMinutes 0
```

### 9.3. Group Policy Modeling & Results

```
gpmc.msc:
├── Group Policy Modeling   → "What-if" — Nếu áp GPO này thì kết quả thế nào?
└── Group Policy Results    → Thực tế — GPO nào đang áp dụng trên máy/user?
```

### 9.4. RSoP (Resultant Set of Policy)

```cmd
:: Xem RSoP
rsop.msc
```

### 9.5. Lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| GPO không áp dụng | GPO chưa link đến OU | Kiểm tra GPO Link |
| GPO không áp dụng | Security Filtering sai | Kiểm tra Security Filtering |
| GPO không áp dụng | WMI Filter loại trừ | Kiểm tra WMI Filter |
| GPO bị override | GPO OU con override | Dùng Enforced nếu cần |
| GPO chậm áp dụng | SYSVOL replication chưa xong | Kiểm tra DFS Replication |
| Settings bị revert | GPO re-apply mỗi 90 phút | Đó là by design |

### 9.6. GPO Refresh Interval

```
Computer GPO: Áp dụng khi startup + mỗi 90-120 phút
User GPO: Áp dụng khi logon + mỗi 90-120 phút
DC GPO: Mỗi 5 phút
Security Settings: Mỗi 16 giờ (dù không thay đổi)
```

---

## 10. Central Store (ADMX)

### 10.1. Vấn đề
- Administrative Templates (`.admx`) mặc định lấy từ **local machine**
- Mỗi máy có thể có version khác nhau → inconsistent

### 10.2. Giải pháp: Central Store
- Copy `.admx` files vào **SYSVOL Central Store**
- Tất cả admin dùng **cùng template** khi edit GPO

```cmd
:: Tạo Central Store
mkdir "\\company.local\SYSVOL\company.local\Policies\PolicyDefinitions"

:: Copy ADMX files từ máy Windows 10/11
xcopy "C:\Windows\PolicyDefinitions\*" "\\company.local\SYSVOL\company.local\Policies\PolicyDefinitions\" /s /y
```

---

## 11. Best Practices

1. **Đặt tên GPO rõ ràng** — `SEC-PasswordPolicy`, `USER-DriveMapping`, `SW-Office365`
2. **Không sửa Default Domain Policy** — Chỉ dùng cho Password & Account Lockout
3. **Không sửa Default Domain Controllers Policy** — Chỉ dùng cho audit trên DC
4. **Tạo GPO riêng cho mỗi mục đích** — Dễ quản lý, dễ troubleshoot
5. **Disable unused section** — Nếu GPO chỉ có Computer settings → Disable User section
6. **Test trước khi deploy** — Link GPO vào OU test trước
7. **Document** — Ghi chú mục đích của mỗi GPO
8. **Backup GPO định kỳ** — `Backup-GPO -All`
9. **Sử dụng Security Filtering** — Thay vì tạo nhiều GPO giống nhau
10. **Central Store** — Cho consistent ADMX templates

---

## 12. Câu hỏi ôn tập

1. **Group Policy** dùng để làm gì?
2. Thứ tự xử lý GPO là gì? (**LSDOU** nghĩa là gì?)
3. **Enforced** GPO có tác dụng gì?
4. **Block Inheritance** có tác dụng gì? Có bị Enforced override không?
5. **Computer Configuration** và **User Configuration** khác nhau thế nào?
6. **Loopback Processing** là gì? Khi nào cần dùng?
7. **Security Filtering** và **WMI Filtering** dùng để làm gì?
8. Lệnh nào để xem GPO đang áp dụng trên máy? (`gpresult` hay `gpupdate`?)
9. GPO được refresh mỗi bao lâu?
10. Tại sao KHÔNG nên chỉnh sửa **Default Domain Policy**?

---

> 🔗 **Liên kết:** [[Active Directory]] · [[Domain]] · [[DNS]] · [[DHCP]] · [[File Server]]
