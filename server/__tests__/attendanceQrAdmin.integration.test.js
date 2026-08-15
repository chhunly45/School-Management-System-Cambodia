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
let Teacher;
let SchoolSetting;
let AttendanceQrToken;

const SCHOOL_LAT = 11.5564;
const SCHOOL_LNG = 104.9282;

const getCsrf = async () => {
  const response = await axios.get(`${base}/csrf-token`);
  const csrfToken = response.data && response.data.csrfToken;
  const cookie = (response.headers['set-cookie'] || []).join('; ');
  assert.ok(csrfToken, 'Expected csrfToken in response');
  return { csrfToken, cookie };
};

const authHeaders = ({ token, csrfToken, cookie }) => ({
  Authorization: `Bearer ${token}`,
  'X-CSRF-Token': csrfToken,
  Cookie: cookie
});

const login = async (identifier, password) => {
  const { csrfToken, cookie } = await getCsrf();
  const response = await axios.post(
    `${base}/auth/login`,
    { identifier, password },
    { headers: { 'X-CSRF-Token': csrfToken, Cookie: cookie } }
  );

  const token = response?.data?.data?.accessToken || response?.data?.data?.authToken;
  assert.ok(token, 'Expected login token');
  return { token, csrfToken, cookie };
};

const createUser = async ({ email, password, displayName, role = 'user' }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({
    email,
    passwordHash,
    displayName,
    role,
    emailVerified: true,
    isActive: true
  });
};

const createUserWithTeacher = async ({ email, password, displayName, role = 'user', teacherCode = 'T-001' }) => {
  const user = await createUser({ email, password, displayName, role });

  const teacher = await Teacher.create({
    teacherId: teacherCode,
    fullName: displayName,
    email,
    status: 'active'
  });

  return { user, teacher };
};

const seedAttendanceSettings = async () => {
  await SchoolSetting.create({
    singletonKey: 'school-settings',
    attendanceEnabled: true,
    attendanceQrEnabled: true,
    attendanceFaceEnabled: false,
    attendanceGpsEnabled: true,
    attendanceSchoolLatitude: SCHOOL_LAT,
    attendanceSchoolLongitude: SCHOOL_LNG,
    attendanceAllowedRadius: 120,
    attendanceLateAfter: '23:59',
    attendanceStart: '00:00',
    attendanceEnd: '23:59',
    attendanceQrRotationSeconds: 30
  });
};

describe('Attendance QR admin integration', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.LOGIN_OTP_ENABLED = 'false';

    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    const connectDatabase = require('../config/database');
    await connectDatabase();

    ({ User, Teacher, SchoolSetting, AttendanceQrToken } = require('../models'));

    const app = require('../app');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    base = `http://localhost:${port}/api`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      SchoolSetting.deleteMany({}),
      AttendanceQrToken.deleteMany({})
    ]);

    await seedAttendanceSettings();
  });

  it('admin can generate and retrieve the current active QR token', async () => {
    await createUser({
      email: 'admin-qr@example.com',
      password: 'Password123!',
      displayName: 'QR Admin',
      role: 'admin'
    });

    const adminSession = await login('admin-qr@example.com', 'Password123!');

    const generated = await axios.post(
      `${base}/admin/attendance/qr/generate`,
      { expiresInSeconds: 300 },
      { headers: authHeaders(adminSession) }
    );

    assert.equal(generated.status, 201);
    assert.equal(generated.data.success, true);
    assert.equal(generated.data.data.current.status, 'ACTIVE');
    assert.equal(generated.data.data.current.qrPayloadFormat, 'json-token-v1');
    assert.ok(generated.data.data.current.token);
    assert.equal(generated.data.data.current.qrPayload, JSON.stringify({ token: generated.data.data.current.token }));

    const current = await axios.get(`${base}/admin/attendance/qr`, { headers: authHeaders(adminSession) });
    assert.equal(current.status, 200);
    assert.equal(current.data.data.current.token, generated.data.data.current.token);
  });

  it('non-admin cannot generate a QR token', async () => {
    await createUser({
      email: 'teacher-no-admin@example.com',
      password: 'Password123!',
      displayName: 'No Admin',
      role: 'user'
    });

    const session = await login('teacher-no-admin@example.com', 'Password123!');

    await assert.rejects(
      async () => {
        await axios.post(
          `${base}/admin/attendance/qr/generate`,
          {},
          { headers: authHeaders(session) }
        );
      },
      (error) => error?.response?.status === 403
    );
  });

  it('rotation revokes the previous token and replaces it with a new active token', async () => {
    await createUser({
      email: 'admin-rotate@example.com',
      password: 'Password123!',
      displayName: 'Rotate Admin',
      role: 'admin'
    });

    const adminSession = await login('admin-rotate@example.com', 'Password123!');
    const first = await axios.post(
      `${base}/admin/attendance/qr/generate`,
      { expiresInSeconds: 180 },
      { headers: authHeaders(adminSession) }
    );

    const rotated = await axios.post(
      `${base}/admin/attendance/qr/rotate`,
      { expiresInSeconds: 240 },
      { headers: authHeaders(adminSession) }
    );

    assert.equal(rotated.status, 201);
    assert.notEqual(rotated.data.data.current.token, first.data.data.current.token);
    assert.ok(Array.isArray(rotated.data.data.previous));
    assert.equal(rotated.data.data.previous[0].token, first.data.data.current.token);
    assert.equal(rotated.data.data.previous[0].status, 'REVOKED');

    const revokedDoc = await AttendanceQrToken.findOne({ token: first.data.data.current.token }).lean();
    assert.equal(revokedDoc.isRevoked, true);
    assert.ok(revokedDoc.revokedAt);
  });

  it('generated token is accepted by existing teacher attendance validation', async () => {
    await createUser({
      email: 'admin-accept@example.com',
      password: 'Password123!',
      displayName: 'Accept Admin',
      role: 'admin'
    });
    await createUserWithTeacher({
      email: 'teacher-accept@example.com',
      password: 'Password123!',
      displayName: 'Teacher Accept',
      teacherCode: 'T-QR-ACCEPT'
    });

    const adminSession = await login('admin-accept@example.com', 'Password123!');
    const teacherSession = await login('teacher-accept@example.com', 'Password123!');

    const generated = await axios.post(
      `${base}/admin/attendance/qr/generate`,
      { expiresInSeconds: 300 },
      { headers: authHeaders(adminSession) }
    );

    const checkIn = await axios.post(
      `${base}/teacher-attendance/check-in`,
      {
        attendanceMethod: 'QR',
        qrToken: generated.data.data.current.token,
        latitude: SCHOOL_LAT,
        longitude: SCHOOL_LNG,
        gpsAccuracy: 5,
        device: 'web'
      },
      { headers: authHeaders(teacherSession) }
    );

    assert.equal(checkIn.status, 201);
    assert.equal(checkIn.data.data.attendanceMethod, 'QR');
  });

  it('revoked and expired tokens are rejected by existing teacher attendance validation', async () => {
    await createUser({
      email: 'admin-reject@example.com',
      password: 'Password123!',
      displayName: 'Reject Admin',
      role: 'admin'
    });
    await createUserWithTeacher({
      email: 'teacher-revoked-check@example.com',
      password: 'Password123!',
      displayName: 'Teacher Revoked Check',
      teacherCode: 'T-QR-REV'
    });
    await createUserWithTeacher({
      email: 'teacher-expired-check@example.com',
      password: 'Password123!',
      displayName: 'Teacher Expired Check',
      teacherCode: 'T-QR-EXP'
    });

    const adminSession = await login('admin-reject@example.com', 'Password123!');
    const revokedTeacherSession = await login('teacher-revoked-check@example.com', 'Password123!');
    const expiredTeacherSession = await login('teacher-expired-check@example.com', 'Password123!');

    const generated = await axios.post(
      `${base}/admin/attendance/qr/generate`,
      { expiresInSeconds: 300 },
      { headers: authHeaders(adminSession) }
    );

    const revokedToken = generated.data.data.current.token;
    await axios.post(`${base}/admin/attendance/qr/revoke`, {}, { headers: authHeaders(adminSession) });

    await assert.rejects(
      async () => {
        await axios.post(
          `${base}/teacher-attendance/check-in`,
          {
            attendanceMethod: 'QR',
            qrToken: revokedToken,
            latitude: SCHOOL_LAT,
            longitude: SCHOOL_LNG,
            gpsAccuracy: 4,
            device: 'web'
          },
          { headers: authHeaders(revokedTeacherSession) }
        );
      },
      (error) => error?.response?.status === 422 && error?.response?.data?.message === 'QR token has been revoked'
    );

    const expiredDoc = await AttendanceQrToken.create({
      token: 'attqr_expired_manual_token_0001',
      rotationNumber: 999,
      expiresAt: new Date(Date.now() - 1),
      isRevoked: false,
      revokedAt: null
    });

    await assert.rejects(
      async () => {
        await axios.post(
          `${base}/teacher-attendance/check-in`,
          {
            attendanceMethod: 'QR',
            qrToken: expiredDoc.token,
            latitude: SCHOOL_LAT,
            longitude: SCHOOL_LNG,
            gpsAccuracy: 4,
            device: 'web'
          },
          { headers: authHeaders(expiredTeacherSession) }
        );
      },
      (error) => error?.response?.status === 422 && error?.response?.data?.message === 'QR token has expired'
    );
  });
});