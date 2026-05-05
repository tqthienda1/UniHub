# UniHub Workshop — Project Proposal

## Vấn đề

Trường ĐH A tổ chức **Tuần lễ kỹ năng và nghề nghiệp** hàng năm với 5 ngày, mỗi ngày 8–12 workshop song song tại nhiều phòng. Hiện tại hệ thống dùng Google Form + email thủ công, dẫn đến một loạt vấn đề kỹ thuật nghiêm trọng:

- **Race condition / double booking**: Google Form không xử lý concurrent registrations — nhiều sinh viên có thể đăng ký cùng lúc vào cùng 1 chỗ trống cuối cùng
- **Không scale**: Email thủ công không thể xử lý 12.000 sinh viên truy cập trong 10 phút đầu (60% dồn vào 3 phút đầu)
- **Thiếu check-in số hóa**: Nhân sự phải kiểm tra danh sách thủ công, không có cơ chế check-in khi mất mạng
- **Không có đồng bộ sinh viên tự động**: Dữ liệu sinh viên phải nhập tay từ hệ thống quản lý cũ của trường

## Mục tiêu

- Hỗ trợ **12.000 sinh viên đăng ký trong 10 phút đầu** mà không xảy ra double booking
- Đảm bảo **mỗi giao dịch thanh toán chỉ được thực hiện đúng 1 lần** (idempotency)
- Cho phép **check-in offline**, tự động sync khi có mạng trở lại
- Hệ thống thông báo **dễ mở rộng thêm kênh mới** (Telegram, Zalo…) mà không sửa core logic
- Tự động đồng bộ danh sách sinh viên từ hệ thống cũ qua CSV mỗi đêm

## Người dùng và nhu cầu

| Nhóm | Nhu cầu chính | Kênh |
|------|--------------|------|
| **Sinh viên** (~12.000) | Xem lịch workshop, đăng ký (free/paid), nhận QR, check-in tại cửa | Web App |
| **Ban tổ chức** | Tạo/sửa/hủy workshop, upload tài liệu PDF, xem thống kê đăng ký real-time | Web App (Admin Portal) |
| **Nhân sự check-in** | Quét QR tại cửa phòng, hoạt động được khi mất mạng | Mobile App (iOS/Android) |

## Phạm vi

**TRONG phạm vi:**
- Xem & đăng ký workshop (real-time seat count)
- Thông báo đa kênh (App notification + Email), mở rộng được
- Quản trị admin với RBAC 3 nhóm (STUDENT / ORGANIZER / CHECKIN_STAFF)
- Check-in offline với local queue + sync khi có mạng
- AI Summary từ PDF tài liệu workshop
- Đồng bộ CSV danh sách sinh viên từ hệ thống cũ mỗi đêm

**NGOÀI phạm vi:**
- Tích hợp payment gateway thật (dùng mock)
- Hạ tầng production (HA/clustering, load balancer)
- Tích hợp SSO / OAuth với hệ thống của trường
- Push notification native (chỉ in-app + email)

## Rủi ro và ràng buộc kỹ thuật đã biết

| Vấn đề | Mức độ | Giải pháp |
|--------|--------|-----------|
| Race condition khi đặt chỗ (12K concurrent) | 🔴 Cao | `SELECT ... FOR UPDATE` trong PostgreSQL transaction |
| Tải đột biến 12K users trong 10 phút | 🔴 Cao | Rate Limiting (Token Bucket, Redis) |
| Double charge khi client retry | 🔴 Cao | Idempotency Key (Redis, 24h TTL) |
| Payment gateway không ổn định | 🔴 Cao | Circuit Breaker 3 trạng thái (Redis state) |
| Check-in offline + sync | 🟡 Trung bình | SQLite local queue + `POST /checkins/sync` |
| Tích hợp Legacy System (không có API) | 🟡 Trung bình | Cron job 2AM đọc CSV file, batch upsert |

## Kiến trúc đề xuất

**Modular Monolith** — phù hợp với team đồ án 4 người, 5 tuần, đủ khả năng scale cho quy mô bài toán.

```
Backend:   NestJS (Node.js + TypeScript) — 7 module độc lập
Frontend:  React + TypeScript + Vite — Student Portal + Admin Dashboard  
Mobile:    React Native / Expo — Check-in app với offline support
Database:  PostgreSQL 15 (ACID) + Redis 7 (cache, queue, rate limit)
Queue:     BullMQ (chạy trong NestJS process)
Storage:   MinIO hoặc local /uploads
```

Xem chi tiết tại: [`design.md`](./design.md), [`c4-diagram.md`](./c4-diagram.md), [`architecture-diagram.md`](./architecture-diagram.md)
