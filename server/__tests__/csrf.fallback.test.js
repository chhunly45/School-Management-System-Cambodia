const { strict: assert } = require('node:assert');
const { describe, it, before, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const bcrypt = require('bcryptjs');

let server;
let base;
let User;
let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.NODE_ENV = 'development';
  process.env.LOGIN_OTP_ENABLED = 'false';

  const connectDatabase = require('../config/database');
  await connectDatabase();
  ({ User } = require('../models'));

  const app = require('../app');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  base = `http://localhost:${port}/api`;

  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email: 'csrf-user@example.com',
    passwordHash,
    displayName: 'CSRF User',
    role: 'user',
    emailVerified: true
  });

  await User.create({
    email: 'csrf-admin@example.com',
    passwordHash,
    displayName: 'CSRF Admin',
    role: 'admin',
    emailVerified: true
  });
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

describe('CSRF fallback for auth login', () => {
  it('allows login with valid X-CSRF-Token header and allowed origin even when cookie is absent', async () => {
    const client = axios.create({ validateStatus: null });

    const csrfResp = await client.get(`${base}/csrf-token`, {
      headers: { Origin: 'http://localhost:5173' }
    });

    assert.equal(csrfResp.status, 200);
    assert.ok(csrfResp.data.csrfToken, 'Expected csrfToken in response');

    const loginResp = await client.post(
      `${base}/auth/login`,
      { identifier: 'csrf-user@example.com', password: 'Password123!' },
      {
        headers: {
          Origin: 'http://localhost:5173',
          'X-CSRF-Token': csrfResp.data.csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );

    assert.equal(loginResp.status, 200, `Expected login to succeed, got ${loginResp.status}`);
    assert.ok(loginResp.data.success, 'Expected login success response');
    assert.ok(loginResp.data.data.accessToken, 'Expected accessToken in login response');
  });

  it('allows login with a loopback origin when X-CSRF-Token header is present', async () => {
    const client = axios.create({ validateStatus: null });

    const csrfResp = await client.get(`${base}/csrf-token`, {
      headers: { Origin: 'http://127.0.0.1:5173' }
    });

    assert.equal(csrfResp.status, 200);
    assert.ok(csrfResp.data.csrfToken, 'Expected csrfToken in response');

    const loginResp = await client.post(
      `${base}/auth/login`,
      { identifier: 'csrf-user@example.com', password: 'Password123!' },
      {
        headers: {
          Origin: 'http://127.0.0.1:5173',
          'X-CSRF-Token': csrfResp.data.csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );

    assert.equal(loginResp.status, 200, `Expected login to succeed, got ${loginResp.status}`);
    assert.ok(loginResp.data.success, 'Expected login success response');
  });

  it('rejects login when X-CSRF-Token header is missing even with allowed origin', async () => {
    const client = axios.create({ validateStatus: null });

    const loginResp = await client.post(
      `${base}/auth/login`,
      { identifier: 'csrf-user@example.com', password: 'Password123!' },
      {
        headers: {
          Origin: 'http://localhost:5173',
          'Content-Type': 'application/json'
        }
      }
    );

    assert.equal(loginResp.status, 403);
    assert.equal(loginResp.data.message, 'Restricted form submission.');
  });

  it('preserves normal CSRF protection for non-login auth routes', async () => {
    const client = axios.create({ validateStatus: null });

    const registerResp = await client.post(
      `${base}/auth/register`,
      {
        email: 'new-user@example.com',
        phoneNumber: '+85512345679',
        password: 'Password123!',
        displayName: 'New User'
      },
      {
        headers: {
          Origin: 'http://localhost:5173',
          'Content-Type': 'application/json'
        }
      }
    );

    assert.equal(registerResp.status, 403);
    assert.equal(registerResp.data.message, 'Restricted form submission.');
  });

  it('allows authenticated admin teacher creation when the client sends an allowed origin and CSRF token', async () => {
    const client = axios.create({ validateStatus: null });

    const csrfResp = await client.get(`${base}/csrf-token`, {
      headers: { Origin: 'http://localhost:5173' }
    });

    assert.equal(csrfResp.status, 200);

    const loginResp = await client.post(
      `${base}/auth/login`,
      { identifier: 'csrf-admin@example.com', password: 'Password123!' },
      {
        headers: {
          Origin: 'http://localhost:5173',
          'X-CSRF-Token': csrfResp.data.csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );

    assert.equal(loginResp.status, 200);
    const accessToken = loginResp.data?.data?.accessToken;
    assert.ok(accessToken, 'Expected accessToken in login response');

    const teacherResp = await client.post(
      `${base}/teachers`,
      {
        teacherId: 'AUTO-TEST-1',
        fullName: 'CSRF Test Teacher',
        gender: 'male',
        qualification: 'Bachelor',
        experienceYears: 2,
        status: 'active'
      },
      {
        headers: {
          Origin: 'http://localhost:5173',
          Authorization: `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfResp.data.csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );

    assert.equal(teacherResp.status, 201);
    assert.equal(teacherResp.data.success, true);
  });
});
