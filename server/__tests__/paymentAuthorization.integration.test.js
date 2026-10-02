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
let Student;
let Payment;

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
    csrfToken,
    cookie
  };
};

const headersFor = (session) => ({
  Authorization: `Bearer ${session.token}`,
  'X-CSRF-Token': session.csrfToken,
  Cookie: session.cookie
});

const createUser = async (email, role) => User.create({
  email,
  passwordHash: await bcrypt.hash('Password123!', 12),
  displayName: role,
  role,
  emailVerified: true,
  isActive: true
});

const paymentPayload = (studentId, receiptNumber, overrides = {}) => ({
  receiptNumber,
  studentId,
  studentName: 'Payment Test Student',
  className: 'Grade 1',
  tuitionAmount: 100,
  amount: 100,
  remainingBalance: 0,
  paymentDate: '2026-09-30T00:00:00.000Z',
  paymentMethod: 'cash',
  status: 'paid',
  ...overrides
});

describe('Payment API authorization', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.LOGIN_OTP_ENABLED = 'false';
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    require('../config');
    const connectDatabase = require('../config/database');
    await connectDatabase();
    ({ User, Student, Payment } = require('../models'));

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
    await Promise.all([User.deleteMany({}), Student.deleteMany({}), Payment.deleteMany({})]);
    await Student.create({ studentId: 'S-PAYMENT-1', fullName: 'Payment Test Student' });
  });

  it('allows limited users to list, view, and create, but denies update and delete', async () => {
    await createUser('limited-payment@example.com', 'LIMITED_STUDENT_PAYMENT');
    const session = await login('limited-payment@example.com', 'Password123!');
    const existing = await Payment.create(paymentPayload('S-PAYMENT-1', 'RCPT-LIMITED-1'));

    const listResponse = await axios.get(`${base}/payments`, { headers: headersFor(session) });
    assert.equal(listResponse.status, 200);
    assert.equal(listResponse.data.data.items.length, 1);

    const detailResponse = await axios.get(`${base}/payments/${existing._id}`, {
      headers: headersFor(session)
    });
    assert.equal(detailResponse.status, 200);
    assert.equal(detailResponse.data.data.receiptNumber, 'RCPT-LIMITED-1');

    const createResponse = await axios.post(`${base}/payments`,
      paymentPayload('S-PAYMENT-1', 'RCPT-LIMITED-2'),
      { headers: headersFor(session) }
    );
    assert.equal(createResponse.status, 201);
    assert.equal(createResponse.data.data.receiptNumber, 'RCPT-LIMITED-2');

    const updateResponse = await axios.put(`${base}/payments/${existing._id}`,
      paymentPayload('S-PAYMENT-1', 'RCPT-LIMITED-1', { amount: 90 }),
      { headers: headersFor(session), validateStatus: () => true }
    );
    assert.equal(updateResponse.status, 403);
    assert.equal(updateResponse.data.message, 'Forbidden: insufficient privileges');

    const deleteResponse = await axios.delete(`${base}/payments/${existing._id}`, {
      headers: headersFor(session),
      validateStatus: () => true
    });
    assert.equal(deleteResponse.status, 403);
    assert.equal(deleteResponse.data.message, 'Forbidden: insufficient privileges');
    assert.equal((await Payment.findById(existing._id)).amount, 100);

    const summaryResponse = await axios.get(`${base}/payments/summary/monthly`, {
      headers: headersFor(session),
      validateStatus: () => true
    });
    assert.equal(summaryResponse.status, 403);
  });

  it('preserves Admin list, detail, create, update, and delete access', async () => {
    await createUser('payment-admin@example.com', 'admin');
    const session = await login('payment-admin@example.com', 'Password123!');
    const existing = await Payment.create(paymentPayload('S-PAYMENT-1', 'RCPT-ADMIN-1'));

    const listResponse = await axios.get(`${base}/payments`, { headers: headersFor(session) });
    assert.equal(listResponse.status, 200);

    const detailResponse = await axios.get(`${base}/payments/${existing._id}`, {
      headers: headersFor(session)
    });
    assert.equal(detailResponse.status, 200);

    const createResponse = await axios.post(`${base}/payments`,
      paymentPayload('S-PAYMENT-1', 'RCPT-ADMIN-2'),
      { headers: headersFor(session) }
    );
    assert.equal(createResponse.status, 201);

    const updateResponse = await axios.put(`${base}/payments/${existing._id}`,
      paymentPayload('S-PAYMENT-1', 'RCPT-ADMIN-1', { amount: 90 }),
      { headers: headersFor(session) }
    );
    assert.equal(updateResponse.status, 200);
    assert.equal(updateResponse.data.data.amount, 90);

    const deleteResponse = await axios.delete(`${base}/payments/${createResponse.data.data._id}`, {
      headers: headersFor(session)
    });
    assert.equal(deleteResponse.status, 200);
    assert.equal(await Payment.exists({ receiptNumber: 'RCPT-ADMIN-2' }), null);
  });

  it('continues to deny unrelated authenticated non-admin roles', async () => {
    await createUser('ordinary-payment-user@example.com', 'user');
    const session = await login('ordinary-payment-user@example.com', 'Password123!');

    const response = await axios.get(`${base}/payments`, {
      headers: headersFor(session),
      validateStatus: () => true
    });

    assert.equal(response.status, 403);
    assert.equal(response.data.message, 'Forbidden: insufficient privileges');
  });
});