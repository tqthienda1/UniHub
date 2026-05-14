# UniHub – Workshop Management Platform

Hệ thống quản lý workshop dành cho sinh viên đại học, bao gồm:

- **Server** – REST API & WebSocket (NestJS + PostgreSQL + Redis)
- **Client** – Giao diện web quản trị & sinh viên (React + Vite)
- **Mobile** – Ứng dụng check-in dành cho nhân viên (React Native + Expo)

---

## Mục lục

1. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
2. [Yêu cầu môi trường](#yêu-cầu-môi-trường)
3. [Cài đặt nhanh (Quick Start)](#cài-đặt-nhanh-quick-start)
4. [Server](#server)
5. [Client (Web)](#client-web)
6. [Mobile (Expo)](#mobile-expo)
7. [Tài khoản demo](#tài-khoản-demo)
8. [Luồng kiểm thử gợi ý](#luồng-kiểm-thử-gợi-ý)

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                        UniHub                           │
│                                                         │
│   [Client - React/Vite]    [Mobile - Expo]              │
│         :5173                 Expo Go app               │
│            │                     │                      │
│            └──────────┬──────────┘                      │
│                       ▼                                 │
│           [Server - NestJS :3000]                       │
│                  │         │                            │
│           [PostgreSQL]  [Redis :6379]                   │
│           (Supabase)    (local)                         │
└─────────────────────────────────────────────────────────┘
```

| Thành phần | Công nghệ | Port mặc định |
|---|---|---|
| Server | NestJS, Prisma, Socket.IO | `3000` |
| Client | React 19, Vite, TailwindCSS | `5173` |
| Mobile | React Native, Expo SDK 54 | Expo Go |
| Database | PostgreSQL (Supabase – đã cấu hình sẵn) | – |
| Queue / Cache | Redis | `6379` |

---

## Yêu cầu môi trường

### Bắt buộc

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| **Node.js** | 20.x trở lên | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x trở lên | Đi kèm Node.js |
| **Redis** | 7.x | Cần chạy local (xem hướng dẫn bên dưới) |
| **Git** | Bất kỳ | Để clone repository |

### Chỉ cho Mobile

| Công cụ | Ghi chú |
|---|---|
| **Expo Go** | Cài trên điện thoại iOS/Android ([expo.dev/go](https://expo.dev/go)) |
| **Máy tính và điện thoại phải cùng mạng LAN/WiFi** | Điện thoại kết nối đến server qua IP cục bộ |

> **Không cần** cài PostgreSQL riêng. Database đã được cấu hình sẵn trên Supabase (cloud) – chỉ cần kết nối internet.

---

## Cài đặt nhanh (Quick Start)

### Bước 1 – Clone repository

```bash
git clone https://github.com/<your-org>/UniHub.git
cd UniHub
```

### Bước 2 – Khởi động Redis

Redis là bắt buộc để server khởi động. Chọn một trong hai cách:

**Cách A – Docker (khuyến nghị):**
```bash
docker run -d --name unihub-redis -p 6379:6379 redis:7-alpine
```

**Cách B – Windows (không có Docker):**

1. Tải Redis for Windows tại: https://github.com/microsoftarchive/redis/releases
2. Giải nén và chạy `redis-server.exe`
3. Mặc định Redis lắng nghe `localhost:6379`

### Bước 3 – Chạy Server

```bash
cd server
npm install
npm run start:dev
```

Server khởi động tại `http://localhost:3000`.

### Bước 4 – Chạy Client (Web)

Mở terminal mới:

```bash
cd client
npm install
npm run dev
```

Truy cập tại `http://localhost:5173`.

### Bước 5 – Chạy Mobile (tuỳ chọn)

Mở terminal mới:

```bash
cd mobile
npm install
npx expo start
```

Quét QR bằng **Expo Go** trên điện thoại.

---

## Server

### Cấu trúc thư mục

```
server/
├── prisma/
│   ├── schema.prisma     # Định nghĩa database schema
│   └── seed.ts           # Dữ liệu mẫu
├── src/
│   ├── auth/             # Xác thực JWT
│   ├── workshops/        # Quản lý workshop, đăng ký, check-in, QR
│   ├── payments/         # Xử lý thanh toán
│   ├── notifications/    # WebSocket real-time
│   ├── sync/             # Đồng bộ danh sách sinh viên (CSV)
│   ├── redis/            # Hàng đợi & cache
│   └── users/            # Quản lý người dùng
├── .env                  # Biến môi trường (đã cấu hình sẵn)
└── package.json
```

### Biến môi trường (`.env`)

File `.env` đã được cấu hình sẵn trong repository và sẵn sàng sử dụng:

```env
DATABASE_URL="postgresql://postgres.mrtmpthtbovxfgkbamut:jJIZOfS048h0tPDd@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
GEMINI_API_KEY="AIzaSyB9D9buov9CENHGWVbHfWkIMPtBMXL-GPo"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aloxezthien2005@gmail.com
SMTP_PASS=uoth mtby zheq ohey
SMTP_FROM="UniHub" <no-reply@unihub.com>

# Set to true to simulate payment gateway timeout (for testing idempotency & non-blocking features)
SIMULATE_PAYMENT_TIMEOUT=false
```

> Nếu Redis chạy trên host/port khác, thêm `REDIS_HOST` và `REDIS_PORT` vào file `.env`.

### Lệnh chạy

```bash
# Cài dependencies
npm install

# Chạy development (hot-reload)
npm run start:dev

# Chạy production
npm run build
npm run start:prod
```

### Prisma & Database

Database đã được migrate sẵn trên Supabase. Để **seed dữ liệu mẫu** (reset toàn bộ data và tạo lại):

```bash
cd server
npx prisma db seed
```

> ⚠️ Lệnh seed sẽ **xóa toàn bộ dữ liệu cũ** và tạo lại dữ liệu mẫu. Chỉ chạy khi cần reset.

Nếu cần apply migration mới (thay đổi schema):

```bash
npx prisma migrate deploy
npx prisma generate
```

---

## Client (Web)

### Cấu trúc thư mục

```
client/
├── src/
│   ├── pages/            # Các trang chính
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── StudentWorkshopsPage.tsx
│   │   ├── AdminWorkshopsPage.tsx
│   │   ├── AdminWorkshopDetail.tsx
│   │   ├── AdminStudentsPage.tsx
│   │   ├── MyRegistrationsPage.tsx
│   │   └── CheckInPage.tsx
│   ├── workshops/        # Chi tiết workshop
│   ├── components/       # Layout, form, modal
│   └── context/          # AuthContext, NotificationContext
└── package.json
```

### Cài đặt và chạy

```bash
cd client
npm install
npm run dev
```

Truy cập tại: **http://localhost:5173**

### Lưu ý cấu hình

Client đang sử dụng `http://localhost:3000` làm địa chỉ API. **Đây là mặc định đúng** khi chạy server và client trên cùng một máy.

Nếu server chạy trên máy khác, cần thay tất cả `http://localhost:3000` trong thư mục `client/src/` thành địa chỉ IP của máy server.

---

## Mobile (Expo)

Ứng dụng mobile dành cho **nhân viên check-in** – quét QR code để check-in sinh viên tại workshop.

### Cài đặt

```bash
cd mobile
npm install
```

### Cấu hình địa chỉ server

Ứng dụng mobile cần biết địa chỉ IP của server để kết nối (vì chạy trên thiết bị vật lý, không thể dùng `localhost`).

**Tìm IP của máy đang chạy server:**

```bash
# Windows
ipconfig
# → Tìm "IPv4 Address" trong mục WiFi/Ethernet, ví dụ: 192.168.1.100
```

**Cập nhật file `mobile/.env`:**

```env
API_URL=http://<IP_MÁY_CHẠY_SERVER>:3000
```

Ví dụ:
```env
API_URL=http://192.168.1.100:3000
```

> Máy tính chạy server và điện thoại chạy Expo Go **phải cùng mạng WiFi**.

### Chạy ứng dụng

```bash
cd mobile
npx expo start
```

Lệnh này sẽ hiển thị QR code trong terminal. Mở **Expo Go** trên điện thoại và quét QR để chạy ứng dụng.

```bash
# Hoặc chỉ định nền tảng cụ thể
npx expo start --android
npx expo start --ios
```

### Quyền truy cập Camera

Ứng dụng sử dụng camera để quét QR. Khi ứng dụng khởi động, Expo Go sẽ yêu cầu quyền truy cập camera – hãy cho phép.

---

## Tài khoản demo

Sau khi seed database (`npx prisma db seed`), các tài khoản sau đã được tạo sẵn:

> **Mật khẩu tất cả tài khoản: `123456`**

| Email | Vai trò | Ghi chú |
|---|---|---|
| `admin@unihub.com` | Admin | Quản lý workshop, xem thống kê, upload PDF AI summary |
| `checkin@unihub.com` | Check-in Staff | Truy cập giao diện check-in, quét QR trên web và mobile |
| `student1@unihub.com` | Sinh viên | MSSV 21127001 – đã verified, có đăng ký workshop |
| `student2@unihub.com` | Sinh viên | MSSV 21127002 – đã verified, đã check-in W6 |
| `student3@unihub.com` | Sinh viên | MSSV 21127003 – đã verified |
| `student4@unihub.com` | Sinh viên | MSSV 21127004 – đã verified |
| `ghost@unihub.com` | Sinh viên | MSSV 99999999 – **không có trong danh sách CSV** → bị từ chối khi đăng ký |

### Trạng thái workshop mẫu

| Workshop | Giá | Trạng thái | Ghi chú |
|---|---|---|---|
| Tư duy phản biện AI | FREE | Đang mở đăng ký | student1 đã CONFIRMED |
| Phỏng vấn IT thực chiến | 50.000đ | Đang mở đăng ký | student1 đang PENDING (chờ thanh toán) |
| Hackathon AI mini | 100.000đ | Đang mở đăng ký | Chỉ 10 chỗ – dễ test fully booked |
| System Design | FREE | Chưa mở đăng ký | Mở vào ngày mai |
| Machine Learning | FREE | Đã đóng đăng ký | Hết hạn đăng ký |
| Git & GitHub nâng cao | FREE | Đã kết thúc | student2 đã CHECK-IN |
| [DRAFT] Khởi nghiệp IT | 200.000đ | DRAFT | Chỉ admin thấy |
| Bảo mật web (OWASP) | FREE | CANCELLED | Workshop bị huỷ |

---

## Luồng kiểm thử gợi ý

### 1. Phân quyền vai trò
- Đăng nhập lần lượt với `admin`, `checkin`, `student1`
- Admin thấy toàn bộ workshop kể cả DRAFT
- Sinh viên chỉ thấy workshop PUBLISHED

### 2. Đăng ký workshop FREE
- Đăng nhập `student2@unihub.com`
- Vào workshop "Tư duy phản biện AI" → Đăng ký → CONFIRMED ngay

### 3. Thanh toán QR (workshop có phí)
- Đăng nhập `student1@unihub.com`
- Vào workshop "Phỏng vấn IT thực chiến" (đang ở trạng thái PENDING)
- Hoàn tất thanh toán → trạng thái chuyển CONFIRMED + nhận QR code

### 4. Từ chối CSV
- Đăng nhập `ghost@unihub.com` (MSSV 99999999)
- Thử đăng ký bất kỳ workshop nào → hệ thống từ chối vì MSSV không có trong danh sách

### 5. Check-in qua Web
- Đăng nhập `checkin@unihub.com`
- Vào trang Check-in của workshop "Tư duy phản biện AI"
- Nhập QR token của student1 để check-in

### 6. Check-in qua Mobile
- Chạy app mobile, đăng nhập `checkin@unihub.com`
- Chọn workshop → Quét QR của sinh viên bằng camera

### 7. Fully Booked (race condition)
- Workshop "Hackathon AI mini" chỉ còn tối đa 10 chỗ
- Dùng nhiều tài khoản đăng ký cùng lúc để test concurrency

### 8. AI Summary (tóm tắt workshop bằng Gemini AI)
- Đăng nhập `admin@unihub.com`
- Tạo workshop mới → Upload file PDF
- Hệ thống tự động tạo `aiSummary` bằng Gemini

### 9. Đồng bộ danh sách sinh viên (CSV)
- Đăng nhập `admin@unihub.com`
- Vào trang "Quản lý sinh viên" → Upload file CSV
- Hệ thống cập nhật `StudentIdentity` và đồng bộ trạng thái verified

### 10. Real-time Notifications (WebSocket)
- Đăng nhập trên hai cửa sổ browser cùng lúc
- Thực hiện hành động (đăng ký, huỷ) → thông báo realtime xuất hiện ở cửa sổ còn lại

---

## Ghi chú kỹ thuật

- **Database**: Supabase PostgreSQL (đã có sẵn data sau khi seed). Connection pooling qua PgBouncer được cấu hình trong `DATABASE_URL`.
- **Redis**: Dùng cho Bull Queue (xử lý email, thanh toán bất đồng bộ) và cache. Phải chạy trước khi start server.
- **JWT**: Secret mặc định là `secretKey` – đủ để test, không dùng trong production.
- **CORS**: Server đã bật CORS cho tất cả origins – phù hợp cho môi trường development.
- **Rate Limiting**: Server giới hạn 100 requests/60 giây mỗi IP.
- **Cleartext traffic (Android)**: `app.json` đã bật `usesCleartextTraffic: true` để app mobile có thể kết nối HTTP đến server local.
