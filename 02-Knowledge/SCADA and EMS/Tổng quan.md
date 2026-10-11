![[Tổng quan-1791622252110.webp]]

# 1. SCADA và EMS là gì?

SCADA và EMS là hai hệ thống quan trọng trong lĩnh vực điện lực, đặc biệt tại các trung tâm điều độ hệ thống điện, nhà máy điện, trạm biến áp và lưới điện truyền tải, phân phối.

Có thể hiểu đơn giản:

- SCADA: Giúp người vận hành biết hệ thống điện đang hoạt động như thế nào và điều khiển thiết bị từ xa.
- EMS: Sử dụng dữ liệu để phân tích, dự báo và tính toán phương án vận hành hệ thống điện tối ưu.

Ví dụ: SCADA cho biết một đường dây đang truyền tải 500 MW và một máy biến áp đang hoạt động ở mức tải 80%. EMS sử dụng những dữ liệu đó cùng các thông tin khác để đánh giá khả năng vận hành, dự báo nhu cầu và đề xuất phương án phân bổ công suất phù hợp.

## 2. SCADA là gì?

![Tổng công ty Điện lực TP. Hồ Chí Minh: Hành trình 45 năm chủ động, sáng tạo và đổi mới](https://images.openai.com/static-rsc-4/PAdCxdjFrzYI8OlY06IxbcIMlqvlp7gjF2-DBE3to59cuAriqUPfmwN3X1Rgax8Lv9ZehhD2i7vBDdK95eyLDQyoQHIDUWrl4cvb2rxwRD0Z-lmJW2VDh2e0GCjb4Ug9qczeIcF2aw30mLmpvCs4sPhc3lVY5eZcppv5zsKz8hA?purpose=inline)

SCADA — Supervisory Control and Data Acquisition: Giám sát, điều khiển và thu thập dữ liệu. SCADA giúp thu thập dữ liệu từ thiết bị hiện trường, hiển thị trạng thái vận hành và cho phép người vận hành thực hiện các thao tác điều khiển từ trung tâm.

### Các chức năng chính của SCADA

##### 1. Thu thập dữ liệu: SCADA nhận dữ liệu từ các thiết bị như:

- Điện áp (Voltage).
- Dòng điện (Current).
- Công suất tác dụng (MW).
- Công suất phản kháng (MVAr).
- Tần số (Hz).
- Trạng thái đóng/mở của máy cắt.
- Cảnh báo và sự cố thiết bị.

=> Ví dụ: Một trạm biến áp gửi dữ liệu về trung tâm rằng điện áp là 110 kV, máy cắt đang đóng và dòng điện đang ở mức 300 A.

#### 2. Giám sát theo thời gian thực

Dữ liệu được cập nhật liên tục hoặc theo chu kỳ tùy cấu hình hệ thống. Người vận hành có thể xem sơ đồ điện một sợi (Single-Line Diagram), trạng thái thiết bị, thông số và cảnh báo.

#### 3. Điều khiển từ xa

Người vận hành có thể gửi lệnh điều khiển tới thiết bị, chẳng hạn:

- Đóng máy cắt (Close Breaker).
- Mở máy cắt (Open Breaker).
- Điều chỉnh một số giá trị đặt của thiết bị có hỗ trợ.

Lệnh thực tế thường phải qua các bước kiểm tra quyền, điều kiện liên động và xác nhận thao tác. Không phải mọi thiết bị đều có thể điều khiển từ xa.

#### 4. Cảnh báo và ghi lịch sử

Khi phát hiện thông số vượt ngưỡng hoặc thiết bị chuyển trạng thái, SCADA có thể phát cảnh báo và lưu sự kiện để phục vụ điều tra sự cố.

### Các thành phần của SCADA

![[Tổng quan-1791622706189.webp]]

### Các chức năng chính của EMS

#### 1. Phân tích trạng thái hệ thống — State Estimation

Dữ liệu đo lường thực tế thường có nhiễu, thiếu hoặc sai lệch. EMS sử dụng các phép tính và mô hình lưới điện để ước lượng trạng thái vận hành hợp lý hơn, chẳng hạn điện áp tại các nút và công suất trên các đường dây.

#### 2. Dự báo phụ tải — Load Forecasting

Dự báo nhu cầu sử dụng điện trong tương lai dựa trên dữ liệu lịch sử, thời tiết, thời gian và các yếu tố liên quan.

Ví dụ: EMS dự báo phụ tải ngày mai sẽ tăng mạnh vào khoảng 18–21 giờ. Thông tin này giúp đơn vị vận hành chuẩn bị nguồn điện và phương án truyền tải phù hợp.

#### 3. Điều độ kinh tế — Economic Dispatch

Tính toán cách phân bổ công suất phát giữa các tổ máy nhằm giảm chi phí vận hành, đồng thời đáp ứng nhu cầu phụ tải và các giới hạn kỹ thuật.

Ví dụ: Có hai tổ máy phát điện với chi phí sản xuất khác nhau. EMS có thể tính toán phân bổ nhiều công suất hơn cho tổ máy có chi phí thấp hơn, nếu đáp ứng các điều kiện vận hành.

#### 4. Phân tích an toàn — Contingency Analysis

Đánh giá những gì có thể xảy ra khi một thiết bị bị sự cố hoặc ngừng hoạt động, chẳng hạn một đường dây bị cắt.

EMS có thể xác định đường dây nào có nguy cơ quá tải sau sự cố và hỗ trợ người vận hành chuẩn bị phương án xử lý.

#### 5. Tối ưu hóa vận hành

Tùy hệ thống, EMS có thể hỗ trợ:

- Tối ưu phân bố công suất.
- Tính toán tổ máy cần huy động (Unit Commitment).
- Tối ưu điện áp và công suất phản kháng.
- Quản lý nguồn điện tái tạo.
- Hỗ trợ ra quyết định khi có sự cố.

Không phải mọi hệ thống EMS đều có đầy đủ các chức năng trên. Phạm vi chức năng phụ thuộc vào nhà cung cấp, quy mô hệ thống và yêu cầu vận hành.

## 4. Phân biệt SCADA và EMS

|Tiêu chí|SCADA|EMS|
|---|---|---|
|Mục tiêu|Giám sát, thu thập dữ liệu, điều khiển|Phân tích, dự báo, tối ưu vận hành|
|Dữ liệu|Đo lường, trạng thái, cảnh báo|Dữ liệu SCADA, mô hình lưới, dự báo và dữ liệu bổ sung|
|Xử lý|Thu thập và hiển thị trạng thái thực tế|Tính toán, mô phỏng và phân tích phương án|
|Đầu ra|Trạng thái, cảnh báo, lệnh điều khiển|Kết quả phân tích, dự báo, phương án tối ưu|
|Ví dụ|Phát hiện máy cắt đang mở|Đánh giá ảnh hưởng của việc máy cắt mở|
|Vai trò|Giám sát và điều khiển|Hỗ trợ quyết định vận hành|

Điểm quan trọng: SCADA không chỉ là màn hình giám sát, và EMS cũng không chỉ là một phần mềm báo cáo. SCADA có thể thực hiện các chức năng xử lý và điều khiển phức tạp; EMS sử dụng dữ liệu cùng các mô hình kỹ thuật để giải quyết bài toán vận hành ở mức cao hơn.

## 5. SCADA và EMS hoạt động cùng nhau như thế nào?

- Lớp thiết bị hiện trường: Cảm biến, công tơ, máy cắt, máy biến áp, RTU/PLC

- SCADA: Thu thập dữ liệu, hiển thị trạng thái, cảnh báo và điều khiển từ xa

- EMS: Phân tích trạng thái, dự báo phụ tải, kiểm tra an toàn và tính toán phương án tối ưu

- Người vận hành: Đánh giá phương án, phê duyệt hoặc thực hiện thao tác phù hợp

- Sơ đồ khái niệm: dữ liệu và lệnh trao đổi theo nhiều chiều; kiến trúc triển khai thực tế có thể khác.

### Ví dụ thực tế: Một đường dây điện bị quá tải

Giả sử một đường dây truyền tải có giới hạn vận hành là 500 MW.

1. SCADA thu thập dữ liệu: Phát hiện công suất truyền tải tăng lên 480 MW và tiếp tục tăng.
2. SCADA cảnh báo: Thông báo đường dây đang tiến gần giới hạn vận hành.
3. EMS phân tích: Tính toán phụ tải, trạng thái lưới và các phương án phân bổ lại công suất; kiểm tra nguy cơ quá tải khi xảy ra sự cố.
4. Người vận hành quyết định: Chọn phương án phù hợp với quy trình điều độ và điều kiện thực tế.
5. SCADA thực hiện và xác nhận: Nếu phương án yêu cầu thao tác từ xa, SCADA truyền lệnh đến thiết bị được phép điều khiển và phản hồi trạng thái sau thao tác.

=> Đây là ví dụ minh họa; việc thay đổi cấu hình lưới phải tuân theo các điều kiện an toàn, bảo vệ và quy trình điều độ.

## 6. Các lớp trong kiến trúc SCADA/EMS

Bức tranh tổng thể có thể chia thành năm lớp:

| Lớp             | Thành phần tiêu biểu                     | Nhiệm vụ                            |
| --------------- | ---------------------------------------- | ----------------------------------- |
| 1. Hiện trường  | Cảm biến, máy cắt, RTU, PLC              | Đo lường và tác động lên thiết bị   |
| 2. Truyền thông | Mạng LAN/WAN, cáp quang, MPLS, radio     | Truyền dữ liệu và lệnh              |
| 3. SCADA        | SCADA Server, HMI, Alarm, Historian      | Thu thập, giám sát và điều khiển    |
| 4. EMS          | Mô hình lưới, State Estimation, Dispatch | Phân tích và tối ưu vận hành        |
| 5. Người dùng   | Điều độ viên, kỹ sư, quản lý             | Giám sát, ra quyết định và quản trị |

Một số thành phần trong sơ đồ cần hiểu thêm:

- Historian: Hệ thống lưu trữ dữ liệu vận hành theo thời gian để tra cứu và phân tích lịch sử.
- Cơ sở dữ liệu: Lưu cấu hình, dữ liệu và thông tin phục vụ các ứng dụng; có thể được phân tách thành nhiều loại cơ sở dữ liệu.
- Giao thức truyền thông: IEC 60870-5-104, DNP3, Modbus hoặc OPC UA, tùy thiết bị và kiến trúc. Chúng không thay thế lẫn nhau trong mọi trường hợp.
- Mạng truyền thông: Không chỉ cần truyền được dữ liệu mà còn phải đáp ứng yêu cầu về độ trễ, tính sẵn sàng, dự phòng và an toàn thông tin.

Trong hệ thống điện quan trọng, SCADA/EMS thường được thiết kế với mạng phân vùng, kiểm soát truy cập, dự phòng và các biện pháp bảo vệ chuyên dụng. Không nên mặc định các hệ thống này được kết nối trực tiếp với Internet.

## 7. Nếu bạn muốn học SCADA/EMS để làm việc

Thứ tự học phù hợp cho người mới:

1. Kiến thức hệ thống điện: Điện áp, dòng điện, công suất MW/MVAr, máy biến áp, máy cắt, sơ đồ điện một sợi.
2. SCADA cơ bản: RTU, PLC, HMI, điểm đo (tag/point), trạng thái, cảnh báo, lệnh điều khiển và lịch sử dữ liệu.
3. Truyền thông công nghiệp: TCP/IP, IEC 60870-5-104, Modbus, DNP3 và cách các thiết bị trao đổi dữ liệu.
4. EMS: Mô hình lưới điện, State Estimation, Load Forecasting, Economic Dispatch và Contingency Analysis.
5. An toàn và vận hành: Phân quyền, liên động, quy trình xác nhận lệnh, dự phòng hệ thống và an ninh mạng OT.

Để hiểu rõ nhất, hãy nhớ công thức tư duy:

- SCADA = Quan sát + Thu thập + Điều khiển.
- EMS = Mô hình hóa + Phân tích + Dự báo + Tối ưu.
- SCADA và EMS phối hợp = Có dữ liệu thực tế để đưa ra quyết định vận hành tốt hơn.

Một lưu ý cuối: trong các lĩnh vực khác, EMS còn có thể chỉ hệ thống quản lý năng lượng của tòa nhà, nhà máy hoặc cơ sở công nghiệp. Ở đây, phần giải thích tập trung vào EMS trong hệ thống điện, như tại trung tâm điều độ và lưới truyền tải điện.