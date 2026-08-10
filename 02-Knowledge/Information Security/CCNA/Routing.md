---
title: Routing Cơ Bản
summary: Giới thiệu khái niệm routing, các thành phần cơ bản, bảng routing, ví dụ lệnh Cisco và sơ đồ ASCII mô tả quá trình định tuyến.
tags:
  - networking
  - routing
  - ccna
created: 2026-08-02
---
## 1. Khái niệm

**<mark style="background:rgba(205, 244, 105, 0.55)">Router - bộ định tuyến</mark>** là thiết bị mạng <mark style="background:#b1ffff">chịu trách nhiệm chuyển tiếp các gói dữ liệu giữa các mạng khác nhau</mark>. Khi một gói dữ liệu đến, router sẽ kiểm tra địa chỉ IP đích của gói và sử dụng bảng định tuyến để quyết định giao diện (tức là cổng ra) nào sẽ được sử dụng để gửi gói đó. 

> [!note]
> Mỗi router có bảng định tuyến riêng, được lưu trữ trong bộ nhớ RAM của thiết bị và được thiết lập dựa trên các kết nối mạng mà router quản lý.

Routing Table là bảng định tuyến - một tập hợp các quy tắc, thường được hiển thị dưới dạng bảng, dùng để xác định nơi các gói dữ liệu sẽ được gửi trong mạng sử dụng giao thức Internet (IP). Tất cả các thiết bị hỗ trợ IP như router và **switch** đều sử dụng bảng định tuyến. Routing Table liệt kê tất cả các mạng mà thiết bị biết cách tiếp cận, giúp điều hướng dữ liệu đến đúng địa chỉ đích.

Routing là **quá trình quyết định đường đi (path) cho gói IP** từ nguồn tới đích qua một hoặc nhiều mạng. <mark style="background:rgba(205, 244, 105, 0.55)">Router hoạt động ở **Layer 3 (Network)**</mark>, sử dụng **bảng routing**để chọn interface và next‑hop thích hợp.

### Bảng Routing (Routing Table) 

![[Routing cơ bản-1785686492668.webp]]
- **Directly connected**: Khi mạng thuộc cùng subnet, Next‑Hop là `0.0.0.0` (gửi trực tiếp). 
- **Static/Dynamic**: Các entry được cấu hình thủ công hoặc học từ giao thức routing (RIP, OSPF, EIGRP...).

## **Cấu tạo bảng định tuyến**

Routing Table bao gồm các mục: 

- **Destination (Đích đến):** Đây là địa chỉ IP của điểm đến cuối cùng mà gói dữ liệu cần tới.
- **Subnet Mask (Mặt nạ mạng con):** Là một địa chỉ mạng 32-bit dùng để xác định xem một máy chủ thuộc mạng cục bộ hay mạng từ xa. Để tăng hiệu quả định tuyến và giảm kích thước miền quảng bá, quản trị viên có thể áp dụng mặt nạ mạng con tùy chỉnh thông qua quá trình subnetting, chia mạng lớn thành các mạng nhỏ hơn được kết nối với nhau.
- **Gateway (Cổng kết nối):** Là bước tiếp theo hoặc địa chỉ IP của thiết bị lân cận mà gói dữ liệu sẽ được chuyển tiếp tới.
- **Interface (Giao diện):** Đây là cổng giao tiếp mạng của router. Router thường sử dụng các giao diện Ethernet (như eth0, eth1) để kết nối với các thiết bị trong cùng mạng hoặc giao diện serial để kết nối với [**mạng diện rộng (WAN)**](https://viettuans.vn/mang-wan-la-gi). Bảng định tuyến liệt kê giao diện đầu vào hoặc giao diện ra mà thiết bị sẽ sử dụng để chuyển gói dữ liệu đến bước tiếp theo.
- **Metric (Chỉ số ưu tiên):** Là giá trị được gán cho mỗi tuyến đường đến một mạng cụ thể, giúp router chọn tuyến đường hiệu quả nhất. Trong một số trường hợp, chỉ số metric là số lượng router mà gói dữ liệu phải đi qua trước khi đến đích. Nếu có nhiều tuyến đường đến cùng một đích, tuyến đường có chỉ số thấp nhất sẽ được ưu tiên.
- **Routes (Các tuyến đường):** Bao gồm các mạng con được kết nối trực tiếp, các mạng con gián tiếp (không được kết nối trực tiếp với thiết bị nhưng có thể truy cập qua một hoặc nhiều bước trung gian) và các tuyến mặc định được sử dụng khi không có thông tin cụ thể về đường đi.

## Ví dụ lệnh Cisco (router)

```cisco
# Xem bảng routing hiện tại
Router# show ip route

# Thêm một static route (đi tới mạng 10.0.0.0/8 qua 192.168.1.2)
Router(config)# ip route 10.0.0.0 255.0.0.0 192.168.1.2

# Xóa static route
Router(config)# no ip route 10.0.0.0 255.0.0.0 192.168.1.2
```

## Cơ chế định tuyến

1. **Input**: Router nhận Ethernet frame → giải mã MAC → lấy IP header.
2. **Lookup**: Kiểm tra bảng routing để tìm **best match** (longest prefix).
3. **Output**: Đóng gói lại thành Ethernet frame mới, thay đổi MAC nguồn/đích, và gửi ra interface đã quyết định.
