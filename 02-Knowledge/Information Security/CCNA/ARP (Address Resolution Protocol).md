---
title: ARP (Address Resolution Protocol)
summary: Giải thích ARP, cách hoạt động, ví dụ lệnh Cisco và sơ đồ ASCII minh họa quá trình chuyển đổi IP → MAC.
tags:
  - networking
  - arp
  - ccna
created: 2026-08-02
---
## Khái niệm

<mark style="background:#affad1">ARP là giao thức tầng Data Link (Layer 2)</mark> dùng để <mark style="background:#d3f8b6">**tìm địa chỉ MAC tương ứng với một địa chỉ IP** trong cùng một mạng LAN</mark>. Khi một host muốn gửi gói IP tới một IP đích trong cùng subnet, nó phải biết MAC của đích để đặt vào khung Ethernet.

Để hiểu rõ về **ARP (Address Resolution Protocol)**, bạn hãy tưởng tượng một tình huống trong một văn phòng: Bạn biết tên đồng nghiệp là "Vỹ" (địa chỉ IP), nhưng bạn không biết mặt ông ấy (địa chỉ MAC) để đưa tận tay xấp tài liệu. Bạn sẽ đứng giữa văn phòng và hét lớn: "Ai là Vỹ?".

> [!summary] Cơ chế
> Gửi một bản tin **ARP Request** (quảng bá/broadcast) để hỏi địa chỉ MAC và nhận lại **ARP Reply** (đơn mã/unicast) từ máy có IP tương ứng. Các kết quả được lưu vào **ARP Table** trong RAM để sử dụng lại.

> [!note]
> Trong mô hình OSI, có một sự đứt gãy giữa Tầng 3 và Tầng 2:
> - **Tầng 3 (IP):** Chịu trách nhiệm đưa gói tin đến đúng mạng (Network).
> - **Tầng 2 (MAC):** Chịu trách nhiệm đưa gói tin đến đúng phần cứng (Card mạng) trong mạng nội bộ đó.
> 
> =>  Máy tính không thể gửi dữ liệu qua dây cáp hay sóng Wi-Fi chỉ bằng địa chỉ IP. Nó bắt buộc phải đóng gói dữ liệu vào một **Frame** có chứa địa chỉ MAC đích. ARP chính là "người phiên dịch" từ IP sang MAC.

Nếu Máy A muốn gửi dữ liệu đến một địa chỉ IP ngoài internet (ví dụ Server Google):

1. Máy A nhận thấy IP đích không cùng lớp mạng với mình.
2. Thay vì hỏi ARP cho IP của Google (vô ích vì Broadcast không qua được Router), Máy A sẽ hỏi **địa chỉ MAC của Default Gateway** (chính là cái Router nhà bạn).
3. Gói tin sẽ được gửi đến Router, và Router sẽ lo phần "định tuyến" tiếp theo ở tầng 3.

## Cơ chế hoạt động (ASCII diagram)
```
[Host A]                       [Host B]
IP: 192.168.1.10               IP: 192.168.1.20
MAC: AA:BB:CC:DD:EE:01          MAC: AA:BB:CC:DD:EE:02

Host A muốn gửi packet tới 192.168.1.20

1. Host A kiểm tra ARP cache → không có entry.
2. Host A broadcast ARP Request:
   ───────────────────────────────────────────────────────
   Broadcast Ethernet Frame (FF:FF:FF:FF:FF:FF)
   ARP Request:  who-has 192.168.1.20? tell 192.168.1.10
   ───────────────────────────────────────────────────────
3. Tất cả host trong LAN nhận frame, nhưng **Host B** là người đáp.
4. Host B gửi ARP Reply (unicast) tới Host A:
   ───────────────────────────────────────────────────────
   Ethernet Frame (dst=AA:BB:CC:DD:EE:01)
   ARP Reply:  192.168.1.20 is at AA:BB:CC:DD:EE:02
   ───────────────────────────────────────────────────────
5. Host A lưu vào ARP cache và sử dụng MAC của Host B để gửi dữ liệu.
```





## Broadcast

- Tạo gói tin ARP
![[ARP-1785672967140.webp]]

- Broadcast hết các host trong cùng subnet

![[ARP-1785672951952.webp]]



## Nhận ARP reply

- Các máy nhận được gói tin ARP này sẽ thấy Ethernet Frame (FF:FF:FF:FF:FF:FF) Thì hệ điều hành **chuyển thẳng cho module xử lý ARP** (một tiến trình nhỏ trong network stack, nằm giữa tầng 2 và tầng 3)
![[ARP (Address Resolution Protocol)-1785673179974.webp]]



## Ví dụ lệnh Cisco (các router/switch Cisco)
```cisco
# Kiểm tra ARP cache trên router
Router# show ip arp

# Thêm ARP tĩnh (static) – khi biết IP và MAC trước
Router(config)# arp 192.168.1.20 aa.bb.cc.dd.ee.02 ARPA
```

## Khi ARP không hoạt động

- **ARP cache timeout** (default 4 h) → bảng ARP sẽ mất entry.
- **ARP spoofing/poisoning** – kẻ tấn công gửi ARP Reply giả để chuyển hướng traffic.

## Phòng chống

- Sử dụng **Dynamic ARP Inspection (DAI)** trên switch Cisco.
- Áp dụng **port security** để giới hạn MAC trên cổng.

