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

const studentPayload = (studentId, fullName) => ({
  studentId,
  fullName,
  gender: 'other',
  status: 'active'
});

describe('Student API authorization', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.LOGIN_OTP_ENABLED = 'false';
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    require('../config');
    const connectDatabase = require('../config/database');
    await connectDatabase();
    ({ User, Student } = require('../models'));

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
    await Promise.all([User.deleteMany({}), Student.deleteMany({})]);
  });

  it('allows limited users to list, view, and create, but denies update and delete', async () => {
    await createUser('limited-student@example.com', 'LIMITED_STUDENT_PAYMENT');
    const session = await login('limited-student@example.com', 'Password123!');
    const existing = await Student.create(studentPayload('S-LIMITED-1', 'Existing Student'));

    const listResponse = await axios.get(`${base}/students`, { headers: headersFor(session) });
    assert.equal(listResponse.status, 200);
    assert.equal(listResponse.data.data.items.length, 1);

    const detailResponse = await axios.get(`${base}/students/${existing._id}`, {
      headers: headersFor(session)
    });
    assert.equal(detailResponse.status, 200);
    assert.equal(detailResponse.data.data.studentId, 'S-LIMITED-1');

    const createResponse = await axios.post(`${base}/students`,
      studentPayload('S-LIMITED-2', 'Created Student'),
      { headers: headersFor(session) }
    );
    assert.equal(createResponse.status, 201);
    assert.equal(createResponse.data.data.studentId, 'S-LIMITED-2');

    const updateResponse = await axios.put(`${base}/students/${existing._id}`,
      studentPayload('S-LIMITED-1', 'Changed Student'),
      { headers: headersFor(session), validateStatus: () => true }
    );
    assert.equal(updateResponse.status, 403);
    assert.equal(updateResponse.data.message, 'Forbidden: insufficient privileges');

    const deleteResponse = await axios.delete(`${base}/students/${existing._id}`, {
      headers: headersFor(session),
      validateStatus: () => true
    });
    assert.equal(deleteResponse.status, 403);
    assert.equal(deleteResponse.data.message, 'Forbidden: insufficient privileges');
    assert.equal((await Student.findById(existing._id)).fullName, 'Existing Student');
  });

  it('preserves Admin list, detail, create, update, and delete access', async () => {
    await createUser('student-admin@example.com', 'admin');
    const session = await login('student-admin@example.com', 'Password123!');
    const existing = await Student.create(studentPayload('S-ADMIN-1', 'Admin Existing'));

    const listResponse = await axios.get(`${base}/students`, { headers: headersFor(session) });
    assert.equal(listResponse.status, 200);

    const detailResponse = await axios.get(`${base}/students/${existing._id}`, {
      headers: headersFor(session)
    });
    assert.equal(detailResponse.status, 200);

    const createResponse = await axios.post(`${base}/students`,
      studentPayload('S-ADMIN-2', 'Admin Created'),
      { headers: headersFor(session) }
    );
    assert.equal(createResponse.status, 201);

    const updateResponse = await axios.put(`${base}/students/${existing._id}`,
      studentPayload('S-ADMIN-1', 'Admin Updated'),
      { headers: headersFor(session) }
    );
    assert.equal(updateResponse.status, 200);
    assert.equal(updateResponse.data.data.fullName, 'Admin Updated');

    const deleteResponse = await axios.delete(`${base}/students/${createResponse.data.data._id}`, {
      headers: headersFor(session)
    });
    assert.equal(deleteResponse.status, 200);
    assert.equal(await Student.exists({ studentId: 'S-ADMIN-2' }), null);
  });

  it('continues to deny unrelated authenticated non-admin roles', async () => {
    await createUser('ordinary-user@example.com', 'user');
    const session = await login('ordinary-user@example.com', 'Password123!');

    const response = await axios.get(`${base}/students`, {
      headers: headersFor(session),
      validateStatus: () => true
    });

    assert.equal(response.status, 403);
    assert.equal(response.data.message, 'Forbidden: insufficient privileges');
  });
});