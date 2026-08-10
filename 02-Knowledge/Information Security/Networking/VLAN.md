---
title: VLAN
summary: A short description will make the document more useful.
tags:
  - daily
created: 2026-08-02
---
# Hiểu nhanh

VLAN (Virtual Local Area Network - Mạng LAN ảo) được sinh ra để giải quyết ba vấn đề cốt lõi của một hệ thống mạng vật lý truyền thống: **Kiểm soát Broadcast (giảm nghẽn mạng), Bảo mật, và Tính linh hoạt**.

<mark style="background:#affad1">Thay vì phải mua nhiều Switch vật lý để chia tách mạng cho từng phòng ban</mark>, <mark style="background:#d3f8b6">VLAN cho phép bạn chia một Switch vật lý duy nhất thành nhiều "Switch ảo" độc lập.</mark>



![[VLAN-1785661220920.webp]]

LAN là một mạng cục bộ (viết tắt của Local Area Network), được định nghĩa là tất cả các máy tính trong cùng một miền quảng bá (broadcast domain).

VLAN là một mạng LAN ảo. Về mặt kỹ thuật, VLAN là một miền quảng bá được tạo bởi các switch. <mark style="background:rgba(5, 117, 197, 0.2)">Bình thường thì router đóng vai trò tạo ra miền quảng bá</mark>. <mark style="background:#affad1">Đối với VLAN, switch có thể tạo ra miền quảng bá.</mark>

> [!note]
> ***=> Bạn có thể hiểu một cách dễ hơn là VLAN dùng để chia một con switch thành nhiều con switch nhỏ hơn và hoàn toàn độc lập với nhau.***


- Đối với network : VLAN = Broadcast domain = Logical Network
- Đối với switch : VLAN = Logical switch.



# Phân loại VLAN

#### **Port - based VLAN**: 
là cách cấu hình VLAN đơn giản và phổ biến. <mark style="background:#affad1">Mỗi cổng của Switch được gắn với một VLAN xác định</mark> (mặc định là VLAN 1), do vậy <mark style="background:#affad1">bất cứ thiết bị host nào gắn vào cổng đó đều thuộc một VLAN </mark>nào đó.
#### **MAC address based VLAN**: 
Cách cấu hình này ít được sử dụng do có nhiều bất tiện trong việc quản lý. Mỗi địa chỉ MAC được đánh dấu với một VLAN xác định.
#### **Protocol – based VLAN**: 
Cách cấu hình này gần giống như MAC Address based, nhưng sử dụng một địa chỉ logic hay địa chỉ IP thay thế cho địa chỉ MAC. Cách cấu hình không còn thông dụng nhờ sử dụng giao thức DHCP.



# VLAN có cần thiết không?

Bạn <mark style="background:#affad1">cần VLAN khi mạng máy tính của bạn quá lớn và có lưu lượng truy cập quá nhiều</mark>.

![[VLAN-1785661595807.webp]]

Thêm một vấn đề quan trọng nữa, đó là trên switch Cisco, VLAN được kích hoạt mặc định và tất cả các máy tính đã nằm trong một VLAN. VLAN đó chính là VLAN 1. Bởi thế mà theo mặc định, bạn có thể sử dụng tất cả các cổng trên switch và tất cả các [máy tính](https://www.dienmayxanh.com/may-tinh-nguyen-bo "máy tính nguyên bộ") đều có khả năng giao tiếp với nhau.



## VLAN giải quyết vấn đề gì ?

### 1. Phân chia Broadcast Domain (Giảm nghẽn mạng)

- **Vấn đề:** Trong một mạng <mark style="background:#d3f8b6">LAN phẳng (không có VLAN)</mark>, <mark style="background:#d3f8b6">khi một thiết bị gửi gói tin Broadcast</mark> (ví dụ: truy vấn ARP để tìm địa chỉ MAC), <mark style="background:#d3f8b6">Switch sẽ chuyển tiếp gói tin đó đến **tất cả** các cổng còn lại</mark>. 
	- => <mark style="background:#d3f8b6">Nếu mạng có quá nhiều thiết bị</mark>, lượng Broadcast traffic sẽ rất lớn, gây ra hiện tượng "Broadcast Storm" (Bão Broadcast), làm chậm hoặc sập toàn bộ hệ thống.

- **Giải pháp của VLAN:** <mark style="background:#affad1">VLAN cô lập các Broadcast Domain</mark>. Nếu một máy tính ở VLAN 10 gửi gói tin Broadcast, Switch sẽ chỉ gửi gói tin đó đến các cổng thuộc VLAN 10. Các máy ở VLAN 20 sẽ không bị ảnh hưởng, giúp tiết kiệm băng thông và tăng hiệu suất.

![[VLAN-1785663113081.webp]]

### 2. Tăng cường Bảo mật (Security)

- **Vấn đề:** Nếu tất cả các phòng ban (Giám đốc, Kế toán, Nhân sự, IT) cùng cắm chung vào một Switch vật lý, bất kỳ ai dùng công cụ bắt gói tin (như Wireshark) cũng có thể "nghe lén" được dữ liệu nội bộ của phòng ban khác.

- **Giải pháp của VLAN:** VLAN cách ly dữ liệu ở Layer 2 (Lớp liên kết dữ liệu). Các máy tính khác VLAN sẽ không thể "nhìn thấy" hay giao tiếp trực tiếp với nhau dù cắm chung một Switch (trừ khi có thiết bị định tuyến Layer 3 như Router can thiệp và được cấu hình quy tắc cho phép). Điều này ngăn chặn rò rỉ dữ liệu nhạy cảm.
    

### 3. Tối ưu hóa Chi phí và Tính linh hoạt

- **Vấn đề:** Giả sử công ty có 3 phòng ban và bạn muốn tách biệt mạng của họ. Thông thường, bạn sẽ phải mua 3 Switch vật lý riêng biệt, đi dây cáp phức tạp theo vị trí ngồi. Nếu một nhân viên Kế toán chuyển chỗ sang khu vực IT, bạn phải kéo lại dây cáp vật lý.

- **Giải pháp của VLAN:** Bạn chỉ cần mua 1 Switch hỗ trợ VLAN. Việc phân chia phòng ban được cấu hình bằng phần mềm (gán cổng của Switch vào các VLAN tương ứng). Nếu nhân viên chuyển chỗ, bạn chỉ cần ngồi tại máy chủ quản trị và đổi cấu hình cổng mạng tại chỗ ngồi mới sang VLAN của Kế toán mà không cần đi lại dây vật lý.
