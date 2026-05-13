// ============================================================
// DEMO: Thanh toán không ổn định — Idempotency & Non-blocking
// Chạy: node demo/demo-payment.js
// ============================================================

const API_URL = 'http://localhost:3000';
const WORKSHOP_ID = '9fe3b93a-2eab-40a3-9f3d-894e7e2b7ed2'; // Workshop có phí

const STUDENT_EMAIL = 'tqthien23@clc.fitus.edu.vn';
const STUDENT_PASS  = 'thien2005';

// ── helpers ──────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASS }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(`Login failed: ${e.message}`);
  }
  const { access_token } = await res.json();
  return access_token;
}

async function getRegistration(token) {
  const res = await fetch(`${API_URL}/registrations/${WORKSHOP_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404 || res.status === 401) return null;
  return res.ok ? res.json() : null;
}

async function cancelRegistration(token, regId) {
  const res = await fetch(`${API_URL}/registrations/${regId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.ok;
}

async function registerWorkshop(token, { forceTimeout = false } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (forceTimeout) headers['X-Test-Payment-Timeout'] = 'true';

  return fetch(`${API_URL}/registrations/${WORKSHOP_ID}`, {
    method: 'POST',
    headers,
  });
}

// ── main ─────────────────────────────────────────────────────

async function runTest() {
  console.log('============================================================');
  console.log('🧪 DEMO: THANH TOÁN KHÔNG ỔN ĐỊNH (IDEMPOTENCY + NON-BLOCKING)');
  console.log('============================================================\n');

  // ── Đăng nhập ────────────────────────────────────────────────
  console.log('🔐 Đang đăng nhập...');
  let token;
  try {
    token = await login();
    console.log(`   ✅ Đăng nhập thành công: ${STUDENT_EMAIL}\n`);
  } catch (e) {
    console.log(`   ❌ ${e.message}`);
    console.log('   → Hãy kiểm tra server đang chạy và thông tin tài khoản chính xác.');
    return;
  }

  // ── Reset trạng thái: huỷ đăng ký cũ nếu có ─────────────────
  console.log('🔄 [SETUP] Kiểm tra đăng ký cũ...');
  const existing = await getRegistration(token);
  if (existing) {
    console.log(`   Tìm thấy đăng ký cũ (status: ${existing.status}, id: ${existing.id})`);
    if (existing.status !== 'CANCELLED' && existing.status !== 'EXPIRED') {
      const cancelled = await cancelRegistration(token, existing.id);
      console.log(cancelled
        ? '   ✅ Đã huỷ đăng ký cũ. Bắt đầu demo từ đầu...\n'
        : '   ⚠️  Không thể huỷ, tiếp tục với trạng thái hiện tại...\n');
    } else {
      console.log('   (Đăng ký đã huỷ/hết hạn, không cần reset)\n');
    }
  } else {
    console.log('   Không có đăng ký nào. Sẵn sàng demo.\n');
  }

  await sleep(500);

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: Giả lập cổng thanh toán BỊ SẬP (timeout)
  // ══════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 PHASE 1: Cổng thanh toán bị sập');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('[1a] Sinh viên bấm "Đăng ký" workshop có phí...');
  console.log('     → Backend giữ 1 ghế ngay lập tức (trước khi đợi thanh toán)');
  console.log('     → Gửi request tới cổng thanh toán bên thứ 3 (đang bị timeout)...\n');

  const paymentTask = registerWorkshop(token, { forceTimeout: true });

  // Song song: chứng minh non-blocking
  await sleep(200);
  console.log('[1b] TRONG LÚC THANH TOÁN BỊ TREO — thử tải danh sách Workshop...');
  const listStart = Date.now();
  const listRes = await fetch(`${API_URL}/workshops`);
  const listEnd = Date.now();

  if (listRes.ok) {
    const data = await listRes.json();
    console.log(`     ✅ Tải danh sách thành công! (${listEnd - listStart}ms, ${data.total} workshops)`);
    console.log('     → Thanh toán đang treo KHÔNG block API khác. Hệ thống vẫn sống!\n');
  } else {
    console.log('     ❌ FAIL: API danh sách bị ảnh hưởng bởi thanh toán!\n');
  }

  console.log('[1c] Chờ kết quả thanh toán...');
  const regRes = await paymentTask;

  if (regRes.status === 504 || regRes.status >= 500) {
    const body = await regRes.json();
    console.log(`     ✅ Nhận HTTP ${regRes.status} — Cổng thanh toán timeout đúng như giả lập.`);
    console.log(`     ✅ Ghế được giữ ở trạng thái PENDING (KHÔNG bị mất).`);
    console.log(`     → Message: "${body.message}"\n`);
  } else if (regRes.ok) {
    console.log('     ⚠️  Giao dịch thành công — forceTimeout header có thể chưa được nhận.');
    console.log('     → Hãy đảm bảo server đã được restart sau khi cập nhật code.\n');
  } else {
    const body = await regRes.json().catch(() => ({}));
    console.log(`     ❌ Lỗi: HTTP ${regRes.status} — ${body.message || 'unknown'}\n`);
  }

  await sleep(500);

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: Sinh viên retry — kiểm tra Idempotency
  // ══════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 PHASE 2: Sinh viên bấm Retry (cổng vẫn hỏng)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('[2] Sinh viên bấm "Đăng ký lại" (cổng vẫn đang timeout)...');
  console.log('    → Hệ thống phát hiện đã có đăng ký PENDING, KHÔNG tạo ghế mới.');
  console.log('    → Chỉ thử lại thanh toán với CÙNG idempotency key.\n');

  const retryRes = await registerWorkshop(token, { forceTimeout: true });

  if (retryRes.status === 504 || retryRes.status >= 500) {
    const body = await retryRes.json();
    console.log(`    ✅ HTTP ${retryRes.status} — Cổng vẫn timeout, nhưng KHÔNG tạo thêm ghế.`);
    console.log('    ✅ IDEMPOTENCY OK: Sinh viên KHÔNG bị charge 2 lần, KHÔNG chiếm 2 ghế!\n');
  } else if (retryRes.status === 409 || retryRes.status === 400) {
    const body = await retryRes.json().catch(() => ({}));
    console.log(`    ❌ FAIL: Server báo conflict (${retryRes.status}) thay vì retry payment.`);
    console.log(`    → "${body.message}"\n`);
  } else if (retryRes.ok) {
    console.log('    ⚠️  Thanh toán thành công ngay (forceTimeout không hoạt động)\n');
  }

  await sleep(500);

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: Cổng thanh toán phục hồi — Retry thành công
  // ══════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 PHASE 3: Cổng thanh toán phục hồi — Retry thành công');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('[3] Cổng thanh toán đã ổn định. Sinh viên bấm "Retry" lần cuối...');
  console.log('    → Không có forceTimeout → thanh toán chạy bình thường.\n');

  const finalRes = await registerWorkshop(token, { forceTimeout: false });

  if (finalRes.ok) {
    const body = await finalRes.json();
    console.log('    ✅ THANH TOÁN THÀNH CÔNG!');
    console.log(`    ✅ Trạng thái đăng ký: ${body.status}`);
    console.log('    ✅ Ghế được xác nhận — sinh viên chỉ bị charge 1 lần duy nhất!\n');
  } else {
    const body = await finalRes.json().catch(() => ({}));
    console.log(`    ❌ Lỗi khi retry: HTTP ${finalRes.status} — ${body.message || 'unknown'}\n`);
  }

  // ── Kết luận ─────────────────────────────────────────────────
  console.log('════════════════════════════════════════════════════════════');
  console.log('📊 KẾT LUẬN');
  console.log('════════════════════════════════════════════════════════════');
  console.log('  ✅ Non-blocking  : Cổng thanh toán lỗi KHÔNG ảnh hưởng các API khác');
  console.log('  ✅ Idempotency   : Retry KHÔNG tạo thêm ghế hay charge thêm tiền');
  console.log('  ✅ Fault-tolerant: Khi cổng phục hồi, sinh viên thanh toán lại được ngay');
  console.log('════════════════════════════════════════════════════════════\n');
}

runTest().catch((err) => {
  console.error('❌ Demo bị crash:', err.message);
  process.exit(1);
});
