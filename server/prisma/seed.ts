import 'dotenv/config';
import {
  PrismaClient,
  Role,
  WorkshopStatus,
  RegistrationStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding UniHub Workshop – Full Demo Data...');

  // ─── 1. CLEAR OLD DATA ───────────────────────────────────────────────────────
  console.log('🧹 Clearing old data...');
  await prisma.workshopCheckIn.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.workshopRegistration.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.studentIdentity.deleteMany();
  await prisma.user.deleteMany();

  // ─── 2. STUDENT IDENTITIES (CSV Sync source of truth) ────────────────────────
  console.log('📋 Creating Student Identities (CSV sync demo)...');
  const identityData = [
    { mssv: '21127001', email: 'student1@unihub.com', fullName: 'Nguyễn Văn A' },
    { mssv: '21127002', email: 'student2@unihub.com', fullName: 'Trần Thị B' },
    { mssv: '21127003', email: 'student3@unihub.com', fullName: 'Lê Văn C' },
    { mssv: '21127004', email: 'student4@unihub.com', fullName: 'Phạm Văn D' },
    { mssv: '21127005', email: 'student5@unihub.com', fullName: 'Hoàng Thị E' },
    { mssv: '21127006', email: 'student6@unihub.com', fullName: 'Đỗ Văn F' },
    // Student NOT in identity list → to demo rejection when trying to register
    // (no entry for student7 — account exists but MSSV not in CSV)
  ];
  for (const id of identityData) {
    await prisma.studentIdentity.create({ data: id });
  }

  // ─── 3. USERS ─────────────────────────────────────────────────────────────────
  console.log('👤 Creating Users...');
  const pw = await bcrypt.hash('123456', 10);

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@unihub.com',
      password: pw,
      fullName: 'Admin UniHub',
      role: Role.ADMIN,
    },
  });

  // Check-in Staff
  const staff = await prisma.user.create({
    data: {
      email: 'checkin@unihub.com',
      password: pw,
      fullName: 'Nhân viên Check-in',
      role: Role.CHECKIN_STAFF,
    },
  });

  // Students (verified — MSSV matches StudentIdentity)
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@unihub.com',
      password: pw,
      fullName: 'Nguyễn Văn A',
      mssv: '21127001',
      role: Role.STUDENT,
    },
  });
  const student2 = await prisma.user.create({
    data: {
      email: 'student2@unihub.com',
      password: pw,
      fullName: 'Trần Thị B',
      mssv: '21127002',
      role: Role.STUDENT,
    },
  });
  const student3 = await prisma.user.create({
    data: {
      email: 'student3@unihub.com',
      password: pw,
      fullName: 'Lê Văn C',
      mssv: '21127003',
      role: Role.STUDENT,
    },
  });
  const student4 = await prisma.user.create({
    data: {
      email: 'student4@unihub.com',
      password: pw,
      fullName: 'Phạm Văn D',
      mssv: '21127004',
      role: Role.STUDENT,
    },
  });

  // Student with MSSV NOT in identity list (to demo CSV rejection)
  const studentUnverified = await prisma.user.create({
    data: {
      email: 'ghost@unihub.com',
      password: pw,
      fullName: 'Sinh viên Không Tồn Tại',
      mssv: '99999999',
      role: Role.STUDENT,
    },
  });

  console.log(`
  ✅ Accounts (tất cả mật khẩu: 123456):
     Admin       → admin@unihub.com
     Check-in    → checkin@unihub.com
     Student 1   → student1@unihub.com  (MSSV 21127001, verified)
     Student 2   → student2@unihub.com  (MSSV 21127002, verified)
     Student 3   → student3@unihub.com  (MSSV 21127003, verified)
     Student 4   → student4@unihub.com  (MSSV 21127004, verified)
     Ghost       → ghost@unihub.com     (MSSV 99999999, NOT in CSV → đăng ký sẽ bị từ chối)
  `);

  // ─── 4. WORKSHOPS ─────────────────────────────────────────────────────────────
  console.log('🎤 Creating Workshops...');
  const now = new Date();
  const d = (days: number, hours = 0) =>
    new Date(now.getTime() + (days * 24 + hours) * 60 * 60 * 1000);

  // ── W1: FREE | Registration OPEN | Normal flow ────────────────────────────────
  const w1 = await prisma.workshop.create({
    data: {
      title: 'Tư duy phản biện trong kỷ nguyên AI',
      description:
        'Học cách tư duy và phân tích vấn đề khi AI đang thay đổi mọi thứ. Workshop cung cấp 3 phương pháp cốt lõi để không bị máy móc thay thế: Prompt Engineering, Fact-checking và Sensemaking.',
      category: 'Kỹ năng mềm',
      speakerName: 'Tiến sĩ Lê Khắc Hào',
      location: 'Cơ sở Nguyễn Văn Cừ',
      room: 'Giảng đường G1',
      startTime: d(2),
      endTime: d(2, 2),
      registrationOpenAt: d(-1),   // opened yesterday
      registrationCloseAt: d(1),   // closes tomorrow
      capacity: 100,
      availableSeats: 100,
      price: 0,
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        'Workshop tập trung rèn luyện tư duy phản biện — kỹ năng sinh tồn trong thời đại AI. Diễn giả chia sẻ cách đặt câu hỏi sắc bén cho AI (Prompt Engineering), phân biệt thông tin thật giả và giữ vững tư duy độc lập khi làm việc cùng máy móc.',
    },
  });

  // ── W2: PAID (50,000đ) | Registration OPEN | QR payment flow ─────────────────
  const w2 = await prisma.workshop.create({
    data: {
      title: 'Kỹ năng phỏng vấn IT thực chiến với doanh nghiệp',
      description:
        'Phỏng vấn thử trực tiếp với chuyên gia từ FPT Software, VNG, KMS Technology. Vòng kỹ thuật + vòng hành vi, nhận xét 1-1, sửa CV tại chỗ. Cơ hội nhận fast-track thực tập.',
      category: 'Nghề nghiệp',
      speakerName: 'Anh Nguyễn Duy Coder – Senior @ VNG',
      location: 'Cơ sở Linh Trung',
      room: 'Hội trường Trần Chí Đáo',
      startTime: d(5),
      endTime: d(5, 3),
      registrationOpenAt: d(-2),
      registrationCloseAt: d(3),
      capacity: 50,
      availableSeats: 50,
      price: 50000,
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        'Sự kiện mô phỏng quy trình phỏng vấn chuẩn tại các tập đoàn công nghệ lớn. Bao gồm Technical Interview (thuật toán, system design), Behavioral Interview (STAR method) và phiên review 1-1. Phù hợp với sinh viên năm 3-4 chuẩn bị đi thực tập hoặc đi làm.',
    },
  });

  // ── W3: PAID (100,000đ) | Registration OPEN | Nearly full (test race condition) ─
  const w3 = await prisma.workshop.create({
    data: {
      title: 'Hackathon AI mini: Xây sản phẩm trong 4 giờ',
      description:
        'Thách thức tốc độ: nhóm 2-3 người xây một mini-product dùng AI API (OpenAI / Gemini) trong 4 tiếng. Ban giám khảo từ các startup công nghệ. Giải thưởng: 1 triệu đồng tiền mặt cho nhóm thắng.',
      category: 'Chuyên môn',
      speakerName: 'Ban tổ chức UniHub × AI Club',
      location: 'Cơ sở Linh Trung',
      room: 'Phòng Lab B2.101',
      startTime: d(3),
      endTime: d(3, 4),
      registrationOpenAt: d(-3),
      registrationCloseAt: d(1),
      capacity: 10,   // purposely tiny → easy to test "Fully Booked"
      availableSeats: 10,
      price: 100000,
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        'Mini hackathon tập trung vào tốc độ prototyping với AI API. Mỗi đội có 4 tiếng để build và pitch sản phẩm. Không yêu cầu kinh nghiệm ML — chỉ cần biết gọi API và code nhanh. Phù hợp cho sinh viên muốn thử sức với startup-thinking.',
    },
  });

  // ── W4: FREE | Registration NOT YET OPEN (tomorrow) ──────────────────────────
  const w4 = await prisma.workshop.create({
    data: {
      title: 'Thiết kế hệ thống lớn (System Design) cho fresher',
      description:
        'Hướng dẫn thiết kế hệ thống chịu tải cao: load balancing, caching với Redis, message queue với Kafka, database sharding. Phân tích case-study Shopee ngày 11/11.',
      category: 'Chuyên môn',
      speakerName: 'Kỹ sư Giải pháp AWS – Anh Trần Minh',
      location: 'Cơ sở Linh Trung',
      room: 'Phòng B2.201',
      startTime: d(10),
      endTime: d(10, 4),
      registrationOpenAt: d(1),   // opens TOMORROW → shows "Opens" state
      registrationCloseAt: d(7),
      capacity: 200,
      availableSeats: 200,
      price: 0,
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        'Tổng quan kiến trúc Microservices và Serverless. Phân tích case-study thực tế về scale hệ thống triệu request/s. Nội dung: Load Balancing, Caching (Redis), Message Queue (Kafka), Database Sharding. Yêu cầu: đã biết cơ bản về CSDL và Mạng.',
    },
  });

  // ── W5: FREE | Registration CLOSED ───────────────────────────────────────────
  const w5 = await prisma.workshop.create({
    data: {
      title: 'Học máy ứng dụng: Từ lý thuyết đến sản phẩm thực tế',
      description:
        'Xây mô hình phân loại ảnh với PyTorch, deploy lên cloud trong 2 tiếng. Hands-on hoàn toàn, không slide dày.',
      category: 'Chuyên môn',
      speakerName: 'Chị Lê Minh Trang – ML Engineer @ Grab',
      location: 'Cơ sở Nguyễn Văn Cừ',
      room: 'Phòng F.102',
      startTime: d(7),
      endTime: d(7, 2),
      registrationOpenAt: d(-5),
      registrationCloseAt: d(-1),   // closed YESTERDAY → "Registration Closed"
      capacity: 60,
      availableSeats: 60,
      price: 0,
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        'Workshop thực hành xây model phân loại ảnh bằng PyTorch từ đầu đến deploy. Người học sẽ tự train model, evaluate và expose qua REST API trên cloud. Không cần GPU — dùng Google Colab miễn phí.',
    },
  });

  // ── W6: FREE | Workshop ENDED (past event, for check-in demo history) ────────
  const w6 = await prisma.workshop.create({
    data: {
      title: 'Git & GitHub nâng cao: Branching strategy cho team',
      description:
        'GitFlow, Trunk-Based Development, squash merge, rebase. Workshop dành cho các team đang gặp conflict và history lộn xộn.',
      category: 'Kỹ năng mềm',
      speakerName: 'Anh Vũ Hải Long – DevOps @ Tiki',
      location: 'Cơ sở Nguyễn Văn Cừ',
      room: 'Giảng đường G2',
      startTime: d(-1),
      endTime: d(-1, 2),
      registrationOpenAt: d(-7),
      registrationCloseAt: d(-2),
      capacity: 80,
      availableSeats: 76,
      price: 0,
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        'Hướng dẫn GitFlow và Trunk-Based Development cho team nhiều người. Bao gồm cách xử lý conflict, viết commit message chuẩn Conventional Commits và tự động hóa CI/CD với GitHub Actions.',
    },
  });

  // ── W7: PAID | DRAFT (admin only — not visible to students) ──────────────────
  const w7 = await prisma.workshop.create({
    data: {
      title: '[DRAFT] Workshop Kinh doanh & Khởi nghiệp cho sinh viên IT',
      description: 'Đang lên kế hoạch. Chưa công bố chính thức.',
      category: 'Khởi nghiệp',
      speakerName: 'Chưa xác nhận',
      location: 'Cơ sở Linh Trung',
      room: 'Phòng tổ chức',
      startTime: d(20),
      endTime: d(20, 3),
      registrationOpenAt: d(5),
      registrationCloseAt: d(15),
      capacity: 120,
      availableSeats: 120,
      price: 200000,
      status: WorkshopStatus.DRAFT,
    },
  });

  // ── W8: FREE | CANCELLED (test cancelled state) ───────────────────────────────
  const w8 = await prisma.workshop.create({
    data: {
      title: 'Bảo mật ứng dụng web (OWASP Top 10) – đã hủy',
      description: 'Workshop bị hủy do diễn giả có việc đột xuất.',
      category: 'Bảo mật',
      speakerName: 'Anh Cyber – Security @ Viettel',
      location: 'Cơ sở Linh Trung',
      room: 'Phòng B3.101',
      startTime: d(6),
      endTime: d(6, 2),
      registrationOpenAt: d(-1),
      registrationCloseAt: d(4),
      capacity: 100,
      availableSeats: 100,
      price: 0,
      status: WorkshopStatus.CANCELLED,
    },
  });

  console.log('✅ Created 8 workshops (Free, Paid, Draft, Cancelled, Ended, Various states)');

  // ─── 5. REGISTRATIONS ─────────────────────────────────────────────────────────
  console.log('📝 Creating Registrations...');

  // student1 đã đăng ký W1 (free, CONFIRMED) → demo registered state
  const reg1 = await prisma.workshopRegistration.create({
    data: {
      userId: student1.id,
      workshopId: w1.id,
      status: RegistrationStatus.CONFIRMED,
      qrToken: `QR-${student1.id}-${w1.id}`,
    },
  });
  await prisma.workshop.update({
    where: { id: w1.id },
    data: { availableSeats: { decrement: 1 } },
  });

  // student1 đã đăng ký W2 (paid, PENDING) → demo payment pending state
  const reg2 = await prisma.workshopRegistration.create({
    data: {
      userId: student1.id,
      workshopId: w2.id,
      status: RegistrationStatus.PENDING,
    },
  });
  await prisma.workshop.update({
    where: { id: w2.id },
    data: { availableSeats: { decrement: 1 } },
  });

  // student2 đã check-in W6 (ended, CHECKED_IN) → demo check-in history
  const reg3 = await prisma.workshopRegistration.create({
    data: {
      userId: student2.id,
      workshopId: w6.id,
      status: RegistrationStatus.CHECKED_IN,
      qrToken: `QR-${student2.id}-${w6.id}`,
    },
  });
  await prisma.workshopCheckIn.create({
    data: {
      registrationId: reg3.id,
      workshopId: w6.id,
      scannedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000), // 23h ago
    },
  });
  await prisma.workshop.update({
    where: { id: w6.id },
    data: { availableSeats: { decrement: 1 } },
  });

  // student3 đã đăng ký W6 (ended, CONFIRMED, NOT checked-in) → demo no-show
  const reg4 = await prisma.workshopRegistration.create({
    data: {
      userId: student3.id,
      workshopId: w6.id,
      status: RegistrationStatus.CONFIRMED,
      qrToken: `QR-${student3.id}-${w6.id}`,
    },
  });
  await prisma.workshop.update({
    where: { id: w6.id },
    data: { availableSeats: { decrement: 1 } },
  });

  // student4 đã huỷ đăng ký W1 → demo cancelled state
  await prisma.workshopRegistration.create({
    data: {
      userId: student4.id,
      workshopId: w1.id,
      status: RegistrationStatus.CANCELLED,
    },
  });

  // student2 đã đăng ký W3 (paid, CONFIRMED) → demo paid+confirmed state
  const reg5 = await prisma.workshopRegistration.create({
    data: {
      userId: student2.id,
      workshopId: w3.id,
      status: RegistrationStatus.CONFIRMED,
      qrToken: `QR-${student2.id}-${w3.id}`,
    },
  });
  await prisma.workshop.update({
    where: { id: w3.id },
    data: { availableSeats: { decrement: 1 } },
  });
  // Corresponding payment record
  await prisma.payment.create({
    data: {
      registrationId: reg5.id,
      amount: 100000,
      status: 'COMPLETED',
      transactionId: `TX-MOCK-${Date.now()}`,
    },
  });

  console.log('✅ Created registrations across all statuses (CONFIRMED, PENDING, CHECKED_IN, CANCELLED)');

  // ─── SUMMARY ──────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 SEED HOÀN TẤT – UniHub Workshop Demo Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 TÀI KHOẢN (mật khẩu: 123456)
   admin@unihub.com       → Admin (quản lý workshop, xem stats)
   checkin@unihub.com     → Check-in Staff (quét QR check-in)
   student1@unihub.com    → Sinh viên đã verified (MSSV 21127001)
   student2@unihub.com    → Sinh viên đã verified (MSSV 21127002)
   student3@unihub.com    → Sinh viên đã verified (MSSV 21127003)
   student4@unihub.com    → Sinh viên đã verified (MSSV 21127004)
   ghost@unihub.com       → Sinh viên KHÔNG có trong CSV (sẽ bị từ chối đăng ký)

🎤 WORKSHOPS
   W1 – Tư duy phản biện AI       FREE  | Đang mở đăng ký  | student1 đã đăng ký (CONFIRMED)
   W2 – Phỏng vấn IT thực chiến   50k   | Đang mở đăng ký  | student1 đang chờ thanh toán QR (PENDING)
   W3 – Hackathon AI mini          100k  | Đang mở đăng ký  | student2 đã thanh toán (CONFIRMED) | Chỉ 10 chỗ!
   W4 – System Design              FREE  | Chưa mở (ngày mai) | Test trạng thái "Chưa mở"
   W5 – Machine Learning           FREE  | Đã đóng đăng ký  | Test trạng thái "Closed"
   W6 – Git & GitHub nâng cao      FREE  | Đã kết thúc      | student2 đã CHECK-IN, student3 không đến
   W7 – [DRAFT] Khởi nghiệp IT    200k  | DRAFT (admin only) | Sinh viên không thấy
   W8 – Bảo mật web                FREE  | CANCELLED         | Workshop bị hủy

📋 LUỒNG TEST GỢI Ý
   🔐 Phân quyền:         Đăng nhập với admin/checkin/student xem quyền khác nhau
   💳 Thanh toán QR:      Đăng nhập student2, đăng ký W2, quét QR → CONFIRMED
   🚫 CSV rejection:      Đăng nhập ghost@unihub.com, thử đăng ký → bị từ chối
   📱 Check-in:           Đăng nhập checkin, quét QR của student1 cho W1
   🏁 Fully Booked:       Đăng ký W3 cho đến khi hết chỗ (10 chỗ)
   🎨 AI Summary:         Admin tạo workshop mới và upload PDF để test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
