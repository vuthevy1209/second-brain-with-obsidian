---
title: Default Route
summary: Giải thích default route (gateway mặc định), cách cấu hình trên router Cisco, và ví dụ ASCII minh họa quá trình chuyển gói tới default gateway.
tags:
  - networking
  - default-route
  - ccna
created: 2026-08-02
---


## Khái niệm

Default Gateway, hay còn gọi là **Default route**,<mark style="background:#d3f8b6"> là địa chỉ IP của một thiết bị mạng, thường là router hoặc moderm</mark>, dùng để <mark style="background:#d3f8b6">định tuyến dữ liệu ra bên ngoài mạng cục bộ</mark>. 

> [!summary]
> Có thể hình dung mạng LAN giống như một khu dân cư, trong khi Default Gateway chính là chiếc cổng ra vào. Muốn đi ra thế giới bên ngoài, mọi người trong khu phố đều phải đi qua cánh cổng này.

- Định danh bằng **destination 0.0.0.0/0** (IPv4) hoặc `::/0` (IPv6).
- Thường trỏ tới **router phía ngoài** (ISP, firewall) để chuyển traffic ra mạng ngoại vi.

![[Default Gateway-1785683224947.webp]]



## **2. Vai trò của Default Gateway trong hệ thống mạng**

Default Gateway đóng vai trò quan trọng trong việc duy trì sự thông suốt của quá trình truyền tải dữ liệu.

- **Kết nối mạng nội bộ với Internet:** <mark style="background:#d3f8b6">Default Gateway là cầu nối trung gian giữa thiết bị trong mạng LAN và các mạng bên ngoài. Không có nó, dữ liệu sẽ bị “mắc kẹt” trong mạng nội bộ và không thể truy cập Internet.</mark>
- **Định tuyến dữ liệu chính xác:** Khi người dùng nhập địa chỉ một trang web, dữ liệu sẽ được gửi đến Default Gateway, sau đó mới được định tuyến tới máy chủ đích.
- **Quản lý lưu lượng mạng:** <mark style="background:#affad1">Default Gateway có thể kết hợp với tường lửa và NAT (Network Address Translation) để phân bổ tài nguyên, bảo vệ an toàn thông tin và tối ưu băng thông.</mark>
- **Hỗ trợ nhiều thiết bị cùng lúc:** <mark style="background:rgba(5, 117, 197, 0.2)">Tất cả máy tính, điện thoại, laptop trong mạng đều dựa vào Default Gateway để ra Internet.</mark>


## **4. Những sự cố thường gặp liên quan đến Default Gateway**

Trong quá trình sử dụng, người dùng có thể gặp một số sự cố liên quan đến Default Gateway:

**Không nhận được Default Gateway:** Máy tính báo “No Internet Access”, biểu tượng mạng có dấu chấm than màu vàng hoặc hoàn toàn không kết nối được Internet. Khi kiểm tra bằng lệnh ipconfig, không thấy xuất hiện dòng Default Gateway.

- Nguyên nhân: Router chưa cấp phát địa chỉ hoặc lỗi DHCP.
- Cách xử lý: Khởi động lại modem, đặt lại địa chỉ IP tĩnh thủ công.

**Xung đột địa chỉ IP với Default Gateway:** Máy tính hiển thị cảnh báo “IP address conflict”, mạng thường xuyên bị ngắt kết nối dù tín hiệu Wi-Fi mạnh.

- Nguyên nhân: Máy tính được cấu hình cùng địa chỉ IP với router.
- Cách xử lý: Thay đổi địa chỉ IP của thiết bị, tránh trùng với Gateway.

**Ping không thấy Default Gateway:** Khi gõ lệnh ping [địa chỉ gateway], hệ thống trả về thông báo “Request timed out” hoặc “Destination host unreachable”.

- Nguyên nhân: Router hoặc modem bị treo, dây mạng lỗi.
- Cách xử lý: Khởi động lại thiết bị, kiểm tra dây cáp hoặc reset router.

**Truy cập Internet chậm hoặc chập chờn:** Tốc độ mạng giảm rõ rệt, hay bị rớt kết nối khi nhiều thiết bị cùng sử dụng, việc tải video hoặc chơi game online thường xuyên bị gián đoạn.

- Nguyên nhân: Default Gateway quá tải do nhiều thiết bị truy cập cùng lúc.
- Cách xử lý: Nâng cấp router, chia nhỏ mạng hoặc giới hạn số thiết bị kết nối..

## Cú pháp Cisco

```cisco
# Thiết lập default route tới next‑hop 203.0.113.1
Router(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1

# Hoặc dùng interface nếu next‑hop nằm trong cùng mạng
Router(config)# ip route 0.0.0.0 0.0.0.0 GigabitEthernet0/0
```

## ASCII diagram – Khi không có route cụ thể

```
[Host A]---(192.168.1.10)---[Router R]---(203.0.113.1)---[Internet]

1. Host A gửi gói tới 8.8.8.8 (Google DNS).
2. Router R không có entry cho 8.8.8.8 → tìm entry `0.0.0.0/0` (default).
3. Router R chuyển gói tới next‑hop 203.0.113.1 (ISP).
4. ISP tiếp tục định tuyến đến Google.
```

## Kiểm tra default route
```cisco
Router# show ip route static | include 0.0.0.0
```
Kết quả sẽ hiển thị dòng `S* 0.0.0.0/0 [1/0] via 203.0.113.1` (S* = static, * = best route).

## Khi default route không hoạt động
- **Next‑hop down**: ISP router không phản hồi → các ping ngoài sẽ thất bại.
- **Mask sai**: Sử dụng `0.0.0.0 255.255.255.0` thay vì `0.0.0.0 0.0.0.0` sẽ không khớp mọi địa chỉ.
