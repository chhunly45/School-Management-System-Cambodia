const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let mongod;
let server;
let base;
let User;
let AuditLog;
let config;

const getCsrf = async () => {
  const response = await axios.get(`${base}/csrf-token`);
  return {
    csrfToken: response.data.csrfToken,
    cookie: (response.headers['set-cookie'] || []).join('; ')
  };
};

const login = async (identifier, password) => {
  const { csrfToken, cookie } = await getCsrf();
  const response = await axios.post(`${base}/auth/login`, {
    identifier,
    password,
    useOtp: false
  }, {
    headers: { 'X-CSRF-Token': csrfToken, Cookie: cookie }
  });

  return {
    token: response.data.data.accessToken,
    refreshToken: response.data.data.refreshToken,
    csrfToken,
    cookie
  };
};

const createUser = async ({ email, phoneNumber, role }) => User.create({
  email,
  phoneNumber,
  passwordHash: await bcrypt.hash('Password123!', 12),
  displayName: `${role} account`,
  role,
  emailVerified: true
});

const authHeaders = ({ token, csrfToken, cookie }) => ({
  Authorization: `Bearer ${token}`,
  'X-CSRF-Token': csrfToken,
  Cookie: cookie
});

describe('limited student/payment user provisioning', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.LOGIN_OTP_ENABLED = 'false';
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    config = require('../config');
    const connectDatabase = require('../config/database');
    await connectDatabase();
    ({ User, AuditLog } = require('../models'));

    const app = require('../app');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://localhost:${server.address().port}/api`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), AuditLog.deleteMany({})]);
  });

  it('allows an Admin to create a hashed, inactive limited account and audits creation', async () => {
    await createUser({ email: 'limited-admin@example.com', role: 'admin' });
    const session = await login('limited-admin@example.com', 'Password123!');
    const response = await axios.post(`${base}/admin/users`, {
      displayName: 'Limited Operator',
      phoneNumber: '+85512345678',
      password: 'LimitedPass123!'
    }, { headers: authHeaders(session) });

    assert.equal(response.status, 201);
    assert.equal(response.data.data.role, 'LIMITED_STUDENT_PAYMENT');
    assert.equal(response.data.data.isActive, false);
    assert.equal(response.data.data.displayName, 'Limited Operator');
    assert.equal(response.data.data.passwordHash, undefined);
    assert.equal(response.data.data.refreshTokens, undefined);

    const created = await User.findById(response.data.data._id);
    assert.ok(await bcrypt.compare('LimitedPass123!', created.passwordHash));
    assert.equal(created.isActive, false);
    assert.equal(created.role, 'LIMITED_STUDENT_PAYMENT');
    assert.equal(await AuditLog.countDocuments({ action: 'user.create', targetId: created._id }), 1);
  });

  it('denies a regular user and a moderator from creating the limited account', async () => {
    for (const role of ['user', 'moderator']) {
      await createUser({ email: `${role}@example.com`, role });
      const session = await login(`${role}@example.com`, 'Password123!');
      const response = await axios.post(`${base}/admin/users`, {
        displayName: 'Unauthorized Limited User',
        phoneNumber: role === 'user' ? '+85512345679' : '+85512345670',
        password: 'LimitedPass123!'
      }, { headers: authHeaders(session), validateStatus: () => true });

      assert.equal(response.status, 403);
    }

    assert.equal(await User.countDocuments({ role: 'LIMITED_STUDENT_PAYMENT' }), 0);
  });

  it('ignores a public registration role selection for the limited role', async () => {
    const { csrfToken, cookie } = await getCsrf();
    const response = await axios.post(`${base}/auth/register`, {
      displayName: 'Public Signup',
      phoneNumber: '+85512345671',
      password: 'Password123!',
      role: 'LIMITED_STUDENT_PAYMENT'
    }, {
      headers: { 'X-CSRF-Token': csrfToken, Cookie: cookie }
    });

    assert.equal(response.status, 201);
    assert.notEqual(response.data.data.user.role, 'LIMITED_STUDENT_PAYMENT');
    assert.equal(await User.countDocuments({ role: 'LIMITED_STUDENT_PAYMENT' }), 0);
  });

  it('allows Admin activation through the existing status endpoint', async () => {
    await createUser({ email: 'activation-admin@example.com', role: 'admin' });
    const session = await login('activation-admin@example.com', 'Password123!');
    const createdResponse = await axios.post(`${base}/admin/users`, {
      displayName: 'Activation Target',
      phoneNumber: '+85512345672',
      password: 'LimitedPass123!'
    }, { headers: authHeaders(session) });
    const userId = createdResponse.data.data._id;

    const activationResponse = await axios.patch(`${base}/admin/users/${userId}/status`, {
      isActive: true,
      role: 'LIMITED_STUDENT_PAYMENT'
    }, { headers: authHeaders(session) });

    assert.equal(activationResponse.status, 200);
    assert.equal(activationResponse.data.data.isActive, true);
    assert.equal(activationResponse.data.data.role, 'LIMITED_STUDENT_PAYMENT');
    const activeSession = await login('+85512345672', 'LimitedPass123!');
    assert.ok(activeSession.token);

    const deactivationResponse = await axios.patch(`${base}/admin/users/${userId}/status`, {
      isActive: false
    }, { headers: authHeaders(session) });
    assert.equal(deactivationResponse.status, 200);
    assert.equal(deactivationResponse.data.data.isActive, false);

    const { csrfToken, cookie } = await getCsrf();
    const refreshResponse = await axios.post(`${base}/auth/refresh`, {
      refreshToken: activeSession.refreshToken
    }, {
      headers: { 'X-CSRF-Token': csrfToken, Cookie: cookie },
      validateStatus: () => true
    });
    assert.equal(refreshResponse.status, 401);
  });

  it('prevents moderators from assigning or changing limited-account status', async () => {
    const moderator = await createUser({ email: 'limited-moderator@example.com', role: 'moderator' });
    const target = await createUser({ email: 'existing-limited@example.com', role: 'LIMITED_STUDENT_PAYMENT' });
    target.isActive = false;
    await target.save();
    const session = await login('limited-moderator@example.com', 'Password123!');

    const assignResponse = await axios.patch(`${base}/admin/users/${moderator._id}/status`, {
      role: 'LIMITED_STUDENT_PAYMENT'
    }, { headers: authHeaders(session), validateStatus: () => true });
    const activateResponse = await axios.patch(`${base}/admin/users/${target._id}/status`, {
      isActive: true
    }, { headers: authHeaders(session), validateStatus: () => true });

    assert.equal(assignResponse.status, 403);
    assert.equal(activateResponse.status, 403);
    assert.equal((await User.findById(target._id)).isActive, false);
  });

  it('rejects inactive limited users at login and protected API middleware', async () => {
    await createUser({ email: 'inactive-admin@example.com', role: 'admin' });
    const adminSession = await login('inactive-admin@example.com', 'Password123!');
    const createdResponse = await axios.post(`${base}/admin/users`, {
      displayName: 'Inactive Target',
      phoneNumber: '+85512345673',
      password: 'LimitedPass123!'
    }, { headers: authHeaders(adminSession) });

    const { csrfToken, cookie } = await getCsrf();
    const loginResponse = await axios.post(`${base}/auth/login`, {
      identifier: '+85512345673',
      password: 'LimitedPass123!',
      useOtp: false
    }, {
      headers: { 'X-CSRF-Token': csrfToken, Cookie: cookie },
      validateStatus: () => true
    });
    assert.equal(loginResponse.status, 401);

    const inactiveToken = jwt.sign({ userId: createdResponse.data.data._id }, config.jwtSecret, {
      expiresIn: '1m',
      algorithm: 'HS256'
    });
    const protectedResponse = await axios.get(`${base}/students`, {
      headers: { Authorization: `Bearer ${inactiveToken}` },
      validateStatus: () => true
    });
    assert.equal(protectedResponse.status, 401);
  });
});