const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const bcrypt = require('bcryptjs');

let mongod;
let server;
let base;
let User;
let SellerVerification;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCsrf = async () => {
  const response = await axios.get(`${base}/csrf-token`);
  const csrfToken = response.data && response.data.csrfToken;
  const cookie = (response.headers['set-cookie'] || []).join('; ');
  assert.ok(csrfToken, 'Expected CSRF token in response');
  return { csrfToken, cookie };
};

const login = async (identifier, password) => {
  const { csrfToken, cookie } = await getCsrf();
  const response = await axios.post(
    `${base}/auth/login`,
    { identifier, password },
    { headers: { 'X-CSRF-Token': csrfToken, Cookie: cookie } }
  );

  assert.equal(response.status, 200);
  assert.ok(response.data && response.data.data && response.data.data.accessToken, 'Expected accessToken from login');

  return { token: response.data.data.accessToken, csrfToken, cookie };
};

const authHeaders = (token, csrfToken, cookie) => ({
  Authorization: `Bearer ${token}`,
  'X-CSRF-Token': csrfToken,
  Cookie: cookie
});

describe('Seller verification integration', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.LOGIN_OTP_ENABLED = 'false';

    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    const connectDatabase = require('../config/database');
    await connectDatabase();

    ({ User, SellerVerification } = require('../models'));

    const app = require('../app');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    base = `http://localhost:${port}/api`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await SellerVerification.deleteMany({});
  });

  it('allows an authenticated seller to submit a verification request', async () => {
    const password = 'SellerPass1!';
    const seller = await User.create({
      email: 'seller@example.com',
      passwordHash: await bcrypt.hash(password, 10),
      displayName: 'Seller One',
      role: 'seller',
      emailVerified: true,
      isActive: true
    });

    const { token, csrfToken, cookie } = await login('seller@example.com', password);

    const response = await axios.post(
      `${base}/verification/request`,
      {
        idCardImage: 'data:image/png;base64,AAA',
        selfieImage: 'data:image/png;base64,BBB',
        businessDocument: 'data:image/png;base64,CCC',
        details: 'Please verify my seller account'
      },
      { headers: authHeaders(token, csrfToken, cookie) }
    );

    assert.equal(response.status, 201);
    assert.equal(response.data.success, true);
    assert.equal(response.data.data.status, 'pending');
    assert.equal(response.data.data.userId, seller._id.toString());

    const statusResponse = await axios.get(`${base}/verification/status`, {
      headers: authHeaders(token, csrfToken, cookie)
    });

    assert.equal(statusResponse.status, 200);
    assert.equal(statusResponse.data.success, true);
    assert.equal(statusResponse.data.data.user.verificationStatus, 'pending');
    assert.equal(statusResponse.data.data.verification.status, 'pending');
  });

  it('returns 401 when an unauthenticated user attempts to submit a verification request', async () => {
    const { csrfToken, cookie } = await getCsrf();

    let error;
    try {
      await axios.post(
        `${base}/verification/request`,
        { idCardImage: 'data:image/png;base64,AAA', selfieImage: 'data:image/png;base64,BBB' },
        { headers: { 'X-CSRF-Token': csrfToken, Cookie: cookie } }
      );
    } catch (e) {
      error = e;
    }

    assert.ok(error, 'Expected request to fail');
    assert.equal(error.response?.status, 401);
    assert.equal(error.response?.data?.message, 'Authentication required');
  });

  it('allows an admin to approve and reject a verification request', async () => {
    const sellerPassword = 'SellerPass2!';
    const seller = await User.create({
      email: 'seller2@example.com',
      passwordHash: await bcrypt.hash(sellerPassword, 10),
      displayName: 'Seller Two',
      role: 'seller',
      emailVerified: true,
      isActive: true
    });

    const sellerAuth = await login('seller2@example.com', sellerPassword);
    const requestResponse = await axios.post(
      `${base}/verification/request`,
      {
        idCardImage: 'data:image/png;base64,DDD',
        selfieImage: 'data:image/png;base64,EEE'
      },
      { headers: authHeaders(sellerAuth.token, sellerAuth.csrfToken, sellerAuth.cookie) }
    );

    assert.equal(requestResponse.status, 201);
    const verificationId = requestResponse.data.data._id;

    const adminPassword = 'AdminPass1!';
    await User.create({
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      displayName: 'Admin User',
      role: 'admin',
      emailVerified: true,
      isActive: true
    });

    const adminAuth = await login('admin@example.com', adminPassword);

    const approveResponse = await axios.patch(
      `${base}/admin/verification/${verificationId}`,
      { status: 'approved' },
      { headers: authHeaders(adminAuth.token, adminAuth.csrfToken, adminAuth.cookie) }
    );

    assert.equal(approveResponse.status, 200);
    assert.equal(approveResponse.data.success, true);
    assert.equal(approveResponse.data.data.status, 'approved');

    const updatedVerification = await SellerVerification.findById(verificationId).lean();
    assert.equal(updatedVerification.status, 'approved');

    let updatedSeller = await User.findById(seller._id).lean();
    assert.equal(updatedSeller.sellerVerificationStatus, 'verified');
    assert.equal(updatedSeller.verificationStatus, 'approved');

    const rejectResponse = await axios.patch(
      `${base}/admin/verification/${verificationId}`,
      { status: 'rejected' },
      { headers: authHeaders(adminAuth.token, adminAuth.csrfToken, adminAuth.cookie) }
    );

    assert.equal(rejectResponse.status, 200);
    assert.equal(rejectResponse.data.data.status, 'rejected');

    const rejectedVerification = await SellerVerification.findById(verificationId).lean();
    assert.equal(rejectedVerification.status, 'rejected');

    updatedSeller = await User.findById(seller._id).lean();
    assert.equal(updatedSeller.sellerVerificationStatus, 'rejected');
    assert.equal(updatedSeller.verificationStatus, 'rejected');
  });

  it('returns 403 when a non-admin user attempts to review a verification request', async () => {
    const sellerPassword = 'SellerPass3!';
    const seller = await User.create({
      email: 'seller3@example.com',
      passwordHash: await bcrypt.hash(sellerPassword, 10),
      displayName: 'Seller Three',
      role: 'seller',
      emailVerified: true,
      isActive: true
    });

    const userPassword = 'RegularPass1!';
    await User.create({
      email: 'user@example.com',
      passwordHash: await bcrypt.hash(userPassword, 10),
      displayName: 'Regular User',
      role: 'user',
      emailVerified: true,
      isActive: true
    });

    const sellerAuth = await login('seller3@example.com', sellerPassword);
    const requestResponse = await axios.post(
      `${base}/verification/request`,
      {
        idCardImage: 'data:image/png;base64,FFF',
        selfieImage: 'data:image/png;base64,GGG'
      },
      { headers: authHeaders(sellerAuth.token, sellerAuth.csrfToken, sellerAuth.cookie) }
    );

    const verificationId = requestResponse.data.data._id;
    const userAuth = await login('user@example.com', userPassword);

    let error;
    try {
      await axios.patch(
        `${base}/admin/verification/${verificationId}`,
        { status: 'approved' },
        { headers: authHeaders(userAuth.token, userAuth.csrfToken, userAuth.cookie) }
      );
    } catch (e) {
      error = e;
    }

    assert.ok(error, 'Expected non-admin admin review to fail');
    assert.equal(error.response?.status, 403);
    assert.equal(error.response?.data?.message, 'Forbidden: insufficient privileges');
  });
});
