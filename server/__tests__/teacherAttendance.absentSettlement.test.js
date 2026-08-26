const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let models;
let services;

const day = new Date('2026-08-07T00:00:00');
const schoolSettings = {
  singletonKey: 'school-settings',
  attendanceEnabled: true,
  attendanceStart: '06:00',
  attendanceLateAfter: '08:00',
  attendanceEnd: '18:00',
  morningCheckInStart: '06:45',
  morningLateAfter: '06:55',
  morningCheckoutTime: '10:40',
  afternoonCheckInStart: '12:30',
  afternoonLateAfter: '12:40',
  afternoonCheckoutTime: '16:00',
  eveningCheckInStart: '18:00',
  eveningLateAfter: '18:10',
  eveningCheckoutTime: '20:00'
};

const createTeacher = async (code) => {
  const email = `${code.toLowerCase()}@example.com`;
  const user = await models.User.create({
    email,
    passwordHash: 'test-hash',
    displayName: code,
    role: 'user',
    emailVerified: true,
    isActive: true
  });
  const teacher = await models.Teacher.create({ teacherId: code, fullName: code, email, status: 'active' });
  return { user, teacher };
};

describe('persistent teacher attendance absent settlement', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    await require('../config/database')();
    models = require('../models');
    services = require('../services/teacherAttendance').createTeacherAttendanceServices();
    await Promise.all([models.SchoolSetting.init(), models.User.init(), models.TeacherAttendance.init()]);
  });

  beforeEach(async () => {
    await Promise.all([
      models.SchoolSetting.deleteMany({}),
      models.Teacher.deleteMany({}),
      models.User.deleteMany({}),
      models.TeacherAttendance.deleteMany({})
    ]);
    await models.SchoolSetting.create(schoolSettings);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('does not settle before session end and creates Absent after session end', async () => {
    const { teacher } = await createTeacher('T-ABSENT-1');
    const beforeEnd = await services.absentSettlementService.settleAbsent({
      date: day,
      sessionType: 'morning',
      referenceTime: new Date('2026-08-07T10:39:00')
    });
    assert.equal(beforeEnd.settled, 0);
    assert.equal(await models.TeacherAttendance.countDocuments({}), 0);

    const afterEnd = await services.absentSettlementService.settleAbsent({
      date: day,
      sessionType: 'morning',
      referenceTime: new Date('2026-08-07T10:40:00')
    });
    assert.equal(afterEnd.settled, 1);
    const absent = await models.TeacherAttendance.findOne({ teacherId: teacher._id }).lean();
    assert.equal(absent.status, 'ABSENT');
    assert.equal(absent.sessionType, 'morning');
  });

  it('is idempotent and preserves Present, Late, Early Leave, and legacy records', async () => {
    const present = await createTeacher('T-PRESENT');
    const late = await createTeacher('T-LATE');
    const leave = await createTeacher('T-LEAVE');
    const legacy = await createTeacher('T-LEGACY');
    await models.TeacherAttendance.create([
      { teacherId: present.teacher._id, userId: present.user._id, attendanceDate: day, sessionType: 'morning', checkInTime: new Date('2026-08-07T06:50:00'), attendanceMethod: 'MANUAL', status: 'PRESENT' },
      { teacherId: late.teacher._id, userId: late.user._id, attendanceDate: day, sessionType: 'morning', checkInTime: new Date('2026-08-07T07:00:00'), attendanceMethod: 'MANUAL', status: 'LATE' },
      { teacherId: leave.teacher._id, userId: leave.user._id, attendanceDate: day, sessionType: 'morning', checkInTime: new Date('2026-08-07T06:50:00'), checkOutTime: new Date('2026-08-07T10:00:00'), attendanceMethod: 'MANUAL', status: 'LEAVE' },
      { teacherId: legacy.teacher._id, userId: legacy.user._id, attendanceDate: day, checkInTime: new Date('2026-08-07T06:50:00'), attendanceMethod: 'MANUAL', status: 'PRESENT' }
    ]);

    const first = await services.absentSettlementService.settleAbsent({ date: day, sessionType: 'morning', referenceTime: new Date('2026-08-07T11:00:00') });
    const second = await services.absentSettlementService.settleAbsent({ date: day, sessionType: 'morning', referenceTime: new Date('2026-08-07T11:01:00') });
    assert.equal(first.settled, 0);
    assert.equal(first.preserved, 4);
    assert.equal(second.settled, 0);
    assert.equal(second.preserved, 4);
    assert.equal(await models.TeacherAttendance.countDocuments({}), 4);
  });

  it('settles sessions independently and preserves legacy records only for Morning', async () => {
    const teacher = await createTeacher('T-INDEPENDENT');
    await models.TeacherAttendance.create({ teacherId: teacher.teacher._id, userId: teacher.user._id, attendanceDate: day, checkInTime: new Date('2026-08-07T06:50:00'), attendanceMethod: 'MANUAL', status: 'PRESENT' });

    const morning = await services.absentSettlementService.settleAbsent({ date: day, sessionType: 'morning', referenceTime: new Date('2026-08-07T11:00:00') });
    const afternoonBeforeEnd = await services.absentSettlementService.settleAbsent({ date: day, sessionType: 'afternoon', referenceTime: new Date('2026-08-07T15:59:00') });
    const afternoon = await services.absentSettlementService.settleAbsent({ date: day, sessionType: 'afternoon', referenceTime: new Date('2026-08-07T16:01:00') });
    assert.equal(morning.settled, 0);
    assert.equal(afternoonBeforeEnd.settled, 0);
    assert.equal(afternoon.settled, 1);
    assert.equal(await models.TeacherAttendance.countDocuments({ sessionType: null }), 1);
    assert.equal(await models.TeacherAttendance.countDocuments({ sessionType: 'afternoon', status: 'ABSENT' }), 1);
  });
});