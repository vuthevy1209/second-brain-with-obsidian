---
title: NAT & PAT (Network Address Translation / Port Address Translation)
summary: Giải thích NAT và PAT, cách cấu hình trên router Cisco, và ví dụ ASCII minh họa quá trình dịch địa chỉ và cổng.
tags:
  - networking
  - nat
  - pat
  - ccna
created: 2026-08-02
---
> [!note]
> Trong thế giới mạng, hầu hết các trường hợp sử dụng địa chỉ IP đều quan trọng <mark style="background:#affad1">do sự hạn chế về số lượng **ipv4**</mark>, một phần của cơ chế dịch địa chỉ mạng (NAT). 
> 
> - Hai công nghệ được phát triển để giải quyết vấn đề này là dịch địa chỉ mạng (NAT) và dịch địa chỉ cổng (PAT). 
> - Những công nghệ này không chỉ giúp duy trì số lượng địa chỉ IP mà còn tăng cường bảo mật mạng và khả năng định tuyến.


## 1. Khái niệm

- **<mark style="background:rgba(5, 117, 197, 0.2)">NAT</mark> (Network Address Translation)**: <mark style="background:rgba(5, 117, 197, 0.2)">Dịch địa chỉ IP nội bộ (private) sang địa chỉ công cộng (public)</mark> để các host trong LAN có thể truy cập Internet. Trong NAT, địa chỉ IP riêng được chuyển đổi thành địa chỉ IP công cộng.

- **<mark style="background:#affad1">PAT</mark> (Port Address Translation)** – còn gọi **NAT overload**: <mark style="background:#affad1">Khi nhiều host nội bộ dùng chung **một** địa chỉ public</mark>, router sẽ ghi nhớ cặp `privateIP:privatePort → publicIP:uniquePort` để phân biệt luồng. Trong PAT, [địa chỉ IP riêng](https://www.geeksforgeeks.org/computer-networks/private-ip-addresses-in-networking/) được chuyển đổi thành địa chỉ IP công cộng thông qua số cổng.

> [!note]
> => PAT là một NAT động

- **Static NAT**: Ánh xạ cố định 1-1 giữa IP nội bộ và IP công cộng.
- **Overloading (PAT)**: Cho phép nhiều máy nội bộ dùng chung một IP công cộng bằng cách phân biệt qua các số cổng (port) khác nhau.
- **Overlapping**: Dùng để công khai (publish) một dịch vụ từ mạng nội bộ ra Internet (ví dụ: chạy Web server hoặc FTP server bên trong mạng LAN).

| Tiêu chí                   | NAT (nói chung, thường là Static/Dynamic NAT) | PAT (NAT Overload)                                                    |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Tỉ lệ ánh xạ               | **1 IP private ↔ 1 IP public**                | **Nhiều IP private ↔ 1 IP public** (dùng chung)                       |
| Cách phân biệt các kết nối | Dựa vào **địa chỉ IP** khác nhau              | Dựa vào **số cổng (port number)** khác nhau                           |
| Số IP public cần dùng      | Cần **nhiều** IP public (theo số máy)         | Chỉ cần **1** (hoặc rất ít) IP public                                 |
| Mức độ phổ biến thực tế    | Ít dùng (tốn IP public)                       | **Rất phổ biến** — hầu hết router gia đình/doanh nghiệp dùng cách này |
| Tên gọi khác               | Static NAT / Dynamic NAT                      | NAT Overload                                                          |

## 2. Cơ chế hoạt động NAT

![[NAT & PAT-1785685393847.webp]]


=> Khi một trong các thiết bị gửi yêu cầu đến internet, <mark style="background:rgba(205, 244, 105, 0.55)">NAT sẽ dịch địa chỉ IP riêng của thiết bị đó thành địa chỉ IP công cộng của mạng</mark> và gửi yêu cầu đó qua internet.


## 3. PAT

**<mark style="background:#affad1">PAT</mark> (Port Address Translation)** – còn gọi **NAT overload**: <mark style="background:#affad1">Khi nhiều host nội bộ dùng chung **một** địa chỉ public</mark>, router sẽ ghi nhớ cặp `privateIP:privatePort → publicIP:uniquePort` để phân biệt luồng.


![[NAT & PAT-1785685523080.webp]]


<mark style="background:rgba(205, 244, 105, 0.55)">Khi máy tính gửi yêu cầu đến internet, PAT sẽ gán cho nó một số cổng duy nhất và chuyển đổi địa chỉ IP riêng của máy tính thành địa chỉ IP công cộng của mạng</mark>. Máy chủ đích trên internet nhận được yêu cầu và phản hồi lại số cổng duy nhất đó, cho phép máy tính nhận được phản hồi.

## Ví dụ cấu hình Cisco
### NAT static (one‑to‑one)
```cisco
! Định nghĩa mạng nội bộ
ip nat inside source static 10.0.0.100 203.0.113.50

! Gán interface
interface GigabitEthernet0/0   ! facing inside
 ip address 10.0.0.1 255.255.255.0
 ip nat inside
!
interface GigabitEthernet0/1   ! facing outside
 ip address 203.0.113.10 255.255.255.0
 ip nat outside
```
### PAT (NAT overload) – thường dùng cho truy cập Internet
```cisco
! Định nghĩa danh sách ACL cho mạng nội bộ muốn NAT
access-list 10 permit 10.0.0.0 0.0.0.255

! NAT overload – dịch toàn bộ mạng 10.0.0.0/24 sang địa chỉ public của giao diện ngoài
ip nat inside source list 10 interface GigabitEthernet0/1 overload

! Gán interface
interface GigabitEthernet0/0   ! inside
 ip address 10.0.0.1 255.255.255.0
 ip nat inside
!
interface GigabitEthernet0/1   ! outside
 ip address 203.0.113.10 255.255.255.0
 ip nat outside
```
### Kiểm tra NAT/PAT
```cisco
Router# show ip nat translations          ! xem bảng dịch hiện tại
Router# show ip nat statistics            ! thống kê số lần dịch
```

## Khi NAT/PAT không hoạt động

- **ACL không khớp**: Nếu danh sách ACL không bao phủ mạng nội bộ, router sẽ không thực hiện NAT.
- **Interface chưa gán `ip nat inside/outside`** → NAT không được kích hoạt.
- **Port exhaustion**: Với PAT, nếu có quá nhiều kết nối đồng thời, các port có thể hết và các kết nối mới bị từ chối.

## Lưu ý bảo mật

- NAT không thay thế firewall; vẫn cần **ACL** để lọc lưu lượng.
- Khi sử dụng **static NAT**, chỉ mở các port cần thiết (ví dụ `ip nat inside source static tcp 10.0.0.100 80 203.0.113.50 8080`).
