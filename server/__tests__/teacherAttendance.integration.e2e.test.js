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
let TeacherAttendance;
let AttendanceQrToken;
let AttendanceAttemptLog;

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

const createUserWithTeacher = async ({ email, password, displayName, role = 'user', teacherCode = 'T-001' }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    passwordHash,
    displayName,
    role,
    emailVerified: true,
    isActive: true
  });

  const teacher = await Teacher.create({
    teacherId: teacherCode,
    fullName: displayName,
    email,
    status: 'active'
  });

  return { user, teacher };
};

const createQrToken = async ({ token, rotationNumber, expiresAt, isRevoked = false }) => {
  return AttendanceQrToken.create({
    token,
    rotationNumber,
    expiresAt,
    isRevoked,
    revokedAt: isRevoked ? new Date() : null
  });
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

describe('Teacher Attendance end-to-end integration', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.LOGIN_OTP_ENABLED = 'false';

    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    const connectDatabase = require('../config/database');
    await connectDatabase();

    ({
      User,
      Teacher,
      SchoolSetting,
      TeacherAttendance,
      AttendanceQrToken,
      AttendanceAttemptLog
    } = require('../models'));

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
      TeacherAttendance.deleteMany({}),
      AttendanceQrToken.deleteMany({}),
      AttendanceAttemptLog.deleteMany({})
    ]);

    await seedAttendanceSettings();
  });

  it('1) Login succeeds for teacher account', async () => {
    await createUserWithTeacher({
      email: 'teacher-login@example.com',
      password: 'Password123!',
      displayName: 'Teacher Login',
      teacherCode: 'T-LOGIN'
    });

    const session = await login('teacher-login@example.com', 'Password123!');
    assert.ok(session.token);
  });

  it('2) QR scan token check-in + 4) GPS inside radius succeeds', async () => {
    await createUserWithTeacher({
      email: 'teacher-inside@example.com',
      password: 'Password123!',
      displayName: 'Teacher Inside',
      teacherCode: 'T-IN'
    });

    const session = await login('teacher-inside@example.com', 'Password123!');
    await createQrToken({
      token: 'qr-scan-token-inside-0001',
      rotationNumber: 1,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    const response = await axios.post(
      `${base}/teacher-attendance/check-in`,
      {
        attendanceMethod: 'QR',
        qrToken: 'qr-scan-token-inside-0001',
        latitude: SCHOOL_LAT,
        longitude: SCHOOL_LNG,
        gpsAccuracy: 5,
        device: 'web'
      },
      { headers: authHeaders(session) }
    );

    assert.equal(response.status, 201);
    assert.equal(response.data.success, true);
    assert.equal(response.data.data.attendanceMethod, 'QR');
    assert.equal(response.data.data.status, 'PRESENT');
  });

  it('3) GPS permission/missing coordinates rejected', async () => {
    await createUserWithTeacher({
      email: 'teacher-gps-missing@example.com',
      password: 'Password123!',
      displayName: 'Teacher GPS Missing',
      teacherCode: 'T-GPS-MISS'
    });

    const session = await login('teacher-gps-missing@example.com', 'Password123!');
    await createQrToken({ token: 'qr-gps-missing-0002', rotationNumber: 2, expiresAt: new Date(Date.now() + 60_000) });

    let error;
    try {
      await axios.post(
        `${base}/teacher-attendance/check-in`,
        { attendanceMethod: 'QR', qrToken: 'qr-gps-missing-0002' },
        { headers: authHeaders(session) }
      );
    } catch (err) {
      error = err;
    }

    assert.ok(error, 'Expected GPS missing check-in to fail');
    assert.equal(error.response?.status, 422);
    assert.equal(error.response?.data?.message, 'GPS location is required');
  });

  it('5) GPS outside radius rejected', async () => {
    await createUserWithTeacher({
      email: 'teacher-outside@example.com',
      password: 'Password123!',
      displayName: 'Teacher Outside',
      teacherCode: 'T-OUT'
    });

    const session = await login('teacher-outside@example.com', 'Password123!');
    await createQrToken({ token: 'qr-outside-radius-0003', rotationNumber: 3, expiresAt: new Date(Date.now() + 60_000) });

    let error;
    try {
      await axios.post(
        `${base}/teacher-attendance/check-in`,
        {
          attendanceMethod: 'QR',
          qrToken: 'qr-outside-radius-0003',
          latitude: 11.7001,
          longitude: 105.1001,
          gpsAccuracy: 8
        },
        { headers: authHeaders(session) }
      );
    } catch (err) {
      error = err;
    }

    assert.ok(error, 'Expected outside radius check-in to fail');
    assert.equal(error.response?.status, 422);
    assert.equal(error.response?.data?.message, 'Location is outside school radius');
  });

  it('6) QR expired rejected', async () => {
    await createUserWithTeacher({
      email: 'teacher-expired@example.com',
      password: 'Password123!',
      displayName: 'Teacher Expired',
      teacherCode: 'T-EXP'
    });

    const session = await login('teacher-expired@example.com', 'Password123!');
    await createQrToken({ token: 'qr-expired-token-0004', rotationNumber: 4, expiresAt: new Date(Date.now() - 1000) });

    let error;
    try {
      await axios.post(
        `${base}/teacher-attendance/check-in`,
        {
          attendanceMethod: 'QR',
          qrToken: 'qr-expired-token-0004',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG,
          gpsAccuracy: 6
        },
        { headers: authHeaders(session) }
      );
    } catch (err) {
      error = err;
    }

    assert.ok(error, 'Expected expired QR check-in to fail');
    assert.equal(error.response?.status, 422);
    assert.equal(error.response?.data?.message, 'QR token has expired');
  });

  it('7) QR revoked rejected', async () => {
    await createUserWithTeacher({
      email: 'teacher-revoked@example.com',
      password: 'Password123!',
      displayName: 'Teacher Revoked',
      teacherCode: 'T-REV'
    });

    const session = await login('teacher-revoked@example.com', 'Password123!');
    await createQrToken({
      token: 'qr-revoked-token-0005',
      rotationNumber: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      isRevoked: true
    });

    let error;
    try {
      await axios.post(
        `${base}/teacher-attendance/check-in`,
        {
          attendanceMethod: 'QR',
          qrToken: 'qr-revoked-token-0005',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG,
          gpsAccuracy: 6
        },
        { headers: authHeaders(session) }
      );
    } catch (err) {
      error = err;
    }

    assert.ok(error, 'Expected revoked QR check-in to fail');
    assert.equal(error.response?.status, 422);
    assert.equal(error.response?.data?.message, 'QR token has been revoked');
  });

  it('8) duplicate check-in rejected, 9) check-out succeeds, 10) history and 11) today endpoints return data', async () => {
    await createUserWithTeacher({
      email: 'teacher-flow@example.com',
      password: 'Password123!',
      displayName: 'Teacher Flow',
      teacherCode: 'T-FLOW'
    });

    const session = await login('teacher-flow@example.com', 'Password123!');
    await createQrToken({ token: 'qr-flow-token-a-0006', rotationNumber: 6, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    const checkInResponse = await axios.post(
      `${base}/teacher-attendance/check-in`,
      {
        attendanceMethod: 'QR',
        qrToken: 'qr-flow-token-a-0006',
        latitude: SCHOOL_LAT,
        longitude: SCHOOL_LNG,
        gpsAccuracy: 5
      },
      { headers: authHeaders(session) }
    );

    assert.equal(checkInResponse.status, 201);

    await createQrToken({ token: 'qr-flow-token-b-0007', rotationNumber: 7, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    let duplicateError;
    try {
      await axios.post(
        `${base}/teacher-attendance/check-in`,
        {
          attendanceMethod: 'QR',
          qrToken: 'qr-flow-token-b-0007',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG,
          gpsAccuracy: 5
        },
        { headers: authHeaders(session) }
      );
    } catch (err) {
      duplicateError = err;
    }

    assert.ok(duplicateError, 'Expected duplicate check-in to fail');
    assert.equal(duplicateError.response?.status, 409);

    const checkOutResponse = await axios.post(
      `${base}/teacher-attendance/check-out`,
      { latitude: SCHOOL_LAT, longitude: SCHOOL_LNG, gpsAccuracy: 6 },
      { headers: authHeaders(session) }
    );

    assert.equal(checkOutResponse.status, 200);
    assert.ok(checkOutResponse.data.data.checkOutTime, 'Expected checkOutTime to be set');

    const todayResponse = await axios.get(`${base}/teacher-attendance/today`, {
      headers: authHeaders(session)
    });

    assert.equal(todayResponse.status, 200);
    assert.equal(todayResponse.data.data.canCheckIn, false);
    assert.equal(todayResponse.data.data.canCheckOut, false);
    assert.ok(todayResponse.data.data.attendance);

    const historyResponse = await axios.get(`${base}/teacher-attendance/history`, {
      headers: authHeaders(session),
      params: { page: 1, perPage: 20 }
    });

    assert.equal(historyResponse.status, 200);
    assert.ok(Array.isArray(historyResponse.data.data.items));
    assert.ok(historyResponse.data.data.items.length >= 1);
  });

  it('12) admin summary APIs return expected attendance report payloads', async () => {
    await createUserWithTeacher({
      email: 'teacher-admin-summary@example.com',
      password: 'Password123!',
      displayName: 'Teacher Summary',
      teacherCode: 'T-SUM'
    });

    const teacherSession = await login('teacher-admin-summary@example.com', 'Password123!');
    await createQrToken({ token: 'qr-admin-summary-0008', rotationNumber: 8, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    await axios.post(
      `${base}/teacher-attendance/check-in`,
      {
        attendanceMethod: 'QR',
        qrToken: 'qr-admin-summary-0008',
        latitude: SCHOOL_LAT,
        longitude: SCHOOL_LNG,
        gpsAccuracy: 5
      },
      { headers: authHeaders(teacherSession) }
    );

    await createUserWithTeacher({
      email: 'admin-attendance@example.com',
      password: 'AdminPass123!',
      displayName: 'Attendance Admin',
      role: 'admin',
      teacherCode: 'T-ADMIN-LOOKUP'
    });

    const adminSession = await login('admin-attendance@example.com', 'AdminPass123!');

    const today = await axios.get(`${base}/admin/teacher-attendance/today`, {
      headers: authHeaders(adminSession)
    });
    assert.equal(today.status, 200);
    assert.ok(today.data.data.summary);

    const daily = await axios.get(`${base}/admin/teacher-attendance/reports/daily`, {
      headers: authHeaders(adminSession)
    });
    assert.equal(daily.status, 200);
    assert.ok(daily.data.data.summary);

    const monthly = await axios.get(`${base}/admin/teacher-attendance/reports/monthly`, {
      headers: authHeaders(adminSession)
    });
    assert.equal(monthly.status, 200);
    assert.ok(monthly.data.data.period);

    const excel = await axios.get(`${base}/admin/teacher-attendance/exports/excel`, {
      headers: authHeaders(adminSession),
      responseType: 'arraybuffer'
    });
    assert.equal(excel.status, 200);
    assert.equal(excel.headers['content-type'], 'application/vnd.ms-excel');

    const pdf = await axios.get(`${base}/admin/teacher-attendance/exports/pdf`, {
      headers: authHeaders(adminSession),
      responseType: 'arraybuffer'
    });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers['content-type'], 'application/pdf');
  });
});
