# 🌐 Domain — Môi trường quản trị tập trung

## 1. Domain là gì?

**Domain** là một **nhóm logic** gồm các máy tính, users, và tài nguyên mạng được **quản lý tập trung** bởi một hoặc nhiều **Domain Controller (DC)** sử dụng **Active Directory**.

> 💡 **Ví dụ đơn giản:** Domain giống như một **công ty** — có hệ thống quản lý nhân sự tập trung, mỗi nhân viên có thẻ nhân viên (account) dùng được ở mọi phòng (máy tính) trong công ty.

---

## 2. Workgroup vs Domain

### So sánh chi tiết

| Tiêu chí | Workgroup | Domain |
|---|---|---|
| **Quản lý** | Phi tập trung (mỗi máy tự quản) | Tập trung (qua Domain Controller) |
| **Database user** | SAM trên mỗi máy | AD database trên DC (NTDS.dit) |
| **Đăng nhập** | Chỉ đăng nhập local | Đăng nhập domain (dùng ở mọi máy) |
| **Số máy** | ≤ 20 máy (khuyến nghị) | Hàng ngàn máy |
| **Group Policy** | Chỉ Local GPO | Domain GPO (áp dụng hàng loạt) |
| **Bảo mật** | Khó kiểm soát | Tập trung, nhất quán |
| **Single Sign-On** | ❌ Không | ✅ Có |
| **Chi phí** | Miễn phí | Cần Windows Server license |
| **Phù hợp** | Nhà, quán net nhỏ | Doanh nghiệp |

### Sơ đồ so sánh

```
WORKGROUP:
┌──────┐  ┌──────┐  ┌──────┐
│ PC 1 │  │ PC 2 │  │ PC 3 │    Mỗi máy có database user riêng
│ SAM  │  │ SAM  │  │ SAM  │    Không liên kết với nhau
└──────┘  └──────┘  └──────┘

DOMAIN:
              ┌────────────┐
              │     DC     │        1 database chung cho tất cả
              │  (AD DS)   │
              └──────┬─────┘
         ┌───────────┼───────────┐
    ┌────┴───┐  ┌────┴───┐  ┌───┴────┐
    │  PC 1  │  │  PC 2  │  │  PC 3  │  Tất cả dùng chung AD
    │(member)│  │(member)│  │(member)│
    └────────┘  └────────┘  └────────┘
```

---

## 3. Cấu trúc Domain

### 3.1. Domain Name

```
Domain Name = DNS Name

Ví dụ:
├── company.local          ← Root domain (internal)
├── corp.company.com       ← Root domain (using real DNS)
├── dev.company.local      ← Child domain
└── test.company.local     ← Child domain

NetBIOS Name: COMPANY (tên ngắn, legacy)
DNS Name: company.local (tên đầy đủ)
```

> ⚠️ **Lưu ý chọn tên domain:**
> - **Nên:** dùng subdomain của domain thật (ví dụ: `ad.company.com`)
> - **Tránh:** dùng `.local` (có thể conflict với mDNS/Bonjour)
> - **Tránh:** dùng tên domain public trực tiếp (ví dụ: `company.com`)

### 3.2. Domain Hierarchy

```
Forest: company.local
│
├── Root Domain: company.local
│   ├── Child Domain: hanoi.company.local
│   └── Child Domain: hcm.company.local
│
└── Tree Trust: partner.com (domain khác cùng forest)
```

#### Các khái niệm quan trọng

| Khái niệm | Mô tả |
|---|---|
| **Forest** | Tập hợp các domains chia sẻ cùng schema và Global Catalog |
| **Tree** | Tập hợp các domains có chung namespace (company.local → hanoi.company.local) |
| **Root Domain** | Domain đầu tiên trong forest — chứa Enterprise Admins, Schema Admins |
| **Child Domain** | Domain con, kế thừa namespace từ parent |
| **Parent-Child Trust** | Tự động, two-way, transitive giữa parent và child domain |

---

## 4. Trust Relationships

### 4.1. Trust là gì?
**Trust** là mối quan hệ cho phép users trong **Domain A** truy cập tài nguyên trong **Domain B**.

### 4.2. Các loại Trust

| Loại Trust | Mô tả | Tự động? | Transitive? |
|---|---|---|---|
| **Parent-Child** | Giữa parent và child domain | ✅ Tự động | ✅ Có |
| **Tree-Root** | Giữa root domain và tree root mới | ✅ Tự động | ✅ Có |
| **Shortcut** | Tắt đường giữa 2 child domains | ❌ Thủ công | ✅ Có |
| **External** | Đến domain ngoài forest | ❌ Thủ công | ❌ Không |
| **Forest** | Giữa 2 forests | ❌ Thủ công | ✅ Có |
| **Realm** | Đến Kerberos realm (Linux/Unix) | ❌ Thủ công | Có/Không |

### 4.3. Trust Direction

```
One-Way Trust:
Domain A ──trusts──► Domain B
(Trusting)           (Trusted)
Users B có thể truy cập tài nguyên Domain A
Users A KHÔNG thể truy cập tài nguyên Domain B

Two-Way Trust:
Domain A ◄──trusts──► Domain B
Users cả 2 bên đều có thể truy cập tài nguyên bên kia
```

### 4.4. Transitive vs Non-Transitive

```
Transitive:
A trusts B, B trusts C → A trusts C (tự động)

Non-Transitive:
A trusts B, B trusts C → A KHÔNG trusts C (phải tạo riêng)
```

```powershell
# Xem trust relationships
Get-ADTrust -Filter *

# Tạo trust (ví dụ External Trust)
# Thường dùng GUI: Active Directory Domains and Trusts (domain.msc)

# Verify trust
Test-ComputerSecureChannel -Server "DC01.company.local"

# Kiểm tra trust bằng netdom
netdom trust company.local /domain:partner.com /verify
```

---

## 5. Join Domain (Gia nhập Domain)

### 5.1. Yêu cầu

| Yêu cầu | Chi tiết |
|---|---|
| **DNS** | Client phải trỏ DNS đến DC (DC chạy DNS) |
| **Network** | Client phải kết nối được đến DC |
| **Account** | Cần account có quyền join domain (Domain Admins hoặc được delegate) |
| **Computer Name** | Nên đặt tên theo quy ước (ví dụ: HN-PC-001) |

### 5.2. Cách Join Domain

#### GUI
```
System Properties → Computer Name → Change
→ Chọn "Domain" → Nhập tên domain (company.local)
→ Nhập credentials (domain admin)
→ Restart
```

#### PowerShell
```powershell
# Join domain
Add-Computer -DomainName "company.local" `
    -Credential (Get-Credential) `
    -OUPath "OU=Workstations,OU=Hanoi,DC=company,DC=local" `
    -Restart

# Unjoin domain (rời domain)
Remove-Computer -UnjoinDomainCredential (Get-Credential) `
    -WorkgroupName "WORKGROUP" `
    -Restart

# Kiểm tra máy đã join domain chưa
(Get-WmiObject Win32_ComputerSystem).PartOfDomain

# Xem domain hiện tại
(Get-WmiObject Win32_ComputerSystem).Domain
```

### 5.3. Quá trình Join Domain

```
1. Client tìm DC qua DNS (SRV record: _ldap._tcp.company.local)
        │
        ▼
2. Client kết nối đến DC qua LDAP (port 389)
        │
        ▼
3. Client gửi credentials (Domain Admin)
        │
        ▼
4. DC xác thực và tạo Computer Account trong AD
        │
        ▼
5. DC trả về SID cho Computer Account
        │
        ▼
6. Client tạo Secure Channel với DC
        │
        ▼
7. Client restart → đăng nhập bằng domain account
```

---

## 6. Functional Levels

### 6.1. Domain Functional Level

| Level | Tính năng mới |
|---|---|
| **Windows Server 2008** | Fine-Grained Password Policy, AES Kerberos |
| **Windows Server 2008 R2** | AD Recycle Bin, Managed Service Accounts |
| **Windows Server 2012** | Claims-based authentication |
| **Windows Server 2012 R2** | Protected Users group, Authentication Policies |
| **Windows Server 2016** | Privileged Access Management, AES for Kerberos improvements |

### 6.2. Forest Functional Level

| Level | Tính năng mới |
|---|---|
| **Windows Server 2008 R2** | AD Recycle Bin |
| **Windows Server 2012 R2** | Tất cả tính năng mới nhất |
| **Windows Server 2016** | Privileged Access Management (PAM) |

```powershell
# Xem functional level hiện tại
(Get-ADDomain).DomainMode
(Get-ADForest).ForestMode

# Nâng functional level (KHÔNG thể hạ xuống!)
Set-ADDomainMode -Identity "company.local" -DomainMode Windows2016Domain
Set-ADForestMode -Identity "company.local" -ForestMode Windows2016Forest
```

> ⚠️ **Lưu ý:** Nâng functional level là **ONE-WAY** — không thể quay lại. Phải đảm bảo **tất cả DC** đều chạy Windows Server version tương ứng trước khi nâng.

---

## 7. Quản lý Domain — Các công cụ

| Công cụ | Chức năng | Cách mở |
|---|---|---|
| **Active Directory Users and Computers** | Quản lý users, computers, groups, OUs | `dsa.msc` |
| **Active Directory Domains and Trusts** | Quản lý trusts, functional levels | `domain.msc` |
| **Active Directory Sites and Services** | Quản lý sites, replication | `dssite.msc` |
| **Active Directory Administrative Center** | GUI hiện đại, PowerShell history | `dsac.exe` |
| **ADSI Edit** | Chỉnh sửa AD ở mức thấp (advanced) | `adsiedit.msc` |
| **Group Policy Management** | Quản lý GPO | `gpmc.msc` |
| **PowerShell AD Module** | Quản lý qua script | `Import-Module ActiveDirectory` |

---

## 8. Backup và Restore Domain

### 8.1. Backup

```powershell
# Cài Windows Server Backup
Install-WindowsFeature Windows-Server-Backup

# Backup System State (bao gồm AD database)
wbadmin start systemstatebackup -backupTarget:E:

# Hoặc PowerShell
$policy = New-WBPolicy
$systemState = New-WBSystemState
Add-WBSystemState -Policy $policy
$target = New-WBBackupTarget -VolumePath "E:"
Add-WBBackupTarget -Policy $policy -Target $target
Start-WBBackup -Policy $policy
```

### 8.2. Restore

```
Các chế độ restore:
├── Non-Authoritative Restore (mặc định)
│   → Restore AD, sau đó nhận replication từ DC khác
│   → Dùng khi DC bị hỏng, cần phục hồi
│
└── Authoritative Restore
    → Restore AD VÀ đánh dấu data này là "mới nhất"
    → Replicate ĐẾN các DC khác
    → Dùng khi cần khôi phục objects bị xóa nhầm
```

```cmd
:: Non-Authoritative Restore:
:: 1. Boot vào DSRM (Directory Services Restore Mode) — F8
:: 2. Đăng nhập bằng DSRM password
:: 3. Restore:
wbadmin start systemstaterecovery -version:MM/DD/YYYY-HH:MM
:: 4. Restart → AD tự nhận replication updates

:: Authoritative Restore:
:: 1. Thực hiện Non-Authoritative Restore trước
:: 2. Trước khi restart, mở ntdsutil:
ntdsutil
activate instance ntds
authoritative restore
restore object "CN=Nguyen Van A,OU=IT,DC=company,DC=local"
:: 3. Restart
```

---

## 9. Troubleshooting Domain

```powershell
# Kiểm tra DNS (quan trọng nhất!)
nslookup company.local
nslookup _ldap._tcp.company.local -type=srv

# Kiểm tra kết nối đến DC
Test-ComputerSecureChannel -Repair

# Kiểm tra health của DC
dcdiag /v

# Kiểm tra replication
repadmin /replsummary

# Kiểm tra Kerberos tickets
klist

# Reset computer account password (khi secure channel bị hỏng)
Reset-ComputerMachinePassword -Server "DC01" -Credential (Get-Credential)

# Hoặc unjoin rồi rejoin domain
# (cách cuối cùng khi các cách khác không work)
```

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| "Trust relationship failed" | Secure channel bị hỏng | `Reset-ComputerMachinePassword` hoặc rejoin |
| Không join được domain | DNS sai | Đổi DNS client trỏ về DC |
| Đăng nhập chậm | DC xa hoặc quá tải | Thêm DC, cấu hình Sites |
| Replication failed | Network hoặc DNS issues | `repadmin /replsummary`, kiểm tra DNS |
| Account locked out | Wrong password quá nhiều lần | `Unlock-ADAccount`, kiểm tra lockout policy |

---

## 10. Best Practices

1. **Ít nhất 2 DC** — Cho redundancy
2. **DNS trên DC** — AD DS yêu cầu DNS, nên chạy cùng DC
3. **Đặt tên domain cẩn thận** — Tránh `.local`, dùng subdomain real
4. **OU structure rõ ràng** — Theo phòng ban hoặc location
5. **Delegate admin** — Không cho mọi người quyền Domain Admin
6. **Backup System State** — Định kỳ, ít nhất hàng tuần
7. **Monitor replication** — Dùng `repadmin`, `dcdiag`
8. **Functional level** — Nâng lên khi tất cả DC đã upgrade
9. **LAPS** — Quản lý local admin password
10. **AD Recycle Bin** — Bật ngay sau khi tạo domain

---

## 11. Câu hỏi ôn tập

1. **Domain** khác **Workgroup** ở những điểm nào?
2. Yêu cầu để **join domain** là gì?
3. **Trust** là gì? Kể tên các loại trust.
4. **Transitive Trust** khác **Non-Transitive Trust** thế nào?
5. **Functional Level** là gì? Tại sao cần nâng?
6. Sự khác biệt giữa **Authoritative** và **Non-Authoritative Restore**?
7. Khi gặp lỗi "Trust relationship failed", cách xử lý là gì?
8. **Forest** và **Domain** khác nhau thế nào?
9. Tại sao cần ít nhất **2 Domain Controller**?
10. Khi client không join domain được, đâu là thứ cần kiểm tra **đầu tiên**?

---

> 🔗 **Liên kết:** [[Active Directory]] · [[Group Policy (GPO)]] · [[DNS]] · [[DHCP]] · [[File Server]]
