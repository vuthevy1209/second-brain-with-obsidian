---
title: Daily-Note
summary: A short description will make the document more useful.
tags:
  - daily
created: <% tp.date.now("YYYY-MM-DD") %>
---
```
Private Sub Worksheet_Change(ByVal Target As Range)
    Dim cell As Range
    On Error Resume Next
    Set cell = Me.Range("InvoiceNo")
    On Error GoTo 0

    If cell Is Nothing Then Exit Sub
    If Intersect(Target, cell) Is Nothing Then Exit Sub

    Dim pasted As Boolean
    Dim t As Long

    ' Sign 1: copy mode still active
    If Application.CutCopyMode <> False Then pasted = True

    ' Sign 2: data validation was wiped (typing never wipes it)
    t = -1
    On Error Resume Next
    t = cell.Cells(1, 1).Validation.Type
    On Error GoTo 0
    If t = -1 Then pasted = True

    If Not pasted Then Exit Sub

    On Error GoTo Fin
    Application.EnableEvents = False
    Application.Undo
    Application.CutCopyMode = False

    ' Fallback: if undo did not restore validation, clear the cell
    t = -1
    On Error Resume Next
    t = cell.Cells(1, 1).Validation.Type
    On Error GoTo Fin
    If t = -1 Then cell.ClearContents

    MsgBox "Invoice No must be typed manually. Paste is not allowed!", vbCritical, "Invalid input"

Fin:
    Application.EnableEvents = True
End Sub

```

---

## 📖 Giải thích Code

### Mục đích tổng quan

Đây là một **VBA Event Handler** trong Excel, được đặt trong module của một Worksheet cụ thể. Nhiệm vụ của nó là **ngăn người dùng dán (paste) dữ liệu vào ô có tên `InvoiceNo`** — ô này chỉ cho phép nhập liệu thủ công bằng bàn phím.

---

### Phân tích từng phần

#### 1. Bắt sự kiện thay đổi

```vb
Private Sub Worksheet_Change(ByVal Target As Range)
```

- `Worksheet_Change` tự động chạy **mỗi khi có ô nào đó thay đổi giá trị** trong sheet.
- `Target` là vùng ô vừa bị thay đổi.

---

#### 2. Tìm ô `InvoiceNo`

```vb
Set cell = Me.Range("InvoiceNo")
```

- Lấy ô được đặt tên `InvoiceNo` trong sheet hiện tại.
- Nếu tên không tồn tại → `On Error Resume Next` tránh crash; `cell` sẽ là `Nothing`.

---

#### 3. Lọc đúng ô cần giám sát

```vb
If cell Is Nothing Then Exit Sub
If Intersect(Target, cell) Is Nothing Then Exit Sub
```

- Nếu ô `InvoiceNo` không tồn tại → thoát.
- Nếu ô vừa thay đổi **không phải** `InvoiceNo` → thoát, không can thiệp.

---

#### 4. Phát hiện Paste — Dấu hiệu 1: Clipboard còn active

```vb
If Application.CutCopyMode <> False Then pasted = True
```

- Sau khi **Ctrl+C → Ctrl+V**, Excel giữ trạng thái `CutCopyMode <> False`.
- Flag còn bật → xác định là đang paste.

---

#### 5. Phát hiện Paste — Dấu hiệu 2: Data Validation bị mất

```vb
t = cell.Cells(1, 1).Validation.Type
If t = -1 Then pasted = True
```

- **Gõ tay** không ảnh hưởng đến Data Validation.
- **Paste** có thể ghi đè và xóa Data Validation → `Validation.Type` ném lỗi → `t = -1`.
- Đây là phương pháp phát hiện paste tinh tế, bổ sung cho dấu hiệu 1.

---

#### 6. Cho phép nếu không phải paste

```vb
If Not pasted Then Exit Sub
```

- Người dùng gõ tay bình thường → thoát, không làm gì.

---

#### 7. Xử lý Paste: Undo và dọn clipboard

```vb
Application.EnableEvents = False
Application.Undo
Application.CutCopyMode = False
```

- **Tắt Events** trước Undo để tránh vòng lặp vô tận (Undo cũng trigger `Worksheet_Change`).
- **Undo** hủy hành động paste.
- **Xóa trạng thái clipboard**.

---

#### 8. Fallback: Xóa ô nếu Undo không đủ

```vb
If t = -1 Then cell.ClearContents
```

- Trong một số trường hợp hiếm, Undo không khôi phục hoàn toàn.
- Code sẽ **xóa nội dung ô** để chắc chắn không còn dữ liệu paste.

---

#### 9. Cảnh báo người dùng

```vb
MsgBox "Invoice No must be typed manually. Paste is not allowed!", vbCritical, "Invalid input"
```

- Hiển thị hộp thoại ❌ thông báo lỗi.

---

#### 10. Đảm bảo Events luôn bật lại

```vb
Fin:
    Application.EnableEvents = True
```

- Nhãn `Fin:` đảm bảo dù có lỗi ở bất kỳ đâu, `EnableEvents` luôn được bật lại.
- Thiếu bước này → **toàn bộ event Excel bị tắt**, sheet không còn phản hồi.

---

### Tóm tắt luồng hoạt động

```
Ô thay đổi
    └─► Có phải ô InvoiceNo?
            ├─ Không → thoát
            └─ Có → Phát hiện paste?
                        ├─ Không → thoát (cho phép gõ tay)
                        └─ Có → Undo + Dọn clipboard + Cảnh báo
```

---

### Lưu ý quan trọng

> **⚠️ Vị trí đặt code**: Code phải đặt trong **module của Worksheet** (double-click vào tên sheet trong VBE), không phải trong Module thông thường.

> **💡 Named Range**: Ô `InvoiceNo` phải được **đặt tên (Named Range)** trước trong Excel (Formulas → Name Manager) thì code mới hoạt động đúng.