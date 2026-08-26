const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let models;
let services;

const FIXED_NOW = new Date('2026-08-07T07:30:00');
const SCHOOL_LAT = 11.5564;
const SCHOOL_LNG = 104.9282;

const createDefaultSettings = async (overrides = {}) => models.SchoolSetting.create({
  singletonKey: 'school-settings',
  attendanceEnabled: true,
  attendanceQrEnabled: true,
  attendanceFaceEnabled: false,
  attendanceGpsEnabled: true,
  attendanceSchoolLatitude: SCHOOL_LAT,
  attendanceSchoolLongitude: SCHOOL_LNG,
  attendanceAllowedRadius: 100,
  attendanceLateAfter: '08:00',
  attendanceStart: '06:00',
  attendanceEnd: '18:00',
  attendanceQrRotationSeconds: 30,
  ...overrides
});

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const connectDatabase = require('../config/database');
  await connectDatabase();

  models = require('../models');
  services = require('../services/teacherAttendance');

  await Promise.all([
    models.SchoolSetting.init(),
    models.TeacherAttendance.init(),
    models.AttendanceQrToken.init(),
    models.AttendanceAttemptLog.init()
  ]);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    models.SchoolSetting.deleteMany({}),
    models.TeacherAttendance.deleteMany({}),
    models.AttendanceQrToken.deleteMany({}),
    models.AttendanceAttemptLog.deleteMany({})
  ]);
});

describe('Teacher Attendance business services', () => {
  it('validates check-in for logged-in teacher and computes PRESENT status', async () => {
    await createDefaultSettings();

    const qrToken = await models.AttendanceQrToken.create({
      token: 'token-checkin-success-0001',
      rotationNumber: 1,
      expiresAt: new Date(FIXED_NOW.getTime() + 60_000)
    });

    const teacherServices = services.createTeacherAttendanceServices({
      nowProvider: () => FIXED_NOW
    });

    const payload = await teacherServices.checkInValidationService.validateCheckIn({
      actor: { teacherId: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId() },
      attendanceMethod: 'QR',
      qrToken: qrToken.token,
      latitude: SCHOOL_LAT,
      longitude: SCHOOL_LNG,
      gpsAccuracy: 10
    });

    assert.equal(payload.status, 'PRESENT');
    assert.equal(String(payload.qrTokenId), String(qrToken._id));
    assert.ok(payload.distanceFromSchool <= 1);
  });

  it('rejects check-in for invalid teacher session', async () => {
    await createDefaultSettings();
    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });

    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor: { userId: new mongoose.Types.ObjectId() },
          attendanceMethod: 'MANUAL'
        });
      },
      (error) => error && error.code === 'SESSION_EXPIRED'
    );
  });

  it('marks attendance as LATE when check-in is after late cutoff', async () => {
    await createDefaultSettings({ attendanceLateAfter: '07:00' });

    const teacherServices = services.createTeacherAttendanceServices({
      nowProvider: () => FIXED_NOW
    });

    const payload = await teacherServices.checkInValidationService.validateCheckIn({
      actor: { teacherId: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId() },
      attendanceMethod: 'MANUAL',
      latitude: SCHOOL_LAT,
      longitude: SCHOOL_LNG
    });

    assert.equal(payload.status, 'LATE');
  });

  it('uses morning session rules and allows late check-in after checkout time', async () => {
    await createDefaultSettings({
      morningCheckInStart: '06:45',
      morningLateAfter: '06:55',
      morningCheckoutTime: '10:40'
    });

    const actor = { teacherId: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId() };
    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => new Date('2026-08-07T06:50:00') });

    const presentPayload = await teacherServices.checkInValidationService.validateCheckIn({
      actor,
      attendanceMethod: 'MANUAL',
      sessionType: 'morning',
      latitude: SCHOOL_LAT,
      longitude: SCHOOL_LNG
    });
    assert.equal(presentPayload.status, 'PRESENT');

    const lateServices = services.createTeacherAttendanceServices({ nowProvider: () => new Date('2026-08-07T06:56:00') });
    const latePayload = await lateServices.checkInValidationService.validateCheckIn({
      actor,
      attendanceMethod: 'MANUAL',
      sessionType: 'morning',
      latitude: SCHOOL_LAT,
      longitude: SCHOOL_LNG
    });
    assert.equal(latePayload.status, 'LATE');

    const afterCheckoutServices = services.createTeacherAttendanceServices({ nowProvider: () => new Date('2026-08-07T10:45:00') });
    const afterCheckoutPayload = await afterCheckoutServices.checkInValidationService.validateCheckIn({
      actor,
      attendanceMethod: 'MANUAL',
      sessionType: 'morning',
      latitude: SCHOOL_LAT,
      longitude: SCHOOL_LNG
    });
    assert.equal(afterCheckoutPayload.status, 'LATE');
  });

  it('keeps morning and afternoon session records independent on the same date', async () => {
    await createDefaultSettings({
      morningCheckInStart: '06:45',
      morningLateAfter: '06:55',
      morningCheckoutTime: '10:40',
      afternoonCheckInStart: '12:30',
      afternoonLateAfter: '12:40',
      afternoonCheckoutTime: '16:00'
    });

    const teacherId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const actor = { teacherId, userId };

    await models.TeacherAttendance.create({
      teacherId,
      userId,
      attendanceDate: new Date('2026-08-07T00:00:00'),
      sessionType: 'morning',
      checkInTime: new Date('2026-08-07T06:50:00'),
      attendanceMethod: 'MANUAL',
      status: 'PRESENT'
    });

    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => new Date('2026-08-07T12:35:00') });
    const payload = await teacherServices.checkInValidationService.validateCheckIn({
      actor,
      attendanceMethod: 'MANUAL',
      sessionType: 'afternoon',
      latitude: SCHOOL_LAT,
      longitude: SCHOOL_LNG
    });

    assert.equal(payload.sessionType, 'afternoon');
    assert.equal(payload.status, 'PRESENT');

    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'MANUAL',
          sessionType: 'morning',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG
        });
      },
      (error) => error && error.code === 'ALREADY_CHECKED_IN'
    );
  });

  it('rejects duplicate check-in when teacher already checked in', async () => {
    await createDefaultSettings();
    const teacherId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await models.TeacherAttendance.create({
      teacherId,
      userId,
      attendanceDate: new Date('2026-08-07T00:00:00'),
      checkInTime: new Date('2026-08-07T07:00:00'),
      attendanceMethod: 'MANUAL',
      status: 'PRESENT'
    });

    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });

    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor: { teacherId, userId },
          attendanceMethod: 'MANUAL',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG
        });
      },
      (error) => error && error.code === 'ALREADY_CHECKED_IN'
    );
  });

  it('rejects check-in when attendance, QR, or GPS policy flags disable flow', async () => {
    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });
    const actor = { teacherId: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId() };

    await createDefaultSettings({ attendanceEnabled: false });
    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'MANUAL'
        });
      },
      (error) => error && error.code === 'ATTENDANCE_DISABLED'
    );

    await models.SchoolSetting.deleteMany({});
    await createDefaultSettings({ attendanceQrEnabled: false });
    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'QR',
          qrToken: 'token-any'
        });
      },
      (error) => error && error.code === 'QR_DISABLED'
    );

    await models.SchoolSetting.deleteMany({});
    await createDefaultSettings({ attendanceGpsEnabled: true });
    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'MANUAL'
        });
      },
      (error) => error && error.code === 'GPS_DENIED'
    );
  });

  it('rejects outside attendance window and outside radius', async () => {
    await createDefaultSettings({ attendanceStart: '09:00', attendanceEnd: '17:00' });
    const actor = { teacherId: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId() };

    let teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });
    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'MANUAL',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG
        });
      },
      (error) => error && error.code === 'OUTSIDE_ATTENDANCE_WINDOW'
    );

    await models.SchoolSetting.deleteMany({});
    await createDefaultSettings();
    teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });

    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'MANUAL',
          latitude: 11.6000,
          longitude: 104.9500
        });
      },
      (error) => error && error.code === 'OUTSIDE_RADIUS'
    );
  });

  it('rejects QR token when expired or revoked', async () => {
    await createDefaultSettings();

    await models.AttendanceQrToken.create({
      token: 'token-expired-0002',
      rotationNumber: 2,
      expiresAt: new Date(FIXED_NOW.getTime() - 1000)
    });

    await models.AttendanceQrToken.create({
      token: 'token-revoked-0003',
      rotationNumber: 3,
      expiresAt: new Date(FIXED_NOW.getTime() + 60_000),
      isRevoked: true,
      revokedAt: new Date(FIXED_NOW.getTime() - 500)
    });

    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });
    const actor = { teacherId: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId() };

    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'QR',
          qrToken: 'token-expired-0002',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG
        });
      },
      (error) => error && error.code === 'QR_EXPIRED'
    );

    await assert.rejects(
      async () => {
        await teacherServices.checkInValidationService.validateCheckIn({
          actor,
          attendanceMethod: 'QR',
          qrToken: 'token-revoked-0003',
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG
        });
      },
      (error) => error && error.code === 'QR_REVOKED'
    );
  });

  it('validates check-out constraints for already checked in and not already checked out', async () => {
    await createDefaultSettings();
    const teacherId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const attendanceDate = new Date('2026-08-07T00:00:00');

    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });

    await assert.rejects(
      async () => {
        await teacherServices.checkOutValidationService.validateCheckOut({
          actor: { teacherId, userId },
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG
        });
      },
      (error) => error && error.code === 'NOT_CHECKED_IN'
    );

    await models.TeacherAttendance.create({
      teacherId,
      userId,
      attendanceDate,
      checkInTime: new Date('2026-08-07T06:55:00'),
      attendanceMethod: 'MANUAL',
      status: 'PRESENT'
    });

    const result = await teacherServices.checkOutValidationService.validateCheckOut({
      actor: { teacherId, userId },
      latitude: SCHOOL_LAT,
      longitude: SCHOOL_LNG,
      gpsAccuracy: 5
    });

    assert.equal(result.status, 'PRESENT');

    await models.TeacherAttendance.updateOne(
      { teacherId, attendanceDate },
      { $set: { checkOutTime: new Date('2026-08-07T08:00:00') } }
    );

    await assert.rejects(
      async () => {
        await teacherServices.checkOutValidationService.validateCheckOut({
          actor: { teacherId, userId },
          latitude: SCHOOL_LAT,
          longitude: SCHOOL_LNG
        });
      },
      (error) => error && error.code === 'ALREADY_CHECKED_OUT'
    );
  });

  it('returns paginated attendance history', async () => {
    await createDefaultSettings();
    const teacherId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await models.TeacherAttendance.create([
      {
        teacherId,
        userId,
        attendanceDate: new Date('2026-08-06T00:00:00'),
        checkInTime: new Date('2026-08-06T07:00:00'),
        attendanceMethod: 'MANUAL',
        status: 'PRESENT'
      },
      {
        teacherId,
        userId,
        attendanceDate: new Date('2026-08-07T00:00:00'),
        checkInTime: new Date('2026-08-07T07:10:00'),
        attendanceMethod: 'MANUAL',
        status: 'LATE'
      }
    ]);

    const teacherServices = services.createTeacherAttendanceServices({ nowProvider: () => FIXED_NOW });
    const history = await teacherServices.attendanceHistoryQueryService.queryHistory({
      teacherId,
      fromDate: '2026-08-06',
      toDate: '2026-08-07',
      page: 1,
      perPage: 1
    });

    assert.equal(history.items.length, 1);
    assert.equal(history.meta.total, 2);
  });

  it('returns today summary with computed absent count', async () => {
    await createDefaultSettings();

    await models.TeacherAttendance.create([
      {
        teacherId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        attendanceDate: new Date('2026-08-07T00:00:00'),
        checkInTime: new Date('2026-08-07T07:00:00'),
        checkOutTime: null,
        attendanceMethod: 'MANUAL',
        status: 'PRESENT'
      },
      {
        teacherId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        attendanceDate: new Date('2026-08-07T00:00:00'),
        checkInTime: new Date('2026-08-07T07:10:00'),
        checkOutTime: new Date('2026-08-07T11:00:00'),
        attendanceMethod: 'MANUAL',
        status: 'LATE'
      }
    ]);

    const teacherServices = services.createTeacherAttendanceServices({
      nowProvider: () => FIXED_NOW,
      TeacherModel: {
        countDocuments: async () => 3
      }
    });
    const summary = await teacherServices.todayAttendanceSummaryService.getTodaySummary();

    assert.equal(summary.totalActiveTeachers, 3);
    assert.equal(summary.byStatus.PRESENT, 1);
    assert.equal(summary.byStatus.LATE, 1);
    assert.equal(summary.byStatus.ABSENT, 1);
  });
});
