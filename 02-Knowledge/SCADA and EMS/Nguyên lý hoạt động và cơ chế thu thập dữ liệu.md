![[Nguyên lý hoạt động và cơ chế thu thập dữ liệu-1791631732032.webp]]
1. **Thu thập dữ liệu tại hiện trường**: Các cảm biến và thiết bị đo lường (Cấp thiết bị hiện trường) liên tục đo đạc các thông số vật lý của quy trình
2. **Xử lý cục bộ**: Dữ liệu từ cảm biến được gửi đến các RTU hoặc PLC (Thiết bị điều khiển cục bộ). Các thiết bị này sẽ thực hiện xử lý sơ bộ (chuyển đổi tín hiệu, lọc nhiễu, thực thi các logic điều khiển tại chỗ) và lưu trữ tạm thời
3. **Truyền dữ liệu về trung tâm**: RTU/PLC sử dụng hệ thống truyền thông (có dây hoặc không dây, qua các giao thức công nghiệp) để gửi dữ liệu đã xử lý về Máy chủ SCADA. Quá trình này có thể diễn ra theo chu kỳ hoặc khi có sự kiện bất thường  
4. **Xử lý và hiển thị tại trung tâm**: Máy chủ SCADA nhận dữ liệu, lưu trữ vào cơ sở dữ liệu lịch sử, thực hiện các tính toán, phân tích và hiển thị thông tin trực quan lên HMI.
5. **Giám sát và điều khiển bởi người vận hành**: Người vận hành theo dõi HMI để nắm bắt tình trạng của hệ thống. Khi cần thiết, người vận hành có thể gửi lệnh điều khiển thông qua HMI

**Các chế độ truyền thông phổ biến:**

- Truyền thông Master/Slave (Polling): Trạm trung tâm (Master) định kỳ truy vấn các trạm ở xa (Slave – RTU/PLC) để thu thập dữ liệu. Slave chỉ trả lời khi được yêu cầu. Chế độ này đơn giản, tránh xung đột dữ liệu nhưng có thể có độ trễ
- Truyền thông theo sự kiện (Report by Exception – RBE): RTU/PLC chỉ gửi dữ liệu về trung tâm khi có sự thay đổi đáng kể về giá trị hoặc khi xảy ra sự kiện/cảnh báo. Điều này giúp giảm tải băng thông mạng và ưu tiên các thông tin quan trọng
- Truyền thông Peer-to-Peer: Các trạm SCADA hoặc PLC có thể trao đổi dữ liệu trực tiếp với nhau mà không cần qua trung tâm (ít phổ biến trong SCADA truyền thống)