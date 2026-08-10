# 🛡️ ACL — Access Control List (Cho phép / Chặn theo Rule)

## 1. ACL là gì?
- **Definition:** Access Control List (Danh sách kiểm soát truy cập) là danh sách các quy tắc (rules) gắn liền với một đối tượng (object) như file, thư mục, hoặc thiết bị mạng (router, switch) nhằm xác định những user/group/system nào được phép hoặc bị từ chối truy cập/thực hiện các hành động cụ thể trên đối tượng đó.
- **Simple analogy:** Giống như một người bảo vệ đứng ở cửa (đối tượng) với một danh sách khách mời. Nếu tên bạn có trong danh sách và được phép vào (Allow), bảo vệ sẽ mở cửa. Nếu bạn nằm trong danh sách cấm (Deny), hoặc không có tên trong danh sách (Implicit Deny), bảo vệ sẽ không cho bạn vào.

## 2. Tại sao lại cần ACL?
| Lý do | Mô tả chi tiết |
|---|---|
| **Bảo mật (Security)** | Ngăn chặn truy cập trái phép vào các tài nguyên nhạy cảm (files, folders, network segments). |
| **Kiểm soát truy cập hạt nhân (Granular Control)** | Cho phép chỉ định chính xác quyền hạn (Read, Write, Execute...) cho từng User hoặc Group cụ thể. |
| **Phân quyền (Delegation)** | Cung cấp khả năng phân công quản trị và giới hạn ảnh hưởng của các tài khoản bị xâm phạm. |
| **Kiểm toán (Auditing/Compliance)** | Giám sát các nỗ lực truy cập thành công hoặc thất bại thông qua SACL, đáp ứng yêu cầu tuân thủ. |
| **Lọc Traffic (Traffic Filtering)** | (Đối với Network ACL) Kiểm soát luồng dữ liệu vào/ra hệ thống mạng để giảm thiểu rủi ro từ bên ngoài. |

## 3. Phân loại ACL với Sơ đồ (ASCII Art)
ACL có thể được triển khai ở nhiều cấp độ khác nhau. Dưới đây là 3 phân loại chính:

```text
                        [ Access Control List (ACL) ]
                                     |
           +-------------------------+-------------------------+
           |                         |                         |
   [ Network ACL ]           [ File System ACL ]        [ Windows ACL ]
 (Routers, Switches,             (Linux ext4,          (NTFS, Active Directory)
  Firewalls, AWS)                  UNIX)                       |
           |                         |                 +-------+-------+
    - Standard ACL             - rwx r-x r--           |               |
    - Extended ACL                                 [ DACL ]        [ SACL ]
    - Named ACL                               (Discretionary)   (System)
                                                - Permission      - Auditing
```

1. **Network ACL:** Quản lý luồng giao thông mạng dựa trên IP/Port/Protocol.
2. **File System ACL:** Quản lý quyền truy cập tập tin truyền thống trên các hệ điều hành như Linux (chmod/chown).
3. **Windows ACL:** Cơ chế nâng cao của Windows Server, được chia làm 2 phần:
   - **DACL (Discretionary Access Control List):** Chứa các quy tắc quyết định *ai* được làm *gì*.
   - **SACL (System Access Control List):** Dùng để ghi log (Auditing) - theo dõi xem ai đã truy cập hoặc cố gắng truy cập thành công hay thất bại.

## 4. Network ACL
Trong hạ tầng mạng (Cisco, Firewalls, Cloud như AWS VPC), ACL lọc packet dựa trên các tiêu chí cụ thể.

### Phân loại Network ACL
- **Standard ACL:** Lọc (Allow/Deny) *chỉ* dựa trên địa chỉ IP nguồn (Source IP). Rất cơ bản và thường đặt gần đích đến (Destination).
- **Extended ACL:** Lọc dựa trên Source IP, Destination IP, Protocol (TCP/UDP/ICMP), và Source/Destination Port. Thường đặt càng gần nguồn (Source) càng tốt.
- **Named ACL:** Cho phép đặt tên cho ACL thay vì dùng số, giúp quản lý dễ dàng hơn. Cả Standard và Extended đều có thể dùng Named.

### Quy tắc hoạt động của Network ACL
- **Top-Down Processing:** Các rule được xử lý từ trên xuống dưới. Khi packet match với một rule, hành động (Allow/Deny) được thực thi ngay lập tức và các rule bên dưới bị bỏ qua.
- **Implicit Deny:** Nếu packet không match với *bất kỳ* rule nào trong danh sách, nó sẽ bị tự động từ chối. (Luôn có một rule vô hình `Deny All` ở cuối mỗi ACL).

---

## 5. Windows NTFS ACL (QUAN TRỌNG CHO MCSA)
NTFS (New Technology File System) cung cấp hệ thống kiểm soát quyền tinh vi, bảo vệ dữ liệu cả khi người dùng truy cập trực tiếp trên máy hoặc qua mạng.

### NTFS Permissions cơ bản
Các quyền cơ bản được gom từ các quyền nâng cao để dễ quản lý.

| Quyền Cơ Bản (Basic) | Mô tả chi tiết hành động cho phép |
|---|---|
| **Full Control** | Quyền cao nhất. Có thể thực hiện mọi thao tác, thay đổi Permissions (Take Ownership) và xóa thư mục con/tập tin. |
| **Modify** | Đọc, viết, thực thi, sửa đổi, và xóa (Delete). Không thể thay đổi Permissions hoặc Take Ownership. |
| **Read & Execute** | Đọc nội dung file/thư mục và chạy các tập tin thực thi (exe, scripts). Không thể thay đổi nội dung. |
| **List Folder Contents** | (Chỉ áp dụng cho Thư mục) Xem tên các file và thư mục con bên trong. Tương tự như Read & Execute nhưng chỉ cho folders. |
| **Read** | Mở và xem dữ liệu file, thuộc tính file. |
| **Write** | Tạo mới file/thư mục, thêm dữ liệu vào file. Không có quyền sửa nội dung cũ hoặc xóa file. |

### NTFS Permissions nâng cao (Advanced Permissions)
Đằng sau 6 quyền cơ bản là 13 quyền nâng cao (Special Permissions).

| Quyền Nâng Cao | Mô tả |
|---|---|
| **Traverse Folder / Execute File** | Đi xuyên qua thư mục (dù không có quyền đọc) / Chạy file exe. |
| **List Folder / Read Data** | Liệt kê danh sách thư mục / Đọc dữ liệu tập tin. |
| **Read Attributes** | Đọc thuộc tính cơ bản (Read-only, Hidden). |
| **Read Extended Attributes** | Đọc thuộc tính mở rộng. |
| **Create Files / Write Data** | Tạo file trong thư mục / Ghi dữ liệu vào file (ghi đè/thêm). |
| **Create Folders / Append Data** | Tạo thư mục con / Thêm dữ liệu vào cuối file. |
| **Write Attributes** | Sửa đổi thuộc tính cơ bản. |
| **Write Extended Attributes** | Sửa đổi thuộc tính mở rộng. |
| **Delete Subfolders and Files** | Xóa file/folder con (chỉ có ở cấp thư mục). |
| **Delete** | Xóa đối tượng. |
| **Read Permissions** | Đọc danh sách ACL (DACL) của đối tượng. |
| **Change Permissions** | Sửa đổi danh sách ACL (DACL). |
| **Take Ownership** | Giành quyền sở hữu (Owner) đối với file/folder. |

### Inheritance (Kế Thừa)
- **Cách hoạt động:** Mặc định, file/thư mục con sẽ *kế thừa* tất cả các permissions từ thư mục cha. Giúp giảm thiểu công sức cấu hình và đảm bảo tính nhất quán.
- **Disable Inheritance:** Trong Windows, bạn có thể ngắt tính kế thừa bằng cách bỏ tick "Include inheritable permissions from this object's parent". Khi đó, Windows sẽ hỏi bạn:
  1. **Convert (Copy):** Chép các quyền kế thừa hiện tại thành quyền chỉ định trực tiếp (Explicit) trên đối tượng này.
  2. **Remove:** Xóa toàn bộ các quyền kế thừa, để lại danh sách ACL trống (cần add lại từ đầu).

### Allow vs Deny & Effective Permissions
Windows Server áp dụng quy tắc xung đột quyền hạn cực kỳ nghiêm ngặt:
1. **Deny luôn thắng Allow:** Nếu User A được cấp Allow (Read) qua Group 1, nhưng bị cấp Deny (Read) qua Group 2 (hoặc gán trực tiếp), User A sẽ **BỊ TỪ CHỐI** đọc.
2. **Explicit đánh bại Inherited:** Quyền gán trực tiếp trên đối tượng (Explicit) ưu tiên hơn quyền kế thừa từ cha. (Ví dụ: Explicit Allow sẽ thắng Inherited Deny).
3. **Effective Permissions (Quyền hiệu dụng):** Là quyền thực tế cuối cùng mà một User nhận được sau khi cộng dồn (Cumulative) tất cả Allow từ các Group thành viên, kết hợp với các quyền gán trực tiếp, và trừ đi tất cả các Deny áp dụng. Có tab *Effective Access* trong Advanced Security Settings để test điều này.

---

## 6. Share Permissions vs NTFS Permissions
Khi một thư mục được chia sẻ qua mạng (SMB/CIFS), người dùng phải vượt qua 2 lớp cửa: Share Permission và NTFS Permission.

| Đặc điểm | Share Permissions | NTFS Permissions |
|---|---|---|
| **Phạm vi áp dụng** | Chỉ có tác dụng khi truy cập qua mạng. Không có tác dụng khi login trực tiếp tại máy tính (Local). | Áp dụng mọi lúc, mọi nơi (Cả Local lẫn qua mạng). |
| **Các cấp độ quyền** | Rất đơn giản: Full Control, Change, Read. | Rất chi tiết (Full Control, Modify, R&E, v.v. và 13 Advanced). |
| **Format Storage** | Áp dụng trên FAT32, exFAT, NTFS, ReFS. | Bắt buộc phải là ổ đĩa format NTFS hoặc ReFS. |

### Kết hợp: Quy tắc lấy quyền hạn chế hơn (Most Restrictive)
Khi truy cập qua mạng, hệ thống kiểm tra cả Share và NTFS, và **quyền hiệu dụng cuối cùng là quyền khắt khe hơn** (giao thoa giữa 2 lớp).
- *Ví dụ 1:* Share Permission = Full Control; NTFS Permission = Read. => Quyền hiệu dụng qua mạng = **Read**.
- *Ví dụ 2:* Share Permission = Read; NTFS Permission = Modify. => Quyền hiệu dụng qua mạng = **Read**.

---

## 7. Quản lý bằng PowerShell
Dùng PowerShell để automation việc phân quyền trong MCSA.

### Get-Acl (Đọc quyền)
```powershell
# Xem ACL của thư mục
Get-Acl -Path "C:\Data\Confidential" | Format-List

# Xem chi tiết danh sách Rule (DACL)
(Get-Acl -Path "C:\Data\Confidential").Access
```

### Set-Acl (Ghi/Apply quyền) và FileSystemAccessRule
Để thêm quyền cho thư mục qua PowerShell, cần tạo một object rule, sau đó áp dụng vào ACL hiện tại.

```powershell
$path = "C:\Data\Confidential"
$user = "DOMAIN\HR_Group"

# Bước 1: Lấy ACL hiện tại
$acl = Get-Acl -Path $path

# Bước 2: Tạo rule mới (Identity, Quyền, Kế thừa, Propagation, Loại Allow/Deny)
$permission = "Modify"
$inheritanceFlag = [System.Security.AccessControl.InheritanceFlags]::ContainerInherit, [System.Security.AccessControl.InheritanceFlags]::ObjectInherit
$propagationFlag = [System.Security.AccessControl.PropagationFlags]::None
$type = [System.Security.AccessControl.AccessControlType]::Allow

$rule = New-Object System.Security.AccessControl.FileSystemAccessRule($user, $permission, $inheritanceFlag, $propagationFlag, $type)

# Bước 3: Thêm rule vào ACL
$acl.AddAccessRule($rule)

# Bước 4: Áp dụng lại ACL vào thư mục
Set-Acl -Path $path -AclObject $acl
```

---

## 8. ICACLS Commands
`icacls` là công cụ dòng lệnh cực mạnh của Windows dùng để backup, restore và sửa đổi ACL.

### Bảng Ký Hiệu ICACLS Thường Dùng
| Ký hiệu Quyền | Ý nghĩa | Ký hiệu Kế Thừa | Ý nghĩa |
|---|---|---|---|
| `F` | Full Control | `(OI)` | Object Inherit (Tập tin con kế thừa) |
| `M` | Modify | `(CI)` | Container Inherit (Thư mục con kế thừa) |
| `RX` | Read & Execute | `(IO)` | Inherit Only (Không áp dụng cho thư mục hiện tại) |
| `R` | Read-only | `(NP)` | Do not propagate (Chỉ kế thừa 1 cấp) |
| `W` | Write-only | | |

### Các Lệnh Mẫu
```cmd
# Hiển thị quyền của một thư mục
icacls "C:\Data"

# Cấp quyền Modify cho User 'John' và cho phép kế thừa tới file/folder con (OI)(CI)
icacls "C:\Data" /grant John:(OI)(CI)(M)

# Xóa (Remove) mọi quyền cấp trực tiếp của 'John' (không xóa quyền kế thừa)
icacls "C:\Data" /remove John

# Thay thế Deny bằng Allow (hoặc ép buộc một quyền Deny)
icacls "C:\Data" /deny Bob:(OI)(CI)(F)

# Reset lại bộ quyền về mặc định thừa kế từ cha
icacls "C:\Data" /reset /T /C /L

# Backup toàn bộ ACL của thư mục C:\Data ra file
icacls "C:\Data" /save AclBackup.txt /T /C

# Restore lại ACL từ file backup
icacls "C:\" /restore AclBackup.txt
```

---

## 9. ACL trong Group Policy (GPO)
Trong môi trường Domain (Active Directory), bạn có thể dùng Group Policy để đẩy ACL xuống hàng loạt máy trạm/máy chủ.
- **Đường dẫn:** `Computer Configuration -> Policies -> Windows Settings -> Security Settings -> File System`.
- Bạn có thể add File/Folder path vào đây, cấu hình Permission, và GPO sẽ tự động áp dụng (overwrite hoặc merge quyền) lên tất cả máy tính bị ảnh hưởng bởi Policy đó. Tính năng này rất tốt để khóa các file hệ thống, tạo thư mục dùng chung hoặc phân quyền thư mục nhạy cảm hàng loạt.

---

## 10. Best Practices (Thực Hành Tốt Nhất)

1. **Chiến lược AGDLP:** Quản lý quyền theo mô hình chuẩn của Microsoft:
   - **A**ccounts (Người dùng) được đưa vào...
   - **G**lobal Groups (Nhóm toàn cục - theo phòng ban), Global Groups được đưa vào...
   - **D**omain **L**ocal Groups (Nhóm cục bộ miền - theo quyền trên Resource), và Domain Local được cấp...
   - **P**ermissions (Quyền hạn NTFS).
   *Ví dụ: User John -> Global_Sales -> DL_SalesData_Modify -> Cấp quyền Modify trên thư mục.*
2. **Share Permission vs NTFS:** Đặt Share Permission là **Everyone - Full Control** (hoặc Authenticated Users - Full Control), và sử dụng **NTFS Permissions** để kiểm soát chi tiết ai được làm gì. Việc quản lý 2 lớp phức tạp dễ gây nhầm lẫn.
3. **Hạn chế dùng Deny:** Rất hiếm khi sử dụng `Deny`. Thiết kế phân quyền tốt bằng `Allow` là đủ. Dùng `Deny` dễ gây lỗi khóa tài khoản hoặc lỗi kế thừa phức tạp (vd: Admin tự Deny chính mình).
4. **Không gán quyền trực tiếp cho User:** LUÔN gán quyền cho Group, sau đó đưa User vào Group. Nó giúp quản lý khi nhân sự thay đổi cực kì dễ, tránh hiện tượng ACL bị phình to (ACL bloat) chứa đầy các user mồ côi (Orphaned SIDs).
5. **Take Ownership:** Nếu một Administrator bị mất quyền truy cập vào một thư mục do ai đó lỡ xóa quyền (hoặc cố ý), Admin luôn có thể dùng đặc quyền để *Take Ownership* thư mục đó (trở thành chủ sở hữu), sau đó tự cấp lại quyền Full Control cho mình.

---

## 11. Sơ đồ Quyết định ACL (ASCII)

```text
                  [ User Requests Access to File over Network ]
                                     |
                                     V
                        +-------------------------+
                        |  Check Share Permission |
                        +-------------------------+
                                     |
                [Deny] <-------------+-------------> [Allow]
                  |                                     |
                  V                                     V
          (Access Denied)                    +-------------------------+
                                             |  Check NTFS Permission  |
                                             +-------------------------+
                                                        |
                                   [Deny] <-------------+-------------> [Allow]
                                     |                                     |
                                     V                                     V
                             (Access Denied)                   (Access GRANTED!)
                                                                 (Quyền được áp dụng
                                                                 là Most Restrictive)
```

*(Lưu ý: Nếu truy cập Local, vòng lặp bỏ qua bước Share Permission và kiểm tra NTFS trực tiếp).*

---

## 12. Câu hỏi ôn tập

1. Sự khác biệt cơ bản giữa **DACL** và **SACL** trong cơ chế Windows ACL là gì?
2. Trong hạ tầng Network (Router/Switch), điều gì sẽ xảy ra nếu một gói tin đi đến cuối danh sách ACL mà không khớp (match) với bất kỳ rule nào?
3. Khi bạn disable (tắt) kế thừa (Inheritance) trên một thư mục NTFS trong Windows, bạn sẽ được hệ thống hỏi 2 tùy chọn nào? Giải thích sự khác biệt giữa chúng.
4. Một User thuộc nhóm Sales được Allow `Read` thông qua Share Permission, nhưng được Allow `Modify` thông qua NTFS Permission. Khi user này truy cập file qua thư mục chia sẻ mạng (SMB), quyền thực tế (Effective Permission) mà user có được là gì? Tại sao?
5. Vì sao Best Practice khuyên nên cấu hình Share Permission là `Everyone - Full Control` thay vì phân quyền chi tiết ở lớp này?
6. Khi xử lý xung đột quyền trên NTFS, nếu một User được cấp *Allow Modify* từ Group A và bị cấp *Deny Read* từ Group B, điều gì sẽ xảy ra khi user đó truy cập file?
7. Cấu trúc lệnh PowerShell nào (cmdlet) được sử dụng để đọc quyền ACL, và object nào cần được tạo mới trước khi áp dụng rule truy cập vào một thư mục bằng lệnh `Set-Acl`?
8. Ký hiệu `(OI)(CI)` trong công cụ lệnh `icacls` có ý nghĩa gì đối với việc cấp quyền và kế thừa?

---
*Liên kết Obsidian:* [[Firewall]] · [[IDS]] · [[IPS]] · [[DMZ]] · [[VPN]] · [[Segmentation]]
