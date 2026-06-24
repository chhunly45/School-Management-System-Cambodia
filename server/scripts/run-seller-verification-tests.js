const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('[seller-tests] starting in-memory mongo');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';

  // connect DB
  const connectDatabase = require('../config/database');
  try {
    await connectDatabase();
  } catch (err) {
    console.error('[seller-tests] DB connect failed', err);
    process.exit(1);
  }

  const { User } = require('../models');
  const app = require('../app');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;
  console.log('[seller-tests] server running on', base);

  try {
    // create seller user
    const seller = await User.create({
      email: 'seller@example.com',
      passwordHash: await bcrypt.hash('SellerPass1!', 10),
      displayName: 'Seller One',
      role: 'seller',
      sellerVerificationStatus: 'unverified',
      emailVerified: true
    });
    console.log('[seller-tests] created seller', seller._id.toString());

    // create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('AdminPass1!', 10),
      displayName: 'Admin',
      role: 'admin',
      emailVerified: true
    });
    console.log('[seller-tests] created admin', admin._id.toString());

    // get CSRF token
    const csrfResp = await axios.get(`${base}/csrf-token`);
    const csrfToken = csrfResp.data && csrfResp.data.csrfToken;
    const setCookie = (csrfResp.headers && csrfResp.headers['set-cookie']) ? csrfResp.headers['set-cookie'].join('; ') : '';
    const defaultHeaders = { 'X-CSRF-Token': csrfToken, Cookie: setCookie };

    // admin login -> OTP flow
    const loginResp = await axios.post(`${base}/auth/login`, { identifier: 'admin@example.com', password: 'AdminPass1!' }, { headers: defaultHeaders });
    if (!loginResp.data || !loginResp.data.data || !loginResp.data.data.requiresOtp) throw new Error('Admin login did not request OTP');

    // Wait for OTP email
    let adminOtp = null;
    const devDir = path.resolve(process.cwd(), 'dev-emails');
    for (let i = 0; i < 20; i++) {
      if (fs.existsSync(devDir)) {
        const files = fs.readdirSync(devDir).filter((f) => f.startsWith('email-')).sort();
        if (files.length > 0) {
          const latest = files[files.length - 1];
          const content = fs.readFileSync(path.join(devDir, latest), 'utf8');
          const m = content.match(/code is (\d{6})|code: (\d{6})|(verification code is (\d{6}))/i);
          if (m) { adminOtp = (m[1] || m[2] || m[4]).toString(); break; }
        }
      }
      await wait(250);
    }
    if (!adminOtp) throw new Error('Admin OTP not found');

    const verifyResp = await axios.post(`${base}/auth/login/verify`, { identifier: 'admin@example.com', code: adminOtp }, { headers: defaultHeaders });
    const adminToken = verifyResp.data.data.accessToken;
    if (!adminToken) throw new Error('No admin token');
    console.log('[seller-tests] admin authenticated');

    // Smoke: approve seller
    const patchUrl = `${base}/admin/users/${seller._id}/status`;
    const patchResp = await axios.patch(patchUrl, { sellerVerificationStatus: 'verified' }, { headers: { Authorization: `Bearer ${adminToken}`, ...defaultHeaders } });
    if (patchResp.data && patchResp.data.data) {
      const updated = await User.findById(seller._id).lean();
      if (updated.sellerVerificationStatus !== 'verified') throw new Error('Seller status not updated to verified');
      console.log('[seller-tests] approve -> OK');
    } else {
      throw new Error('Unexpected response from approve call');
    }

    // Smoke: reject seller
    await axios.patch(patchUrl, { sellerVerificationStatus: 'rejected' }, { headers: { Authorization: `Bearer ${adminToken}`, ...defaultHeaders } });
    const afterReject = await User.findById(seller._id).lean();
    if (afterReject.sellerVerificationStatus !== 'rejected') throw new Error('Seller status not updated to rejected');
    console.log('[seller-tests] reject -> OK');

    // Smoke: reset to unverified
    await axios.patch(patchUrl, { sellerVerificationStatus: 'unverified' }, { headers: { Authorization: `Bearer ${adminToken}`, ...defaultHeaders } });
    const afterReset = await User.findById(seller._id).lean();
    if (afterReset.sellerVerificationStatus !== 'unverified') throw new Error('Seller status not updated to unverified');
    console.log('[seller-tests] reset -> OK');

    console.log('[seller-tests] all smoke checks passed');

    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  } catch (err) {
    console.error('[seller-tests] failed:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); await mongod.stop(); } catch (e) {}
    server.close();
    process.exit(2);
  }
})();
