# UniHub Workshop — Project Proposal

## Vấn đề
Hiện tại, ban tổ chức quản lý việc đăng ký workshop thông qua Google Form và gửi thông báo xác nhận bằng email thủ công [cite: User Prompt]. Quy trình này bộc lộ nhiều hạn chế nghiêm trọng khi quy mô sự kiện lên tới 8–12 workshop mỗi ngày trong vòng 5 ngày [cite: User Prompt]:
* **Thiếu tính thời gian thực**: Google Form không thể kiểm soát số chỗ còn lại ngay lập tức, dẫn đến tình trạng hàng trăm sinh viên đăng ký cho một workshop chỉ có 60 chỗ [cite: User Prompt].
* **Quá tải vận hành**: Việc gửi thông báo thủ công không đáp ứng được số lượng lớn sinh viên, gây chậm trễ thông tin [cite: User Prompt].
* **Khó khăn trong check-in**: Không có công cụ chuyên dụng để xác nhận tham dự tại hiện trường, đặc biệt ở các khu vực có kết nối mạng không ổn định [cite: User Prompt].
* **Dữ liệu rời rạc**: Khó khăn trong việc đối soát dữ liệu sinh viên với hệ thống quản lý cũ của trường (Legacy SIS) và tích hợp các luồng thanh toán cho workshop có phí [cite: User Prompt].

## Mục tiêu
Hệ thống UniHub Workshop được xây dựng nhằm số hóa toàn diện quy trình tổ chức sự kiện với các mục tiêu định lượng cụ thể:
* **Chịu tải đột biến**: Đảm bảo hệ thống hoạt động ổn định khi có 12.000 sinh viên truy cập trong 10 phút đầu tiên khi mở cổng đăng ký (trong đó 60% tải tập trung vào 3 phút đầu) [cite: User Prompt].
* **Công bằng trong giữ chỗ**: Đảm bảo không xảy ra tình trạng tranh chấp chỗ ngồi (overbooking), tuyệt đối không có hai sinh viên nhận được cùng một chỗ cuối cùng [cite: User Prompt].
* **Tự động hóa thông báo**: 100% sinh viên đăng ký thành công nhận được mã QR qua ứng dụng và email ngay lập tức [cite: User Prompt].
* **Trí tuệ nhân tạo**: Tự động hóa việc tóm tắt nội dung workshop từ file PDF bằng AI để hỗ trợ sinh viên nắm bắt thông tin nhanh chóng [cite: User Prompt].

## Người dùng và nhu cầu
Hệ thống phục vụ ba nhóm đối tượng chính với các nhu cầu cốt lõi [cite: User Prompt, design(1).md]:
* **Sinh viên**: Cần xem lịch workshop, sơ đồ phòng và số chỗ thực tế [cite: User Prompt]. Nhu cầu quan trọng nhất là quy trình đăng ký nhanh chóng, mượt mà và nhận mã QR xác nhận ngay để check-in [cite: User Prompt].
* **Ban tổ chức (Admin)**: Cần công cụ quản lý workshop (tạo, sửa, hủy) và theo dõi thống kê đăng ký theo thời gian thực [cite: User Prompt]. Nhu cầu quan trọng là kiểm soát truy cập chặt chẽ (RBAC) và tự động hóa các tác vụ lặp lại như tóm tắt PDF [cite: User Prompt, design(1).md].
* **Nhân sự check-in**: Cần ứng dụng di động để quét mã QR tại cửa phòng [cite: User Prompt]. Điều quan trọng nhất là ứng dụng phải hoạt động được cả khi mất mạng (offline) và tự đồng bộ khi có kết nối trở lại [cite: User Prompt].

## Phạm vi
### Những gì thuộc phạm vi đồ án:
* Phát triển hệ thống Web App (cho Sinh viên và Admin) và Mobile App (cho Nhân sự check-in) [cite: design(1).md].
* Backend API hỗ trợ cơ chế Rate Limiting, Distributed Lock và Circuit Breaker [cite: design(1).md].
* Hệ thống Worker xử lý tác vụ bất đồng bộ: Gửi thông báo đa kênh, xử lý file PDF bằng AI và import dữ liệu sinh viên từ CSV [cite: design(1).md].
* Thiết kế cơ sở dữ liệu kết hợp PostgreSQL và Redis để tối ưu hiệu suất [cite: design(1).md].

### Những gì KHÔNG thuộc phạm vi:
* **Hạ tầng Production**: Không bao gồm việc thiết lập hạ tầng đám mây thực tế (Cloud/Kubernetes) hay các hệ thống Load Balancer vật lý; thay vào đó sẽ triển khai trên môi trường giả lập hoặc Local [cite: design(1).md].
* **Payment Gateway thực tế**: Các giao dịch thanh toán sẽ được thực hiện thông qua cơ chế Mock API (giả lập) của VNPay hoặc Stripe thay vì kết nối với cổng thanh toán tài chính thật [cite: design(1).md].
* **API hệ thống cũ**: Không xây dựng API cho Legacy SIS; việc tích hợp chỉ dừng lại ở việc đọc file CSV export hàng đêm [cite: User Prompt, design(1).md].

## Rủi ro và ràng buộc
Hệ thống phải đối mặt và giải quyết 5 rủi ro kỹ thuật trọng yếu [cite: User Prompt]:
1.  **Tranh chấp chỗ ngồi**: Nguy cơ overbooking khi nhiều người đăng ký cùng lúc tại thời điểm cận biên số lượng vé [cite: User Prompt].
2.  **Tải trọng đột biến**: 12.000 user truy cập đồng thời có thể gây sập hệ thống nếu không có cơ chế chặn spam và bảo vệ Backend [cite: User Prompt].
3.  **Thanh toán không ổn định**: Cổng thanh toán có thể gặp sự cố; hệ thống cần cơ chế Circuit Breaker để các chức năng khác vẫn hoạt động bình thường khi thanh toán bị lỗi [cite: User Prompt, design(1).md].
4.  **Check-in offline**: Khu vực trường học có mạng yếu yêu cầu dữ liệu check-in không được mất mát khi ứng dụng mất kết nối [cite: User Prompt].
5.  **Tích hợp một chiều**: Dữ liệu sinh viên chỉ được cập nhật qua CSV định kỳ, đòi hỏi quy trình import phải xử lý được file lỗi hoặc dữ liệu trùng lặp mà không làm gián đoạn hệ thống [cite: User Prompt].