const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let Teacher;
let User;
let teacherService;
let authService;
let originalRequestPasswordReset;

const createTeacher = (overrides = {}) => Teacher.create({
  teacherId: `T-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  fullName: 'Test Teacher',
  email: 'teacher@example.com',
  phone: '012345678',
  status: 'active',
  ...overrides
});

before(async () => {
  process.env.NODE_ENV = 'test';
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  const connectDatabase = require('../config/database');
  await connectDatabase();
  ({ Teacher, User } = require('../models'));
  authService = require('../services/auth.service');
  teacherService = require('../services/teacher.service');
  originalRequestPasswordReset = authService.requestPasswordReset;
});

after(async () => {
  authService.requestPasswordReset = originalRequestPasswordReset;
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  authService.requestPasswordReset = async () => ({ expiresIn: 300 });
  await Promise.all([Teacher.deleteMany({}), User.deleteMany({})]);
});

describe('teacher account provisioning', () => {
  it('creates an active user with a bcrypt password and safe response data', async () => {
    const teacher = await createTeacher();
    const result = await teacherService.createTeacherAccount(teacher._id);
    const user = await User.findById(result.user.id).lean();

    assert.equal(result.accountCreated, true);
    assert.equal(result.user.email, 'teacher@example.com');
    assert.equal(result.user.role, 'teacher');
    assert.equal(result.user.isActive, true);
    assert.equal(String(user.teacherId), String(teacher._id));
    assert.equal(result.passwordSetup, 'email-reset');
    assert.equal(Object.prototype.hasOwnProperty.call(result.user, 'passwordHash'), false);
    assert.ok(user.passwordHash);
    assert.notEqual(user.passwordHash, 'teacher@example.com');
    assert.equal(await bcrypt.compare('not-the-random-password', user.passwordHash), false);
  });

  it('rejects inactive, phone-only, duplicate email, and duplicate phone teachers', async () => {
    const inactive = await createTeacher({ email: 'inactive@example.com', status: 'inactive' });
    await assert.rejects(() => teacherService.createTeacherAccount(inactive._id), /Only active teachers/);

    const phoneOnly = await createTeacher({ email: undefined, phone: '012345679' });
    await assert.rejects(() => teacherService.createTeacherAccount(phoneOnly._id), /valid email/);

    const existingEmail = await createTeacher({ email: 'duplicate@example.com', phone: '012345680' });
    await User.create({
      email: existingEmail.email,
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'Existing Email User',
      role: 'user'
    });
    await assert.rejects(() => teacherService.createTeacherAccount(existingEmail._id), /already exists for this teacher email/);

    const existingPhone = await createTeacher({ email: 'other@example.com', phone: '012345681' });
    await User.create({
      email: 'phone-owner@example.com',
      phoneNumber: '+85512345681',
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'Existing Phone User',
      role: 'user'
    });
    await assert.rejects(() => teacherService.createTeacherAccount(existingPhone._id), /already exists for this teacher phone number/);
  });

  it('supports authentication and existing attendance actor resolution after provisioning', async () => {
    const teacher = await createTeacher({ email: 'resolve@example.com', phone: '012345682' });
    const result = await teacherService.createTeacherAccount(teacher._id);
    const user = await User.findById(result.user.id);
    user.passwordHash = await bcrypt.hash('Password123!', 12);
    await user.save();

    const login = await authService.loginUser('resolve@example.com', 'Password123!', { useOtp: false });
    assert.equal(login.user.role, 'teacher');

    const attendanceService = require('../services/teacherAttendance.service').createTeacherAttendanceService({
      TeacherModel: Teacher,
      TeacherAttendanceModel: require('../models').TeacherAttendance,
      AttendanceAttemptLogModel: require('../models').AttendanceAttemptLog
    });
    const actor = await attendanceService.resolveActorFromUser(user);
    assert.equal(String(actor.teacherId), String(teacher._id));
    assert.equal(String(actor.userId), String(user._id));
  });

  it('continues to accept existing non-teacher roles', async () => {
    const roles = ['user', 'seller', 'admin', 'moderator'];
    const passwordHash = await bcrypt.hash('Password123!', 12);

    await User.create(roles.map((role, index) => ({
      email: `role-${index}@example.com`,
      passwordHash,
      displayName: `${role} account`,
      role,
      emailVerified: true,
      isActive: true
    })));

    assert.deepEqual(
      (await User.find({ email: /@example\.com$/ }).select('role').sort({ email: 1 }).lean()).map((item) => item.role).sort(),
      roles.sort()
    );
  });
});
