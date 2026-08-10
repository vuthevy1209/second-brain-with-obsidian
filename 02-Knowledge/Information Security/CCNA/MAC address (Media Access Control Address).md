---
title: MAC Address
summary: Giải thích MAC address, cấu trúc 48‑bit, cách hiển thị, ví dụ lệnh Cisco và sơ đồ ASCII mô tả khung Ethernet.
tags:
  - networking
  - mac-address
  - ccna
created: 2026-08-02
---

## 1. Khái niệm

- Địa chỉ MAC là **địa chỉ vật lý** duy nhất gán cho mỗi giao diện mạng (NIC) ở tầng Data Link (Layer 2).
- Độ dài **48 bit** (6 byte) được biểu diễn dưới dạng hex, thường viết dưới dạng `AA:BB:CC:DD:EE:FF`.
- **OUI (Organizationally Unique Identifier)** – 3 byte đầu (AA:BB:CC) xác định nhà sản xuất; 3 byte cuối là số serial.

> [!note]
> Khái niệm này đặc biệt quan trọng trong quá trình giao tiếp tại tầng Liên kết dữ liệu (Data Link Layer) của mô hình OSI và TCP/IP. Địa chỉ MAC đảm bảo rằng mỗi gói dữ liệu được gửi trong một mạng có thể định tuyến chính xác đến đích cuối cùng của nó.

## 2. So sánh địa chỉ MAC địa chỉ IP

| Tiêu chí       | IP address                                             | MAC address                                                   |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| Tầng hoạt động | **Network layer** (tầng 3)                             | **Data Link layer** (tầng 2)                                  |
| Phạm vi        | Thay đổi được, phụ thuộc **mạng đang kết nối**         | Gắn liền với **phần cứng** (card mạng), gần như cố định       |
| Vai trò        | Định danh máy để **định tuyến qua Internet/liên mạng** | Định danh máy để **giao tiếp trong cùng một mạng LAN cục bộ** |
| Ai cấp phát    | Router/DHCP server cấp, có thể đổi mỗi lần kết nối     | Nhà sản xuất phần cứng ghi cố định vào chip mạng              |

> [!note] Vì sao chỉ IP thôi chưa đủ?
> - **IP giống như địa chỉ nhà theo "khu vực"** - nó giúp gói tin biết cần đi đến **mạng nào, thiết bị số mấy trong mạng đó**. 
> - Nhưng khi gói tin đã đến đúng mạng LAN (ví dụ router nhà bạn), để **thực sự gửi dữ liệu tới đúng thiết bị vật lý**, hệ thống cần **MAC address** — vì đó là địa chỉ mà **card mạng vật lý** nhận diện, dùng ở tầng thấp hơn IP.

## Cấu trúc (ASCII diagram)

- Phần Organizational Unique Identifier (OUI)
- Phần Network Interface Controller (NIC)

Định dạng này đảm bảo tính duy nhất toàn cầu cho mỗi địa chỉ MAC, cho phép các thiết bị được xác định một cách chính xác trong mạng.

![[MAC address (Media Access Control Address)-1785684074857.webp]]


## 3. Phân loại địa chỉ MAC

Trong mạng máy tính, địa chỉ MAC có thể được phân loại thành 3 kiểu chính: Unicast, Multicast, và Broadcast. Mỗi loại đều có ứng dụng và mục đích sử dụng riêng, phù hợp với các tình huống và nhu cầu khác nhau trong mạng.

|Loại|Ý nghĩa|Đích nhận|
|---|---|---|
|**Unicast**|Gửi đến **một** thiết bị duy nhất|1 máy cụ thể (địa chỉ MAC thật của card mạng đó)|
|**Multicast**|Gửi đến **một nhóm** thiết bị đã đăng ký nhận|Nhiều máy cùng thuộc 1 nhóm (không phải tất cả)|
|**Broadcast**|Gửi đến **tất cả** thiết bị trong cùng mạng LAN|Toàn bộ máy trong mạng (địa chỉ đặc biệt `FF:FF:FF:FF:FF:FF`)|
**1. Unicast** — giao tiếp **1-1**

- Là hình thức phổ biến nhất: máy A gửi dữ liệu trực tiếp đến máy B.
- Ví dụ: bạn duyệt web, tải file — dữ liệu gửi thẳng đến đúng thiết bị đích.
- Byte đầu tiên của MAC có bit thấp nhất = **0** → nhận diện là unicast.

**2. Multicast** — giao tiếp **1-nhiều (theo nhóm)**

- Chỉ những thiết bị đã **đăng ký tham gia nhóm** mới nhận được, tiết kiệm băng thông hơn broadcast.
- Ví dụ: streaming video hội nghị, giao thức định tuyến (OSPF), IPTV.
- Byte đầu tiên có bit thấp nhất = **1** → nhận diện là multicast.

**3. Broadcast** — giao tiếp **1-tất cả**

- Gửi đến **mọi thiết bị** trong cùng mạng LAN, dù có cần nhận hay không.
- Ví dụ điển hình: **gói ARP Request** (như bạn vừa hỏi ở câu trước!) — vì không biết MAC của máy đích, nên phải hỏi tất cả bằng broadcast.
- Địa chỉ cố định: `FF:FF:FF:FF:FF:FF`.


## Ví dụ lệnh Cisco

```cisco
# Xem MAC address của interface Ethernet0/0
Router# show interface ethernet0/0
   Hardware is iGbE, address is aabb.ccdd.eeff (bia aabb.ccdd.eeff)

# Thiết lập MAC address tĩnh (rarely used) – chỉ trên một số switch
Switch(config)# interface vlan 10
Switch(config-if)# mac-address a1:b2:c3:d4:e5:f6
```

## Khi MAC address bị xung đột

- Hai thiết bị có cùng MAC sẽ gây **MAC address conflict**, switch sẽ học một trong hai và ngắt kết nối thiết bị còn lại.
- *Giải pháp*: Kiểm tra cấu hình, thay đổi MAC tĩnh, hoặc cập nhật firmware.

## Ứng dụng trong CCNA

- **Switch learning**: Switch xây dựng bảng MAC (CAM table) dựa trên source MAC trong khung Ethernet.
- **Port security**: Giới hạn số MAC tối đa trên một cổng để ngăn MAC spoofing.

