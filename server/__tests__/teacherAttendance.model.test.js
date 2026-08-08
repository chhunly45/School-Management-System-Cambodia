const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let TeacherAttendance;
let AttendanceQrToken;
let AttendanceAttemptLog;
let SchoolSetting;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const connectDatabase = require('../config/database');
  await connectDatabase();

  ({ TeacherAttendance, AttendanceQrToken, AttendanceAttemptLog, SchoolSetting } = require('../models'));

  await Promise.all([
    TeacherAttendance.init(),
    AttendanceQrToken.init(),
    AttendanceAttemptLog.init(),
    SchoolSetting.init()
  ]);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    TeacherAttendance.deleteMany({}),
    AttendanceQrToken.deleteMany({}),
    AttendanceAttemptLog.deleteMany({}),
    SchoolSetting.deleteMany({})
  ]);
});

describe('TeacherAttendance model', () => {
  it('requires qrTokenId when attendanceMethod is QR', async () => {
    await assert.rejects(
      async () => {
        await TeacherAttendance.create({
          teacherId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          attendanceDate: new Date('2026-08-07T00:00:00.000Z'),
          attendanceMethod: 'QR',
          status: 'PRESENT'
        });
      },
      /qrTokenId is required/
    );
  });

  it('enforces unique teacherId + attendanceDate for active records but allows replacement after soft delete', async () => {
    const teacherId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const day = new Date('2026-08-07T00:00:00.000Z');
    const qrToken = await AttendanceQrToken.create({
      token: 'token-unique-soft-delete-0001',
      rotationNumber: 1,
      expiresAt: new Date(Date.now() + 60_000)
    });

    const first = await TeacherAttendance.create({
      teacherId,
      userId,
      attendanceDate: day,
      attendanceMethod: 'QR',
      status: 'PRESENT',
      qrTokenId: qrToken._id
    });

    await assert.rejects(
      async () => {
        await TeacherAttendance.create({
          teacherId,
          userId,
          attendanceDate: day,
          attendanceMethod: 'MANUAL',
          status: 'LATE'
        });
      },
      (error) => error && error.code === 11000
    );

    first.isDeleted = true;
    first.deletedAt = new Date();
    await first.save();

    const replacement = await TeacherAttendance.create({
      teacherId,
      userId,
      attendanceDate: day,
      attendanceMethod: 'MANUAL',
      status: 'LATE'
    });

    assert.ok(replacement._id, 'replacement record should be created');
  });
});

describe('AttendanceQrToken model', () => {
  it('validates revokedAt based on isRevoked state', async () => {
    await assert.rejects(
      async () => {
        await AttendanceQrToken.create({
          token: 'token-revoke-validation-0002',
          rotationNumber: 2,
          expiresAt: new Date(Date.now() + 60_000),
          isRevoked: true
        });
      },
      /revokedAt is required/
    );

    await assert.rejects(
      async () => {
        await AttendanceQrToken.create({
          token: 'token-revoke-validation-0003',
          rotationNumber: 3,
          expiresAt: new Date(Date.now() + 60_000),
          isRevoked: false,
          revokedAt: new Date()
        });
      },
      /must be null/
    );

    const valid = await AttendanceQrToken.create({
      token: 'token-revoke-validation-0004',
      rotationNumber: 4,
      expiresAt: new Date(Date.now() + 60_000),
      isRevoked: true,
      revokedAt: new Date()
    });

    assert.equal(valid.isRevoked, true);
  });

  it('defines required unique and TTL indexes', () => {
    const indexes = AttendanceQrToken.schema.indexes();

    const tokenUnique = indexes.find(([keys, options]) => keys.token === 1 && options && options.unique === true);
    const rotationUnique = indexes.find(([keys, options]) => keys.rotationNumber === 1 && options && options.unique === true);
    const ttl = indexes.find(([keys, options]) => keys.expiresAt === 1 && options && options.expireAfterSeconds === 0);

    assert.ok(tokenUnique, 'token unique index should exist');
    assert.ok(rotationUnique, 'rotationNumber unique index should exist');
    assert.ok(ttl, 'expiresAt TTL index should exist');
  });
});

describe('AttendanceAttemptLog model', () => {
  it('enforces result and reasonCode consistency', async () => {
    await assert.rejects(
      async () => {
        await AttendanceAttemptLog.create({
          attendanceMethod: 'QR',
          result: 'SUCCESS',
          reasonCode: 'QR_INVALID',
          requestId: 'req-invalid-0001',
          requestTime: new Date()
        });
      },
      /reasonCode must be SUCCESS/
    );

    const valid = await AttendanceAttemptLog.create({
      attendanceMethod: 'QR',
      result: 'FAILED',
      reasonCode: 'QR_INVALID',
      requestId: 'req-valid-0002',
      requestTime: new Date()
    });

    assert.ok(valid._id, 'valid failed attempt should be created');
  });

  it('enforces unique requestId', async () => {
    await AttendanceAttemptLog.create({
      attendanceMethod: 'MANUAL',
      result: 'SUCCESS',
      reasonCode: 'SUCCESS',
      requestId: 'req-duplicate-0003',
      requestTime: new Date()
    });

    await assert.rejects(
      async () => {
        await AttendanceAttemptLog.create({
          attendanceMethod: 'FACE',
          result: 'FAILED',
          reasonCode: 'UNKNOWN_ERROR',
          requestId: 'req-duplicate-0003',
          requestTime: new Date()
        });
      },
      (error) => error && error.code === 11000
    );
  });
});

describe('SchoolSetting attendance extension', () => {
  it('validates attendance time format and range constraints', async () => {
    await assert.rejects(
      async () => {
        await SchoolSetting.create({
          singletonKey: 'school-settings',
          attendanceLateAfter: '25:61'
        });
      },
      /attendanceLateAfter must use HH:mm format/
    );

    await assert.rejects(
      async () => {
        await SchoolSetting.create({
          singletonKey: 'school-settings',
          attendanceSchoolLatitude: 120,
          attendanceSchoolLongitude: 200,
          attendanceQrRotationSeconds: 15
        });
      },
      /maximum allowed value|minimum allowed value/
    );

    const valid = await SchoolSetting.create({
      singletonKey: 'school-settings',
      attendanceEnabled: true,
      attendanceQrEnabled: true,
      attendanceFaceEnabled: false,
      attendanceGpsEnabled: true,
      attendanceSchoolLatitude: 11.5564,
      attendanceSchoolLongitude: 104.9282,
      attendanceAllowedRadius: 100,
      attendanceLateAfter: '08:00',
      attendanceStart: '06:30',
      attendanceEnd: '18:00',
      attendanceQrRotationSeconds: 30
    });

    assert.ok(valid._id, 'valid school setting should be created');
  });
});
