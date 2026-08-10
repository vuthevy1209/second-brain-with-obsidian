---
title: Static Route
summary: Giải thích static route, cách cấu hình trên router Cisco, và ví dụ ASCII mô tả cách router sử dụng static route.
tags:
  - networking
  - static-route
  - ccna
created: 2026-08-02
---
## Khái niệm

Static route là **bảng routing được quản trị viên cấu hình thủ công**. Router sẽ luôn sử dụng entry này nếu nó là **best match** cho destination. Thích hợp cho môi trường nhỏ, hoặc để định tuyến tới mạng không hỗ trợ giao thức động.

## Cú pháp cấu hình Cisco

```cisco
# Thêm static route tới mạng 172.16.0.0/16 thông qua next‑hop 192.168.1.2
Router(config)# ip route 172.16.0.0 255.255.0.0 192.168.1.2

# Nếu next‑hop nằm trên cùng interface, có thể dùng interface thay vì IP:
Router(config)# ip route 172.16.0.0 255.255.0.0 GigabitEthernet0/1
```

## ASCII diagram – Router sử dụng static route

```
[Host A]---(192.168.1.10)---[Router R]---(10.0.0.1)---[Network B]

- Host A muốn gửi tới 172.16.5.10 (Network B).
- Router R có static route:
  Destination: 172.16.0.0/16   Next‑Hop: 192.168.1.2
- Router R gửi gói tới next‑hop 192.168.1.2 (có thể là another router).
- Các router trung gian tiếp tục chuyển tới 172.16.5.10.
```

## Khi static route không hoạt động

- **Next‑hop down**: Nếu next‑hop không phản hồi, router sẽ không có alternative (trừ khi có route fallback).
- **Mask sai**: Đưa ra route không khớp với mục tiêu, dẫn tới default route hoặc “Destination unreachable”.

## Kiểm tra và Xóa static route
```cisco
# Xem các static route hiện có
Router# show ip route static

# Xóa static route
Router(config)# no ip route 172.16.0.0 255.255.0.0 192.168.1.2
```
