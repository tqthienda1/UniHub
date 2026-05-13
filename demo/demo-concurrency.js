// No external dependencies needed! Using native fetch API (Node 18+)

// === CONFIGURATION ===
// Change this to match your local running server
const API_URL = 'http://localhost:3000'; 
// ID of a workshop you created for testing
const WORKSHOP_ID = '9fe3b93a-2eab-40a3-9f3d-894e7e2b7ed2'; 
const NUM_CONCURRENT_USERS = 100;
const SEATS_AVAILABLE = 60;

const randomString = () => Math.random().toString(36).substring(7);

async function demoConcurrency() {
  console.log(`Starting concurrency demo with ${NUM_CONCURRENT_USERS} users...`);
  
  // 1. Create multiple users and get their JWT tokens
  const tokens = [];
  console.log('Registering users...');
  
  for (let i = 0; i < NUM_CONCURRENT_USERS; i++) {
    const email = `testuser_${randomString()}@example.com`;
    const password = 'password123';
    
    try {
      // Create user
      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName: `Test User ${i}`,
          mssv: `123${i.toString().padStart(5, '0')}`
        })
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json();
        throw new Error(errData.message || 'Failed to register');
      }
      
      // Login to get token
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json();
        throw new Error(errData.message || 'Failed to login');
      }

      const loginData = await loginRes.json();
      tokens.push(loginData.access_token);
    } catch (err) {
      console.error(`Failed to create user ${i}:`, err.message);
    }
  }

  if (tokens.length === 0) {
    console.error('Failed to create any users. Please make sure the server is running on ' + API_URL);
    return;
  }

  console.log(`Successfully created ${tokens.length} users. Ready to attack!`);

  // 2. Fire concurrent requests
  console.log(`Sending ${tokens.length} concurrent registration requests...`);
  const startTime = Date.now();
  
  // Fire all requests at the exact same time using Promise.allSettled
  const requests = tokens.map(async (token, index) => {
    const res = await fetch(`${API_URL}/registrations/${WORKSHOP_ID}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json().catch(() => null);

    if (res.ok) {
      console.log(`✅ User ${index} registered successfully!`);
      return 'success';
    } else {
      console.log(`❌ User ${index} failed: ${data?.message || res.statusText}`);
      throw new Error('failed');
    }
  });

  const results = await Promise.allSettled(requests);
  const endTime = Date.now();
  
  // 3. Analyze results
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log('\n--- DEMO RESULTS ---');
  console.log(`Time taken: ${endTime - startTime}ms`);
  console.log(`Total Requests: ${NUM_CONCURRENT_USERS}`);
  console.log(`Successful Registrations: ${successful}`);
  console.log(`Failed Registrations: ${failed}`);
  
  if (successful <= SEATS_AVAILABLE) {
    console.log(`\n🎉 SUCCESS: The system prevented overbooking! Only ${successful} out of ${NUM_CONCURRENT_USERS} got seats.`);
  } else {
    console.log(`\n🚨 FAIL: The system overbooked! ${successful} students got seats, but only ${SEATS_AVAILABLE} were available.`);
  }
}

demoConcurrency();
