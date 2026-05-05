# UniHub Workshop — Tài liệu Thiết kế Hệ thống

> **Phiên bản:** 1.0  
> **Môn học:** Thiết kế Phần mềm  
> **Ngày cập nhật:** 2026-05-05

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Các thành phần chính](#2-các-thành-phần-chính)
3. [Giao tiếp giữa các thành phần](#3-giao-tiếp-giữa-các-thành-phần)
4. [Phân tích Fault Isolation](#4-phân-tích-fault-isolation)
5. [Các cơ chế bảo vệ hệ thống](#5-các-cơ-chế-bảo-vệ-hệ-thống)
6. [Quyết định kiến trúc (ADR)](#6-quyết-định-kiến-trúc-adr)

---

## 1. Tổng quan kiến trúc

### 1.1 Phong cách kiến trúc: Modular Monolith

UniHub Workshop áp dụng kiến trúc **Modular Monolith** cho backend, kết hợp với **SPA** cho frontend web và **Native Mobile App** cho nghiệp vụ check-in.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      UniHub Workshop System                          │
│                                                                      │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────────────┐ │
│  │ Web App  │   │  Mobile App  │   │      Backend API (NestJS)    │ │
│  │  (React) │   │ (RN / Expo)  │   │                              │ │
│  └────┬─────┘   └──────┬───────┘   │  ┌──────────┬─────────────┐ │ │
│       │                │           │  │   Auth   │  Workshop   │ │ │
│       └──────REST──────┘           │  │  Module  │   Module    │ │ │
│                │                   │  ├──────────┼─────────────┤ │ │
│                └────────REST───────▶  │ Payment  │   Checkin   │ │ │
│                                    │  │  Module  │   Module    │ │ │
│                                    │  ├──────────┼─────────────┤ │ │
│                                    │  │  Notif.  │     AI      │ │ │
│                                    │  │  Module  │   Module    │ │ │
│                                    │  ├──────────┼─────────────┤ │ │
│                                    │  │   CSV    │   Users     │ │ │
│                                    │  │   Sync   │   Module    │ │ │
│                                    │  └──────────┴─────────────┘ │ │
│                                    └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Lý do lựa chọn Modular Monolith:**

| Tiêu chí | Microservices | Modular Monolith | Lý do chọn MM |
|----------|:---:|:---:|---|
| Độ phức tạp triển khai | 🔴 Cao | 🟢 Thấp | Team đồ án 4 người, 5 tuần |
| Debug & trace | 🔴 Khó | 🟢 Dễ | Single process, single log stream |
| Module isolation | 🟡 Tốt | 🟡 Tốt | Có thể tách microservice sau |
| Giao tiếp nội bộ | 🔴 Network hop | 🟢 In-process | Không có network latency giữa modules |
| Scale | 🟢 Per-service | 🟡 Toàn bộ | Quy mô bài toán không cần per-service scale |

---

## 2. Các thành phần chính

### 2.1 Client Layer

#### Web App (React + TypeScript + Vite)
- **Vai trò:** Giao diện cho sinh viên xem/đăng ký workshop và giao diện admin cho ban tổ chức
- **Hai portal:**
  - **Student Portal** — Xem lịch, đăng ký, xem QR, lịch sử đăng ký
  - **Admin Dashboard** — Tạo/sửa/hủy workshop, xem thống kê, upload PDF
- **Kết nối:** REST API calls đến Backend API (port 3000)
- **Auth:** Lưu JWT trong `httpOnly cookie` hoặc `localStorage`, tự động attach vào mỗi request

#### Mobile App (React Native / Expo)
- **Vai trò:** Dành riêng cho **nhân sự check-in** tại cửa phòng workshop
- **Tính năng offline:** Lưu check-in vào SQLite local khi mất mạng, tự động sync khi có mạng
- **QR Scanning:** Dùng `expo-barcode-scanner` hoặc `react-native-camera`
- **Connectivity Detection:** `@react-native-community/netinfo` để phát hiện mất/có mạng

### 2.2 Backend Layer — Modular Monolith (NestJS)

Backend chạy như một single process nhưng được tổ chức thành các module độc lập:

| Module | Trách nhiệm | Dependency nội bộ |
|--------|-------------|-------------------|
| **AuthModule** | Đăng nhập, sinh/verify JWT, refresh token | UsersModule |
| **UsersModule** | CRUD user, quản lý role (STUDENT / ORGANIZER / CHECKIN_STAFF) | — |
| **WorkshopModule** | CRUD workshop, quản lý capacity, upload PDF | UsersModule, AiModule |
| **RegistrationModule** | Đăng ký chỗ ngồi, chống race condition, sinh QR code | WorkshopModule, PaymentModule, NotificationModule |
| **PaymentModule** | Tích hợp Payment Gateway, Circuit Breaker, Idempotency | — |
| **CheckinModule** | Scan QR online, nhận batch sync từ mobile offline | RegistrationModule |
| **NotificationModule** | Email + App notification qua Strategy Pattern | — |
| **AiModule** | Parse PDF, gọi OpenAI/Gemini API, lưu summary | — |
| **CsvSyncModule** | Cron job 2AM, import sinh viên từ CSV, ghi audit log | UsersModule |

### 2.3 Data Layer

#### PostgreSQL (Port 5432)
- **Vai trò:** Lưu trữ dữ liệu chính với ACID guarantees
- **Tables chính:** `users`, `workshops`, `registrations`, `payments`, `checkins`, `student_sync_logs`
- **Lý do chọn:** Cần transactions mạnh để xử lý race condition khi đặt chỗ (SELECT FOR UPDATE)

#### Redis (Port 6379)
- **Vai trò đa năng:**
  - **Cache:** Số chỗ còn lại của từng workshop (`seat_count:{workshop_id}`)
  - **Rate Limit:** Token bucket counter per user/IP
  - **Idempotency Store:** Lưu kết quả payment 24 giờ
  - **Job Queue:** BullMQ jobs cho notification, CSV import, AI processing
  - **Circuit Breaker State:** Trạng thái CLOSED/OPEN/HALF-OPEN của Payment GW

#### File Storage (MinIO hoặc Local `/uploads`)
- **Vai trò:** Lưu file PDF upload từ ban tổ chức
- **MinIO:** S3-compatible, dùng cho production hoặc staging
- **Local FS:** Dùng khi demo/development

### 2.4 External Services

| Service | Vai trò | Resilience Pattern |
|---------|---------|-------------------|
| **Payment Gateway** (VNPay/Stripe mock) | Xử lý thanh toán workshop có phí | Circuit Breaker (3 states) |
| **AI API** (OpenAI / Google Gemini) | Tạo tóm tắt từ nội dung PDF workshop | Retry với exponential backoff |
| **Email SMTP** (SendGrid / Nodemailer) | Gửi email xác nhận đăng ký, nhắc lịch | Async job queue (BullMQ) |
| **Legacy Student System** | Xuất CSV danh sách sinh viên mỗi đêm | Cron job 1 chiều (không có API) |

---

## 3. Giao tiếp giữa các thành phần

### 3.1 Bản đồ giao tiếp tổng thể

```
┌──────────────┐         REST / HTTPS         ┌──────────────────────┐
│  Web App     │ ─────────────────────────────▶│                      │
│  (React)     │                               │   Backend API        │
└──────────────┘                               │   (NestJS :3000)     │
                                               │                      │
┌──────────────┐         REST / HTTPS         │                      │
│  Mobile App  │ ─────────────────────────────▶│                      │
│  (RN/Expo)   │                               └──────────┬───────────┘
└──────────────┘                                          │
        │                             ┌────────────────────┼─────────────────────┐
        │ SQLite (local)              │                    │                     │
        ▼                             ▼                    ▼                     ▼
┌──────────────┐            ┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│ Local SQLite │            │  PostgreSQL  │    │    Redis     │    │ File Storage  │
│ (pending     │            │  (Port 5432) │    │  (Port 6379) │    │  (MinIO/Local)│
│  checkins)   │            └──────────────┘    └──────────────┘    └───────────────┘
└──────────────┘
                                               ┌─────────────────────────────────────┐
                                               │         External Services            │
                                               │  ┌────────────┐  ┌───────────────┐  │
                                               │  │ Payment GW │  │ AI API        │  │
                                               │  │(VNPay mock)│  │(OpenAI/Gemini)│  │
                                               │  └────────────┘  └───────────────┘  │
                                               │  ┌────────────┐  ┌───────────────┐  │
                                               │  │ Email SMTP │  │ Legacy CSV    │  │
                                               │  │(SendGrid)  │  │ File System   │  │
                                               │  └────────────┘  └───────────────┘  │
                                               └─────────────────────────────────────┘
```

### 3.2 Các pattern giao tiếp

| Kết nối | Protocol | Pattern | Lý do |
|---------|----------|---------|-------|
| Client ↔ Backend | REST/HTTPS | Request-Response | Đơn giản, dễ debug, stateless |
| Backend → PostgreSQL | TCP (pg driver) | Synchronous, transactional | Cần ACID, SELECT FOR UPDATE |
| Backend → Redis | TCP (ioredis) | Synchronous (cache/rate) / Async (queue) | In-memory, atomic ops |
| Backend → Payment GW | HTTPS | Synchronous + Circuit Breaker | Cần biết kết quả ngay |
| Backend → AI API | HTTPS | Async (BullMQ job) | Có thể mất vài giây, không block request |
| Backend → Email | SMTP/HTTPS | Async (BullMQ job) | Không cần block user request |
| Cron → CSV File | File I/O | Scheduled (2AM) | Legacy system không có API |
| Mobile → SQLite | Local I/O | Synchronous | Offline, không cần network |
| Mobile → Backend | REST/HTTPS | Batch sync (POST /checkins/sync) | Gom nhiều offline records |

### 3.3 Luồng đăng ký workshop (Registration Flow)

```
Client ──POST /registrations──▶ [Rate Limit Guard]
                                        │ 429 nếu vượt quota
                                        ▼
                               [JWT Auth Guard]
                                        │ 401 nếu token invalid
                                        ▼
                               [Idempotency Check → Redis]
                                        │ Trả kết quả cũ nếu đã xử lý
                                        ▼
                               [DB Transaction → PostgreSQL]
                                 SELECT seat FOR UPDATE
                                        │ 409 nếu hết chỗ
                                        ▼
                               [INSERT registration PENDING]
                               [COMMIT]
                                        │
                                        ▼
                               [Circuit Breaker → Payment GW]
                                        │ Lỗi graceful nếu GW down
                                        ▼
                               [UPDATE registration CONFIRMED]
                               [Generate QR Code]
                               [Enqueue Notification Job → Redis/BullMQ]
                                        │
                                        ▼
                               [SET idempotency:{key} → Redis]
                                        │
                                        ▼
Client ◀──200 OK + QR Code─────────────┘
```

---

## 4. Phân tích Fault Isolation

### 4.1 Câu hỏi: Khi một phần gặp sự cố, phần còn lại bị ảnh hưởng ra sao?

#### Kịch bản 1: Payment Gateway bị down

| Thành phần | Tình trạng | Ghi chú |
|-----------|-----------|---------|
| Xem danh sách workshop | ✅ Hoạt động bình thường | Không dùng Payment GW |
| Đăng ký workshop **miễn phí** | ✅ Hoạt động bình thường | Không qua Payment GW |
| Đăng ký workshop **có phí** | ⚠️ Trả lỗi rõ ràng | Circuit Breaker OPEN → `503` kèm message thân thiện |
| Check-in | ✅ Hoạt động bình thường | Không liên quan |
| Admin dashboard | ✅ Hoạt động bình thường | Không liên quan |
| **Cơ chế:** | Circuit Breaker tự động | Sau 30s → thử HALF-OPEN → tự phục hồi |

#### Kịch bản 2: Redis bị down

| Thành phần | Tình trạng | Ghi chú |
|-----------|-----------|---------|
| Rate Limiting | ❌ Bypass hoặc fail-open | Có thể cấu hình fail-open để không block users |
| Idempotency Check | ❌ Không hoạt động | Nguy cơ double charge → cần log cảnh báo |
| BullMQ Job Queue | ❌ Jobs không enqueue được | Notification, AI sẽ bị trễ |
| Seat count cache | ⚠️ Fallback về PostgreSQL | Tăng tải DB nhưng vẫn đúng |
| Đọc dữ liệu workshop | ✅ Hoạt động (từ PostgreSQL) | Redis chỉ là cache |
| **Ưu tiên:** | Redis là critical dependency | Nên dùng Redis Sentinel hoặc cluster trong production |

#### Kịch bản 3: PostgreSQL bị down

| Thành phần | Tình trạng | Ghi chú |
|-----------|-----------|---------|
| **Toàn bộ hệ thống** | ❌ Không hoạt động | PostgreSQL là Single Point of Failure |
| Check-in offline (mobile) | ✅ Vẫn ghi local SQLite | Sync sau khi DB phục hồi |
| **Mitigation:** | Regular backup | Cần replica read trong production |

#### Kịch bản 4: AI API bị down

| Thành phần | Tình trạng | Ghi chú |
|-----------|-----------|---------|
| Xem, đăng ký, check-in | ✅ Hoạt động bình thường | Không liên quan đến AI |
| Upload PDF → Tạo summary | ❌ Job fail | Job nằm trong BullMQ, retry tự động |
| **Cơ chế:** | BullMQ retry | Job retry 3 lần với backoff, sau đó vào failed queue |

#### Kịch bản 5: Mobile App mất mạng khi đang check-in

| Thành phần | Tình trạng | Ghi chú |
|-----------|-----------|---------|
| Scan QR | ✅ Hoạt động (offline) | JWT token verify bằng chữ ký, không cần network |
| Ghi nhận check-in | ✅ Lưu vào SQLite local | Hiển thị "Đã ghi nhận (chờ đồng bộ)" |
| Sync lên server | ⏳ Chờ có mạng | Tự động sync khi phát hiện connectivity restored |
| Xem danh sách check-in | ⚠️ Chỉ xem local records | Không đồng bộ real-time |

### 4.2 Ma trận phụ thuộc

```
                    PostgreSQL  Redis  Payment GW  AI API  Email SMTP
                    ──────────  ─────  ──────────  ──────  ──────────
Xem workshop           CRIT      OPT       —         —         —
Đăng ký (free)         CRIT      CRIT      —         —        OPT
Đăng ký (paid)         CRIT      CRIT     CRIT       —        OPT
Check-in (online)      CRIT      OPT       —         —         —
Check-in (offline)      —         —        —         —         —
AI Summary             CRIT      OPT       —        CRIT       —
CSV Import             CRIT      OPT       —         —         —
Notification           CRIT      CRIT      —         —        CRIT

CRIT = Critical (hệ thống không thể hoạt động nếu thiếu)
OPT  = Optional (giảm chức năng nhưng không crash)
—    = Không phụ thuộc
```

---

## 5. Các cơ chế bảo vệ hệ thống

### 5.1 Rate Limiting — Token Bucket (Redis)

**Mục tiêu:** Kiểm soát 12.000 sinh viên đồng thời truy cập trong 10 phút.

```
Cấu hình mặc định (per user):
  Bucket size:  10 tokens
  Refill rate:  2 tokens/giây

Cấu hình endpoint đăng ký (nhạy cảm):
  Bucket size:  3 tokens
  Refill rate:  1 token/5 giây

Redis Key: rate_limit:{user_id}:{window}
           → INCR + EXPIRE (atomic)
```

**Tại sao Token Bucket?**
- Cho phép burst ngắn (10 request đầu pass ngay) → UX mượt hơn Fixed Window
- Refill rate kiểm soát tần suất tối đa dài hạn → bảo vệ backend
- Atomic INCR trong Redis → không có race condition trên counter

### 5.2 Circuit Breaker — Payment Gateway

**Mục tiêu:** Lỗi payment không kéo sập toàn hệ thống.

```
Trạng thái CLOSED (bình thường):
  → Forward request đến Payment GW
  → Đếm lỗi liên tiếp

Trigger OPEN: ≥ 5 lỗi liên tiếp HOẶC error rate > 50%/phút
Trạng thái OPEN (đang lỗi):
  → Reject ngay lập tức, không gọi GW
  → Trả "Thanh toán tạm thời không khả dụng"
  → Giữ OPEN 30 giây

Trạng thái HALF-OPEN (thử nghiệm):
  → Sau 30s, cho 1 request đi qua
  → Thành công → CLOSED
  → Thất bại → OPEN thêm 30s

Lưu state: Redis key circuit_breaker:payment
```

### 5.3 Idempotency Key — Chống trừ tiền hai lần

**Mục tiêu:** Client retry không gây double charge.

```
Client: sinh UUID khi user bấm "Thanh toán"
        Header: X-Idempotency-Key: {uuid}
        Dùng LẠI key này khi retry

Server: 1. GET idempotency:{key} từ Redis
        2. Nếu tồn tại → trả kết quả cũ ngay
        3. Nếu chưa có → xử lý payment
        4. SET idempotency:{key} {result} EX 86400 (24h)

Retry policy:
  Chỉ retry khi network error (không có response)
  KHÔNG retry khi 4xx
  Tối đa 3 lần với exponential backoff: 1s → 2s → 4s
```

### 5.4 Offline Check-in — SQLite Local Queue

**Mục tiêu:** Check-in vẫn hoạt động khi mất mạng.

```
QR Token = JWT signed by server
  → Mobile app verify chữ ký offline (không cần network)
  → Phát hiện QR hợp lệ/không hợp lệ mà không cần gọi API

Offline flow:
  1. Scan QR → verify JWT locally
  2. INSERT pending_checkins (SQLite)
  3. UI: "✓ Đã ghi nhận (chờ đồng bộ)"

Sync flow (khi có mạng):
  1. NetInfo phát hiện connectivity restored
  2. POST /checkins/sync với list pending_checkins
  3. Server: INSERT ... ON CONFLICT DO NOTHING (idempotent)
  4. App xóa local records đã confirm
```

---

## 6. Quyết định kiến trúc (ADR)

### ADR-001: Modular Monolith thay vì Microservices

**Context:** Team 4 người, 5 tuần, quy mô 12K users.  
**Decision:** Chọn Modular Monolith.  
**Consequences:**
- ✅ Single deployment, single log stream, dễ debug
- ✅ Không cần service discovery, không network hop nội bộ
- ✅ Có thể tách microservice sau nếu cần scale
- ❌ Scale toàn bộ thay vì per-service

### ADR-002: PostgreSQL + Redis thay vì một DB duy nhất

**Context:** Cần ACID cho transactions và in-memory speed cho rate limit/cache.  
**Decision:** PostgreSQL cho persistent data, Redis cho ephemeral/fast data.  
**Consequences:**
- ✅ SELECT FOR UPDATE để chống race condition khi đặt chỗ
- ✅ Atomic INCR/DECR trong Redis cho seat count, rate limit
- ❌ Thêm một infrastructure component (Redis)

### ADR-003: BullMQ thay vì gọi trực tiếp (Notification, AI, CSV)

**Context:** Notification/AI/CSV có thể mất vài giây, không nên block request.  
**Decision:** Enqueue vào BullMQ, worker xử lý async.  
**Consequences:**
- ✅ Request của user trả về nhanh
- ✅ Retry tự động khi worker fail
- ✅ Có thể monitor queue qua Bull Board
- ❌ Notification/AI/CSV không synchronous (có độ trễ)

### ADR-004: JWT signed QR cho phép verify offline

**Context:** Check-in nhân sự cần hoạt động khi mất mạng.  
**Decision:** QR code là JWT được ký bởi server, mobile app có public key để verify.  
**Consequences:**
- ✅ Verify QR không cần gọi API
- ✅ Token có expiry → QR tự hết hạn sau sự kiện
- ❌ Không thể revoke QR ngay lập tức (cần đợi expiry)

### ADR-005: CSV Import một chiều (không có API từ Legacy System)

**Context:** Hệ thống sinh viên cũ không có API, chỉ export CSV hàng đêm.  
**Decision:** Cron job 2AM đọc file CSV, batch upsert vào PostgreSQL.  
**Consequences:**
- ✅ Không cần sửa Legacy System
- ✅ Upsert idempotent (chạy lại an toàn)
- ❌ Dữ liệu sinh viên trễ tối đa 24 giờ
- ❌ Phụ thuộc vào việc file CSV được đặt đúng chỗ

---

*Tài liệu này đồng hành cùng: `2-c4-diagram.md` và `3-architecture-diagram.md`*
