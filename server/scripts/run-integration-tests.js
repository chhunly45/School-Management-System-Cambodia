const { MongoMemoryServer } = require('mongodb-memory-server');
let connectDatabase;
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('[integration] starting in-memory mongo');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'development';

  // require database connect after setting env so config picks up the test URI
  connectDatabase = require('../config/database');

  try {
    await connectDatabase();
  } catch (err) {
    console.error('[integration] DB connect failed', err);
    process.exit(1);
  }

  // require app after environment is set to ensure config picks up MONGODB_URI
  // require models and app after DB connect/env configured
  const { User } = require('../models');
  const app = require('../app');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;
  console.log('[integration] server running on', base);

  try {
    // create test user
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: 'test@example.com',
      passwordHash,
      displayName: 'Test User',
      role: 'user',
      emailVerified: true
    });
    const fresh = await User.findOne({ email: 'test@example.com' }).lean();
    console.log('[integration] created user emailVerified=', fresh.emailVerified);

    // create phone-password user for login validation
    const phonePassword = 'PhonePass123!';
    await User.create({
      email: 'phone-user@example.com',
      passwordHash: await bcrypt.hash(phonePassword, 12),
      displayName: 'Phone User',
      role: 'user',
      phoneNumber: '012345678',
      emailVerified: true
    });
    console.log('[integration] created phone login user');

    // get CSRF token and cookie
    const csrfResp = await axios.get(`${base}/csrf-token`);
    const csrfToken = csrfResp.data && csrfResp.data.csrfToken;
    const setCookie = (csrfResp.headers && csrfResp.headers['set-cookie']) ? csrfResp.headers['set-cookie'].join('; ') : '';
    if (!csrfToken) throw new Error('Unable to get CSRF token');
    console.log('[integration] got csrf token and cookie');

    const defaultHeaders = { 'X-CSRF-Token': csrfToken, Cookie: setCookie };

    // 1) Login by phone number with password
    console.log('[integration] testing login by phone number with password');
    const phoneLoginResp = await axios.post(`${base}/auth/login`, { identifier: '012345678', password: phonePassword }, { headers: defaultHeaders });
    if (!phoneLoginResp.data || !phoneLoginResp.data.data || !phoneLoginResp.data.data.requiresOtp) {
      throw new Error('Phone login did not request OTP as expected');
    }
    console.log('[integration] phone login requested OTP');

    let phoneOtp = null;
    const phoneDevDir = path.resolve(process.cwd(), 'dev-emails');
    for (let i = 0; i < 20; i++) {
      if (fs.existsSync(phoneDevDir)) {
        const files = fs.readdirSync(phoneDevDir).filter((f) => f.startsWith('email-')).sort();
        if (files.length > 0) {
          const latest = files[files.length - 1];
          const content = fs.readFileSync(path.join(phoneDevDir, latest), 'utf8');
          const m = content.match(/code is (\d{6})|code: (\d{6})|(verification code is (\d{6}))/i);
          if (m) phoneOtp = (m[1] || m[2] || m[4]).toString();
          break;
        }
      }
      await wait(250);
    }
    if (!phoneOtp) throw new Error('Phone login OTP email not found in dev-emails');
    console.log('[integration] found phone login OTP:', phoneOtp);

    const phoneVerifyResp = await axios.post(`${base}/auth/login/verify`, { identifier: '012345678', code: phoneOtp }, { headers: defaultHeaders });
    if (!phoneVerifyResp.data || !phoneVerifyResp.data.data || !phoneVerifyResp.data.data.accessToken || !phoneVerifyResp.data.data.user) {
      throw new Error('Phone login verify did not return accessToken or user');
    }
    console.log('[integration] phone login verify succeeded, accessToken returned');

    // 2) Login (should trigger OTP)
    console.log('[integration] testing login (requesting OTP)');
    const loginResp = await axios.post(`${base}/auth/login`, { identifier: 'test@example.com', password }, { headers: defaultHeaders });
    if (!loginResp.data || !loginResp.data.data || !loginResp.data.data.requiresOtp) {
      throw new Error('Login did not request OTP as expected');
    }
    console.log('[integration] login requested OTP');

    // wait for dev-emails folder and read OTP (saved by email.service in server/dev-emails)
    const devDir = path.resolve(process.cwd(), 'dev-emails');
    let otp = null;
    for (let i = 0; i < 20; i++) {
      if (fs.existsSync(devDir)) {
        const files = fs.readdirSync(devDir).filter((f) => f.startsWith('email-')).sort();
        if (files.length > 0) {
          const latest = files[files.length - 1];
          const content = fs.readFileSync(path.join(devDir, latest), 'utf8');
          const m = content.match(/code is (\d{6})|code: (\d{6})|(verification code is (\d{6}))/i);
          if (m) otp = (m[1] || m[2] || m[4]).toString();
          break;
        }
      }
      await wait(250);
    }
    if (!otp) throw new Error('OTP email not found in dev-emails');
    console.log('[integration] found OTP:', otp);

    // verify login OTP
    let verifyResp;
    try {
      verifyResp = await axios.post(`${base}/auth/login/verify`, { identifier: 'test@example.com', code: otp }, { headers: defaultHeaders });
    } catch (e) {
      console.error('[integration] login verify failed status:', e.response?.status);
      console.error('[integration] login verify body:', e.response?.data);
      throw e;
    }
    const authData = verifyResp.data.data;
    if (!authData || !authData.accessToken) throw new Error('Login verify did not return tokens');
    const token = authData.accessToken;
    console.log('[integration] login verify succeeded, token obtained');

    // Additional debug/logging requested: verify token payload and user lookup
    try {
      const payload = jwt.verify(token, require('../config').jwtSecret, { algorithms: ['HS256'] });
      console.log('[integration] token payload:', payload);
      const foundUser = await User.findById(payload.userId).lean();
      console.log('[integration] user lookup result:', foundUser ? `found user ${foundUser._id} ${foundUser.email || ''}` : 'user not found');
    } catch (e) {
      console.error('[integration] token verify failed:', e.message);
    }

    // Explicitly call GET /auth/me to check response
    try {
      const meResp = await axios.get(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}`, ...defaultHeaders } });
      console.log('[integration] GET /auth/me status:', meResp.status);
      console.log('[integration] GET /auth/me body:', meResp.data && typeof meResp.data === 'object' ? JSON.stringify(meResp.data) : meResp.data);
    } catch (e) {
      console.error('[integration] GET /auth/me failed status:', e.response?.status);
      console.error('[integration] GET /auth/me body:', e.response?.data);
    }

    // 2) Change password
    console.log('[integration] testing change-password');
    let changeResp;
    try {
      changeResp = await axios.post(`${base}/auth/change-password`, { currentPassword: password, newPassword: 'NewPass!234' }, { headers: { Authorization: `Bearer ${token}`, ...defaultHeaders } });
    } catch (e) {
      console.error('[integration] change-password status:', e.response?.status);
      console.error('[integration] change-password body:', e.response?.data);
      throw e;
    }
    if (!changeResp.data || !changeResp.data.data || !changeResp.data.data.success) {
      throw new Error('Change password failed');
    }
    console.log('[integration] change-password succeeded');

    // 3) Account/profile update
    console.log('[integration] testing profile update');
    let updateResp;
    try {
      updateResp = await axios.put(`${base}/auth/me`, { displayName: 'Updated Name' }, { headers: { Authorization: `Bearer ${token}`, ...defaultHeaders } });
    } catch (e) {
      console.error('[integration] profile update status:', e.response?.status);
      console.error('[integration] profile update body:', e.response?.data);
      throw e;
    }
    if (!updateResp.data || !updateResp.data.data || updateResp.data.data.displayName !== 'Updated Name') {
      throw new Error('Profile update failed');
    }
    console.log('[integration] profile update succeeded');

    // 4) Verification/profile routes (request verification)
    console.log('[integration] testing verification request');
    let verifyReqResp;
    try {
      verifyReqResp = await axios.post(`${base}/auth/verification-request`, { details: 'Please verify me' }, { headers: { Authorization: `Bearer ${token}`, ...defaultHeaders } });
    } catch (e) {
      console.error('[integration] verification request status:', e.response?.status);
      console.error('[integration] verification request body:', e.response?.data);
      throw e;
    }
    if (!verifyReqResp.data || !verifyReqResp.data.data || verifyReqResp.data.data.verificationStatus !== 'pending') {
      throw new Error('Verification request failed');
    }
    console.log('[integration] verification request succeeded');

    // 5) Banner permission tests
    console.log('[integration] testing banner permissions');

    // Create an admin user for testing
    const adminPassword = 'AdminPass123!';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await User.create({
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      displayName: 'Admin User',
      role: 'admin',
      emailVerified: true
    });
    console.log('[integration] created admin user');

    // Get admin token
    const adminLoginResp = await axios.post(`${base}/auth/login`, { identifier: 'admin@example.com', password: adminPassword }, { headers: defaultHeaders });
    const adminOtpResp = adminLoginResp.data.data;
    if (!adminOtpResp.requiresOtp) throw new Error('Admin login did not request OTP');

    // Wait for admin OTP
    let adminOtp = null;
    for (let i = 0; i < 20; i++) {
      if (fs.existsSync(devDir)) {
        const files = fs.readdirSync(devDir).filter((f) => f.startsWith('email-')).sort();
        if (files.length > 1) { // Should have 2 emails now
          const latest = files[files.length - 1];
          const content = fs.readFileSync(path.join(devDir, latest), 'utf8');
          const m = content.match(/code is (\d{6})|code: (\d{6})|(verification code is (\d{6}))/i);
          if (m) adminOtp = (m[1] || m[2] || m[4]).toString();
          break;
        }
      }
      await wait(250);
    }
    if (!adminOtp) throw new Error('Admin OTP email not found');

    // Verify admin login
    const adminVerifyResp = await axios.post(`${base}/auth/login/verify`, { identifier: 'admin@example.com', code: adminOtp }, { headers: defaultHeaders });
    const adminToken = adminVerifyResp.data.data.accessToken;
    console.log('[integration] admin login succeeded, token obtained');

    // Test 5a: Public user cannot create banner
    console.log('[integration] testing: non-admin user cannot create banner');
    try {
      await axios.post(`${base}/banners`, 
        { title: 'Test Banner', subtitle: 'Test', enabled: true },
        { headers: { Authorization: `Bearer ${token}`, ...defaultHeaders } }
      );
      throw new Error('Non-admin user should not be able to create banner');
    } catch (e) {
      if (e.response?.status === 403) {
        console.log('[integration] ✓ non-admin user correctly denied banner creation');
      } else {
        throw e;
      }
    }

    // Test 5b: Admin can create banner
    console.log('[integration] testing: admin user can create banner');
    const bannerResp = await axios.post(`${base}/banners`,
      { title: 'Test Banner', subtitle: 'Test Subtitle', enabled: true },
      { headers: { Authorization: `Bearer ${adminToken}`, ...defaultHeaders } }
    );
    if (!bannerResp.data.data || !bannerResp.data.data._id) {
      throw new Error('Admin banner creation failed');
    }
    const bannerId = bannerResp.data.data._id;
    console.log('[integration] ✓ admin user created banner:', bannerId);

    // Test 5c: Non-admin user cannot update banner
    console.log('[integration] testing: non-admin user cannot update banner');
    try {
      await axios.patch(`${base}/banners/${bannerId}`,
        { title: 'Updated Banner' },
        { headers: { Authorization: `Bearer ${token}`, ...defaultHeaders } }
      );
      throw new Error('Non-admin user should not be able to update banner');
    } catch (e) {
      if (e.response?.status === 403) {
        console.log('[integration] ✓ non-admin user correctly denied banner update');
      } else {
        throw e;
      }
    }

    // Test 5d: Admin can update banner
    console.log('[integration] testing: admin user can update banner');
    const bannerUpdateResp = await axios.patch(`${base}/banners/${bannerId}`,
      { title: 'Updated Banner Title' },
      { headers: { Authorization: `Bearer ${adminToken}`, ...defaultHeaders } }
    );
    if (bannerUpdateResp.data.data.title !== 'Updated Banner Title') {
      throw new Error('Admin banner update failed');
    }
    console.log('[integration] ✓ admin user updated banner');

    // Test 5e: Non-admin user cannot delete banner
    console.log('[integration] testing: non-admin user cannot delete banner');
    try {
      await axios.delete(`${base}/banners/${bannerId}`,
        { headers: { Authorization: `Bearer ${token}`, ...defaultHeaders } }
      );
      throw new Error('Non-admin user should not be able to delete banner');
    } catch (e) {
      if (e.response?.status === 403) {
        console.log('[integration] ✓ non-admin user correctly denied banner deletion');
      } else {
        throw e;
      }
    }

    // Test 5f: Unauthenticated user cannot create banner
    console.log('[integration] testing: unauthenticated user cannot create banner');
    try {
      await axios.post(`${base}/banners`,
        { title: 'Test Banner', subtitle: 'Test' },
        { headers: defaultHeaders }
      );
      throw new Error('Unauthenticated user should not be able to create banner');
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        console.log('[integration] ✓ unauthenticated user correctly denied banner creation');
      } else {
        throw e;
      }
    }

    // Test 5g: Public user can fetch active banners
    console.log('[integration] testing: public user can fetch active banners');
    const activeBannersResp = await axios.get(`${base}/banners/active`);
    if (!Array.isArray(activeBannersResp.data.data)) {
      throw new Error('Failed to fetch active banners');
    }
    console.log('[integration] ✓ public user can fetch active banners, count:', activeBannersResp.data.data.length);

    // Test 5h: Admin can delete banner
    console.log('[integration] testing: admin user can delete banner');
    const bannerDeleteResp = await axios.delete(`${base}/banners/${bannerId}`,
      { headers: { Authorization: `Bearer ${adminToken}`, ...defaultHeaders } }
    );
    if (!bannerDeleteResp.data.success) {
      throw new Error('Admin banner deletion failed');
    }
    console.log('[integration] ✓ admin user deleted banner');

    console.log('[integration] all tests passed');

    // Clean up
    await mongoose.disconnect();
    await mongod.stop();
    server.close();

    process.exit(0);
  } catch (err) {
    console.error('[integration] tests failed:', err.message || err);
    try {
      await mongoose.disconnect();
      await mongod.stop();
    } catch (e) {}
    server.close();
    process.exit(2);
  }
})();
