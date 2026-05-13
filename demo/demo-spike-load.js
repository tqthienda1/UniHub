// Script test chống Spam và quá tải (Rate Limiting & Spike Load)
// Yêu cầu Node.js 18+ (sử dụng fetch)

const API_URL = 'http://localhost:3000';
const WORKSHOP_ID = '9fe3b93a-2eab-40a3-9f3d-894e7e2b7ed2';

const randomString = () => Math.random().toString(36).substring(7);

async function registerAndGetToken(i) {
  const email = `loadtest_${randomString()}@example.com`;
  const password = 'password123';
  
  try {
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        fullName: `Spike User ${i}`,
        mssv: `999${i.toString().padStart(5, '0')}`
      })
    });
    
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      return data.access_token;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function testSpamProtection() {
  console.log('\n================================================');
  console.log('🧪 TEST CASE 1: KIỂM TRA CHỐNG SPAM TỪ 1 CLIENT');
  console.log('Mô phỏng 1 sinh viên gửi 100 requests đăng ký liên tục trong 1 giây...');
  
  const token = await registerAndGetToken(0);
  if (!token) {
    console.log('Không thể tạo user để test. Vui lòng kiểm tra server.');
    return;
  }

  let successCount = 0;
  let rateLimitedCount = 0;
  let otherErrorCount = 0;

  const startTime = Date.now();
  const requests = [];

  for (let i = 0; i < 100; i++) {
    requests.push(
      fetch(`${API_URL}/registrations/${WORKSHOP_ID}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (res.status === 429) rateLimitedCount++;
        else if (res.ok) successCount++;
        else otherErrorCount++;
      }).catch(() => otherErrorCount++)
    );
  }

  await Promise.all(requests);
  const duration = Date.now() - startTime;

  console.log(`⏱ Thời gian thực thi: ${duration}ms cho 100 requests`);
  console.log(`✅ Thành công: ${successCount}`);
  console.log(`🚫 Bị chặn (Rate Limit - 429): ${rateLimitedCount}`);
  console.log(`⚠️ Lỗi khác: ${otherErrorCount}`);

  if (rateLimitedCount > 0) {
    console.log('\n🎉 PASS: Hệ thống CÓ cơ chế Rate Limit bảo vệ khỏi spam!');
  } else {
    console.log('\n🚨 FAIL: Hệ thống KHÔNG chặn spam (Không có lỗi 429). Một user có thể tốn tài nguyên server bằng cách spam API!');
  }
}

async function testSpikeLoad() {
  console.log('\n================================================');
  console.log('🧪 TEST CASE 2: KIỂM TRA TẢI TRỌNG ĐỘT BIẾN (SPIKE LOAD)');
  console.log('Mô phỏng 50 user khác nhau truy cập cùng lúc (mô phỏng 60% traffic trong phút đầu)...');
  
  const USERS_COUNT = 50;
  console.log(`Đang chuẩn bị ${USERS_COUNT} users...`);
  const tokens = [];
  for(let i = 1; i <= USERS_COUNT; i++) {
    const token = await registerAndGetToken(i);
    if (token) tokens.push(token);
  }

  console.log(`Bắt đầu "bão" requests từ ${tokens.length} sinh viên...`);
  const startTime = Date.now();
  let serverCrashed = false;
  let timeoutCount = 0;

  const requests = tokens.map(token => 
    fetch(`${API_URL}/registrations/${WORKSHOP_ID}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // Timeout 5s
    }).then(res => res.status)
      .catch(err => {
        if (err.name === 'TimeoutError') timeoutCount++;
        else serverCrashed = true;
        return 500;
      })
  );

  const statuses = await Promise.all(requests);
  const duration = Date.now() - startTime;

  const success = statuses.filter(s => s >= 200 && s < 300).length;
  const rateLimited = statuses.filter(s => s === 429).length;
  const errors = statuses.filter(s => s >= 500).length;

  console.log(`⏱ Thời gian phản hồi cho đợt Spike: ${duration}ms`);
  console.log(`✅ Thành công / Đã đăng ký: ${success}`);
  console.log(`🚫 Bị chặn (Rate Limit hệ thống): ${rateLimited}`);
  console.log(`⏳ Quá thời gian (Timeout >5s): ${timeoutCount}`);
  console.log(`🔥 Lỗi Server (500/Crash): ${errors}`);

  if (serverCrashed || timeoutCount > 0) {
    console.log('\n🚨 FAIL: Server có dấu hiệu quá tải, không thể xử lý kịp trong 5 giây hoặc bị sập.');
  } else if (duration > 3000) {
    console.log('\n⚠️ WARNING: Thời gian xử lý khá chậm (>3s), cần tối ưu thêm (ví dụ: dùng Queue thay vì query DB trực tiếp).');
  } else {
    console.log('\n🎉 PASS: Server xử lý tốt đợt tải đột biến!');
  }
}

async function runTests() {
  await testSpamProtection();
  await testSpikeLoad();
}

runTests();
