# 📂 File Server — Chia sẻ dữ liệu và phân quyền

## 1. File Server là gì?
**Định nghĩa:** File Server là một máy chủ trung tâm trong mạng chuyên làm nhiệm vụ lưu trữ, quản lý và chia sẻ các tập tin (file) và thư mục (folder) cho các máy khách (client) khác trong cùng một hệ thống mạng (LAN/WAN).

**Analogy (Ví dụ ẩn dụ):** Hãy tưởng tượng công ty bạn có một thư viện (File Server). Thay vì mỗi nhân viên giữ sách ở ngăn bàn riêng (P2P - máy tính cá nhân), tất cả sách (dữ liệu) được đưa vào thư viện chung. Thủ thư (Hệ điều hành Windows Server) sẽ quản lý ai được vào phòng nào, ai được mượn sách gì, ai chỉ được đọc tại chỗ, ai được phép viết thêm vào sách.

## 2. Tại sao cần File Server? (So sánh với chia sẻ P2P)

| Tiêu chí | P2P (Peer-to-Peer - Chia sẻ cá nhân) | File Server (Centralized - Tập trung) |
| :--- | :--- | :--- |
| **Quản lý dữ liệu** | Phân tán ở nhiều máy, khó kiểm soát | Tập trung tại một nơi, dễ dàng quản lý |
| **Bảo mật & Phân quyền** | Rất yếu, khó thiết lập chi tiết | Rất mạnh mẽ (AD, NTFS, Share permissions) |
| **Backup dữ liệu** | Phải backup từng máy, rất mất thời gian | Backup tại một chỗ (Server), nhanh và an toàn |
| **Truy cập & Tính sẵn sàng** | Máy tắt là không lấy được dữ liệu | Server luôn bật 24/7, có sẵn mọi lúc |
| **Hiệu suất** | Ảnh hưởng đến hiệu suất máy cá nhân đang share | Chuyên dụng nên hiệu suất cao |
| **Chi phí** | Thấp ban đầu (không cần mua Server) | Cao ban đầu (cần Server + License OS) |
| **Phù hợp cho** | Gia đình, văn phòng rất nhỏ (< 5 người) | Doanh nghiệp, tổ chức có cấu trúc rõ ràng |

## 3. Share Permissions vs NTFS Permissions

Đây là 2 lớp bảo vệ quan trọng khi chia sẻ file qua mạng. 

**Bảng so sánh chi tiết:**

| Tính năng | Share Permissions | NTFS Permissions |
| :--- | :--- | :--- |
| **Phạm vi tác dụng** | Chỉ áp dụng khi truy cập qua mạng (Network) | Áp dụng cả mạng (Network) lẫn truy cập trực tiếp (Local) |
| **Mức độ áp dụng** | Chỉ áp dụng ở mức độ thư mục (Folder level) | Áp dụng từ ổ đĩa, thư mục đến từng tập tin (File/Folder level) |
| **Mức độ phân quyền** | Cơ bản (Read, Change, Full Control) | Rất chi tiết (Read, Write, Modify, Full Control, List, etc.) |
| **Định dạng ổ đĩa** | Hoạt động trên mọi định dạng (FAT32, NTFS, exFAT) | Bắt buộc phải là định dạng **NTFS** hoặc ReFS |

### Các mức độ quyền:
**Share Permissions:**
- `Read`: Xem file, thực thi chương trình.
- `Change`: = Read + Thêm, sửa, xóa file.
- `Full Control`: = Change + Thay đổi quyền (Permissions) và Take Ownership.

**NTFS Permissions (Cơ bản):**
- `Read`: Đọc nội dung file/folder.
- `Read & Execute`: Đọc và chạy file thực thi (.exe, .bat).
- `List Folder Contents`: Nhìn thấy các file/folder con bên trong.
- `Write`: Tạo file/folder mới, sửa đổi nội dung.
- `Modify`: = Read + Write + Xóa (Delete).
- `Full Control`: Mọi quyền + thay đổi Permissions + Take Ownership.

> [!IMPORTANT] Quy tắc kết hợp quyền
> Khi user truy cập thư mục share qua mạng, họ phải đi qua "2 cửa": Cửa Share và Cửa NTFS.
> **Quyền hiệu dụng (Effective Permission) = Quyền HẠN CHẾ HƠN giữa Share và NTFS.**

**Ví dụ minh họa:**
User `Alice` truy cập thư mục `KETOAN` qua mạng:
- Nếu Share = `Full Control`, NTFS = `Read` => Alice qua mạng chỉ có quyền `Read`.
- Nếu Share = `Read`, NTFS = `Full Control` => Alice qua mạng chỉ có quyền `Read`. (Dù nếu Alice log in trực tiếp trên máy chủ thì có Full Control).

## 4. Tạo và Quản lý Shared Folder

### GUI Steps (Giao diện đồ họa):
1. Click chuột phải vào Folder -> `Properties`.
2. Chuyển sang tab `Sharing` -> `Advanced Sharing...`.
3. Tích chọn `Share this folder`.
4. Điền tên share (Share name). Thêm `$` ở cuối nếu muốn share ẩn.
5. Click `Permissions` để cấu hình Share Permissions (Thường để *Everyone = Full Control*, rồi dùng NTFS giới hạn lại).

### PowerShell Commands:
```powershell
# Tạo thư mục
New-Item -Path "C:\Data\IT_Dept" -ItemType Directory

# Tạo Share
New-SmbShare -Name "IT_Dept" -Path "C:\Data\IT_Dept" -Description "Thu muc phong IT" -FullAccess "Everyone"

# Liệt kê các share hiện có
Get-SmbShare

# Xóa share (Không xóa folder gốc)
Remove-SmbShare -Name "IT_Dept"
```

### Administrative Shares (Default Shares)
Windows Server tự động tạo ra các share ẩn để phục vụ quản trị, luôn có đuôi `$`:
- `C$`, `D$`: Share ổ đĩa gốc, chỉ Administrator mới vào được (VD: `\\ServerIP\C$`).
- `ADMIN$`: Trỏ đến thư mục `C:\Windows`.
- `IPC$`: Inter-Process Communication, dùng để kết nối RPC, xác thực.

## 5. NTFS Permissions Chi Tiết

### Basic vs Advanced/Special Permissions
- **Basic**: Các quyền gộp (Read, Write, Modify...).
- **Special/Advanced**: Là cấu thành của Basic (VD: Create Files, Create Folders, Read Attributes, Traverse Folder, Delete, Change Permissions).

### Inheritance (Tính kế thừa)
Mặc định, thư mục con/file con sẽ kế thừa quyền từ thư mục cha.
- Khi cấp quyền, có thể chọn `Apply to: This folder, subfolders and files`.
- Để ngắt kế thừa: Vào tab `Security` -> `Advanced` -> `Disable inheritance` (Chọn Convert để giữ nguyên quyền hiện tại, hoặc Remove để xóa sạch và làm lại).

### Allow vs Deny
- Quyền Explicit (Cấp trực tiếp) ưu tiên hơn quyền Inherited (Kế thừa).
- **DENY LUÔN THẮNG ALLOW.** Nếu user A thuộc Group X (Allow Read) và Group Y (Deny Read) => Kết quả là Bị chặn (Deny).

### Effective Permissions (Quyền hiệu dụng)
Công cụ trong tab `Advanced` -> `Effective Access` giúp kiểm tra chính xác một user/group có những quyền gì trên file/folder đó sau khi cộng dồn mọi thứ (Allow, Deny, Inheritance, Group membership).

### Quản lý bằng CLI/PowerShell:
```powershell
# Dùng icacls (Command Prompt cũ nhưng cực mạnh)
icacls "C:\Data\IT_Dept" /grant "Domain\ITGroup:(OI)(CI)M"
# (OI): Object Inherit, (CI): Container Inherit, M: Modify

# Dùng PowerShell (Get-Acl, Set-Acl)
$acl = Get-Acl "C:\Data\IT_Dept"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("Domain\Alice", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.AddAccessRule($rule)
Set-Acl -Path "C:\Data\IT_Dept" -AclObject $acl
```

## 6. Chiến lược AGDLP

Đây là tiêu chuẩn vàng của Microsoft (Best Practice) trong phân quyền Resource.
**A -> G -> DL -> P**

- **A (Account)**: User Accounts.
- **G (Global Group)**: Nhóm những User có cùng vai trò (VD: `G_KeToan`). Nằm ở domain gốc.
- **DL (Domain Local Group)**: Nhóm quản lý quyền truy cập Resource (VD: `DL_Share_KeToan_Modify`).
- **P (Permission)**: Gán quyền cho nhóm DL trên thư mục đó (NTFS/Share).

**Quy trình:** Add **A** vào **G** => Add **G** vào **DL** => Cấp **P** cho **DL**.

```ascii
[User1] \                   / [DL_FolderA_Read] ---> (Read Permission Folder A)
[User2] -- [G_Marketing] -+
[User3] /                   \ [DL_FolderB_Modify] ---> (Modify Permission Folder B)
```
*Lý do:* Dễ dàng quản lý liên rừng (Multi-forest), khi có nhân viên mới, chỉ cần add vào G. Nếu cần đổi quyền, chỉ cần đổi ở DL. 

## 7. File Server Resource Manager (FSRM)

FSRM là Role/Feature trên Windows Server giúp quản lý dữ liệu nâng cao.
*Cài đặt: `Install-WindowsFeature -Name FS-Resource-Manager -IncludeManagementTools`*

### Quota Management (Giới hạn dung lượng)
- **Hard Quota**: Chặn không cho user copy thêm file khi đầy.
- **Soft Quota**: Chỉ cảnh báo (Email/Event Log) nhưng vẫn cho copy tiếp.
- Có thể áp dụng bằng Templates.

### File Screening (Chặn loại file)
- Ngăn user lưu các file không liên quan công việc (mp3, mp4, exe).
- **Active screening**: Chặn hoàn toàn.
- **Passive screening**: Cho phép lưu nhưng gửi cảnh báo.

```powershell
# Ví dụ tạo File Screen chặn file media
New-FsrmFileGroup -Name "Media Files" -IncludePattern @("*.mp3", "*.mp4", "*.avi")
New-FsrmFileScreen -Path "C:\Data" -IncludeGroup "Media Files" -Active:$true
```

## 8. DFS (Distributed File System)

Giải quyết bài toán: Mạng quá lớn, quá nhiều server share file khiến user không nhớ nổi đường dẫn (`\\Server1\ShareA`, `\\Server2\ShareB`...).

### DFS Namespace (Không gian tên DFS)
- Gom tất cả các Share từ nhiều Server khác nhau vào MỘT đường dẫn thống nhất (Ảo).
- VD: `\\Tendoanhnghiep.local\Public\ShareA` (Thực chất trỏ tới Server 1) và `\\Tendoanhnghiep.local\Public\ShareB` (Trỏ tới Server 2).

### DFS Replication (Đồng bộ dữ liệu)
- Đồng bộ file giữa các Server ở nhiều Site (Chi nhánh) khác nhau.
- Tối ưu hóa WAN bằng công nghệ RDC (Remote Differential Compression) - chỉ copy phần byte thay đổi của file.

## 9. Shadow Copies (Previous Versions)

Tính năng tạo bản snapshot/backup của các file/folder theo lịch trình. Cho phép user tự khôi phục lại phiên bản cũ của file lỡ bị ghi đè hoặc xóa mà không cần gọi IT.

**Cách bật:**
1. Click phải vào Ổ đĩa (VD: C:) -> `Properties`.
2. Tab `Shadow Copies`.
3. Chọn ổ đĩa -> `Enable`.
4. Vào `Settings` để cấu hình lịch trình (Schedule) và giới hạn dung lượng lưu trữ Snapshot.

**User Restore:** Click phải vào file/folder qua mạng -> `Properties` -> `Previous Versions` -> Chọn bản cũ và bấm `Restore` hoặc `Copy`.

## 10. Access-Based Enumeration (ABE)

ABE (Liệt kê dựa trên quyền truy cập).
- **Nếu tắt:** User vào Share sẽ thấy TẤT CẢ các thư mục, kể cả những thư mục họ không có quyền vào (Khi click vào báo Access Denied).
- **Nếu bật:** User chỉ thấy những thư mục/file mà họ có ít nhất quyền `Read`. Thư mục không có quyền sẽ bị "Tàng hình". Cải thiện trải nghiệm người dùng và bảo mật.

**Cách bật:** Server Manager -> File and Storage Services -> Shares -> Properties của Share đó -> Tab Settings -> Tích `Enable access-based enumeration`.

## 11. SMB Protocol

Giao thức cốt lõi đằng sau tính năng File Sharing (Server Message Block).
- **SMBv1:** CŨ, LỖ HỔNG BẢO MẬT NGHIÊM TRỌNG (WannaCry ransomware dùng lỗ hổng này qua EternalBlue). **PHẢI DISABLE!**
  ```powershell
  Set-SmbServerConfiguration -EnableSMB1Protocol $false
  ```
- **SMBv2:** Cải thiện hiệu suất, giảm chatty (chatter) trên mạng.
- **SMBv3:** Hỗ trợ Encryption (Mã hóa dữ liệu đang truyền), SMB Multichannel (Tăng băng thông), SMB Direct (RDMA).

## 12. Auditing File Access (Ghi log truy cập)

Theo dõi "Ai đã làm gì, vào lúc nào, kết quả ra sao".
Để làm được cần 2 bước:
1. **Bật Audit Policy (GPO):** `Computer Configuration -> Policies -> Windows Settings -> Security Settings -> Advanced Audit Policy Configuration -> Object Access -> Audit File System` (Chọn Success/Failure).
2. **Cấu hình SACL (System Access Control List) trên Folder:**
   - Click phải Folder -> `Properties` -> `Security` -> `Advanced` -> Tab `Auditing`.
   - Add user/group cần theo dõi (VD: Everyone), chọn quyền (VD: Delete) và Type (Success/Fail).
Kết quả sẽ ghi vào **Event Viewer** -> Windows Logs -> Security (Event ID 4663, 4659...).

## 13. Best Practices (Thực hành tốt nhất)

1. **Rule of Thumb:** Để Share Permission là `Everyone = Full Control` (hoặc `Authenticated Users = Full Control`) và thực hiện phân quyền chi tiết (chặt chẽ) bằng **NTFS Permissions**.
2. **Luôn dùng Group:** Không phân quyền NTFS trực tiếp cho từng cá nhân, hãy dùng Group (AGDLP).
3. **Disable SMBv1** lập tức để tránh Ransomware.
4. Bật **ABE** để user không bối rối trước hàng ngàn thư mục họ không có quyền.
5. Cấu hình **FSRM Quota** để ngăn ổ đĩa máy chủ đầy bất ngờ dẫn đến Crash hệ thống.
6. Thiết lập **Shadow Copies** 2-3 lần/ngày để giảm tải yêu cầu restore từ helpdesk.

## 14. Câu hỏi ôn tập

1. Phân biệt sự khác nhau cơ bản giữa Share Permissions và NTFS Permissions?
2. Khi Share Permission cấp `Full Control` và NTFS cấp `Read`, user truy cập qua mạng có quyền gì? Tại sao?
3. Nếu user thuộc nhóm A (Allow Read) và nhóm B (Deny Read), quyền hiệu dụng cuối cùng là gì?
4. Chiến lược AGDLP là viết tắt của những từ gì? Nêu luồng gán quyền.
5. File Screen Active khác với File Screen Passive trong FSRM như thế nào?
6. Tính năng ABE (Access-Based Enumeration) mang lại lợi ích gì?
7. Tại sao tuyệt đối không được sử dụng giao thức SMBv1?
8. Kể tên 2 bước để cấu hình tính năng Auditing theo dõi user xóa file trên Server?

---
*Related Topics:* [[Active Directory]] · [[Domain]] · [[Group Policy (GPO)]] · [[DNS]] · [[DHCP]] · [[ACL]]
