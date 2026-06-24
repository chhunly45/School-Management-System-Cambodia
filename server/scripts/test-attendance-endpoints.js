const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findOtpCode = (dir, afterCount) => {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((file) => file.startsWith('email-')).sort();
  if (files.length <= afterCount) return null;
  const latest = files[files.length - 1];
  const content = fs.readFileSync(path.join(dir, latest), 'utf8');
  const match = content.match(/code is (\d{6})|code: (\d{6})|(verification code is (\d{6}))/i);
  return match ? (match[1] || match[2] || match[4]) : null;
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.NODE_ENV = 'development';

  const connectDatabase = require('../config/database');
  await connectDatabase();

  const { User } = require('../models');
  const app = require('../app');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;
  console.log('[test] server running at', base);

  const devEmailDir = path.resolve(process.cwd(), 'dev-emails');
  if (!fs.existsSync(devEmailDir)) {
    fs.mkdirSync(devEmailDir, { recursive: true });
  }
  const initialEmailFiles = fs.readdirSync(devEmailDir).filter((file) => file.startsWith('email-'));

  const adminPassword = 'AdminPass123!';
  const admin = await User.create({
    email: 'admin@example.com',
    passwordHash: await bcrypt.hash(adminPassword, 12),
    displayName: 'Admin Test',
    role: 'admin',
    emailVerified: true,
    isActive: true
  });
  console.log('[test] created admin', admin.email);

  const csrfResp = await axios.get(`${base}/csrf-token`, { validateStatus: null });
  if (csrfResp.status !== 200 || !csrfResp.data?.csrfToken) {
    throw new Error(`Failed to get CSRF token: ${csrfResp.status}`);
  }

  const csrfToken = csrfResp.data.csrfToken;
  const cookieHeader = (csrfResp.headers['set-cookie'] || []).join('; ');
  const defaultHeaders = {
    Origin: 'http://localhost:5174',
    'X-CSRF-Token': csrfToken,
    Cookie: cookieHeader
  };

  const loginResp = await axios.post(
    `${base}/auth/login`,
    { identifier: 'admin@example.com', password: adminPassword },
    { headers: defaultHeaders, validateStatus: null }
  );
  console.log('[test] /auth/login status', loginResp.status);
  console.log('[test] /auth/login body', JSON.stringify(loginResp.data));

  let token = null;
  if (loginResp.data?.data?.accessToken) {
    token = loginResp.data.data.accessToken;
  } else if (loginResp.data?.data?.requiresOtp) {
    let otp = null;
    for (let i = 0; i < 20; i += 1) {
      otp = findOtpCode(devEmailDir, initialEmailFiles.length);
      if (otp) break;
      await wait(250);
    }
    if (!otp) {
      throw new Error('OTP not found in dev-emails after login');
    }
    console.log('[test] found OTP', otp);

    const verifyResp = await axios.post(
      `${base}/auth/login/verify`,
      { identifier: 'admin@example.com', code: otp },
      { headers: defaultHeaders, validateStatus: null }
    );
    console.log('[test] /auth/login/verify status', verifyResp.status);
    console.log('[test] /auth/login/verify body', JSON.stringify(verifyResp.data));
    if (!verifyResp.data?.data?.accessToken) {
      throw new Error('Login verify did not return accessToken');
    }
    token = verifyResp.data.data.accessToken;
  } else {
    throw new Error('Unexpected login response format');
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'X-CSRF-Token': csrfToken,
    Cookie: cookieHeader,
    'Content-Type': 'application/json'
  };

  const getResp = await axios.get(`${base}/attendances`, { headers: authHeaders, validateStatus: null });
  console.log('[test] GET /attendances status', getResp.status);
  console.log('[test] GET /attendances body', JSON.stringify(getResp.data));

  const attendancePayload = {
    studentId: 'S-TEST-001',
    studentName: 'Test Student',
    className: '10A',
    date: new Date().toISOString().slice(0, 10),
    status: 'present',
    remarks: 'Attendance API smoke test',
    academicYear: '2025',
    semester: 1
  };

  const postResp = await axios.post(`${base}/attendances`, attendancePayload, {
    headers: authHeaders,
    validateStatus: null
  });
  console.log('[test] POST /attendances status', postResp.status);
  console.log('[test] POST /attendances body', JSON.stringify(postResp.data));

  await new Promise((resolve) => server.close(resolve));
  await mongod.stop();
  process.exit(postResp.status === 201 ? 0 : 1);
})().catch((error) => {
  console.error('[test] failed:', error.message || error);
  if (error.response) {
    console.error('[test] response data:', JSON.stringify(error.response.data));
  }
  process.exit(1);
});