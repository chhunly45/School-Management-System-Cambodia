const { strict: assert } = require('node:assert');
const { describe, it, before, after, beforeEach } = require('node:test');
const { validationResult } = require('express-validator');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { baseValidators } = require('../routes/schoolSetting.routes');
const schoolSettingService = require('../services/schoolSetting.service');
const { SchoolSetting } = require('../models');

let mongod;

const validatePayload = async (body) => {
  const request = { body };
  for (const validator of baseValidators) {
    await validator.run(request);
  }
  return validationResult(request).array();
};

describe('School Settings attendance fields', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await SchoolSetting.init();
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await SchoolSetting.deleteMany({});
  });

  it('accepts valid attendance fields and rejects invalid ranges and times', async () => {
    assert.equal((await validatePayload({
      attendanceEnabled: true,
      attendanceQrEnabled: true,
      attendanceGpsEnabled: true,
      attendanceSchoolLatitude: 11.5564,
      attendanceSchoolLongitude: 104.9282,
      attendanceAllowedRadius: 120,
      morningCheckInStart: '07:00',
      morningCheckInEnd: '08:00',
      afternoonCheckInStart: '12:30',
      afternoonCheckInEnd: '13:30',
      eveningCheckInStart: '18:00',
      eveningCheckInEnd: '19:00',
      attendanceStart: '06:00',
      attendanceEnd: '18:00'
    })).length, 0);

    assert.equal((await validatePayload({
      morningCheckInStart: null,
      morningCheckInEnd: null,
      afternoonCheckInStart: null,
      afternoonCheckInEnd: null,
      eveningCheckInStart: null,
      eveningCheckInEnd: null
    })).length, 0);

    const errors = await validatePayload({
      attendanceSchoolLatitude: 91,
      attendanceSchoolLongitude: -181,
      attendanceAllowedRadius: 0,
      morningCheckInStart: '25:00',
      morningCheckInEnd: '08:99',
      afternoonCheckInStart: '12:60',
      afternoonCheckInEnd: '13:61',
      eveningCheckInStart: '18:88',
      eveningCheckInEnd: '19:90',
      attendanceStart: '25:00',
      attendanceEnd: '18:60'
    });

    assert.deepEqual(
      errors.map((error) => error.path).sort(),
      ['afternoonCheckInEnd', 'afternoonCheckInStart', 'attendanceAllowedRadius', 'attendanceEnd', 'attendanceSchoolLatitude', 'attendanceSchoolLongitude', 'attendanceStart', 'eveningCheckInEnd', 'eveningCheckInStart', 'morningCheckInEnd', 'morningCheckInStart']
    );
  });

  it('persists attendance settings and preserves omitted values on partial updates', async () => {
    const created = await schoolSettingService.createSchoolSettings({
      schoolName: 'Pilot School',
      attendanceEnabled: true,
      attendanceQrEnabled: false,
      attendanceGpsEnabled: true,
      attendanceSchoolLatitude: 11.5564,
      attendanceSchoolLongitude: 104.9282,
      attendanceAllowedRadius: 120,
      morningCheckInStart: '07:00',
      morningCheckInEnd: '08:00',
      afternoonCheckInStart: '12:30',
      afternoonCheckInEnd: '13:30',
      eveningCheckInStart: null,
      eveningCheckInEnd: null,
      attendanceStart: '06:30',
      attendanceEnd: '17:30'
    });

    assert.equal(created.attendanceQrEnabled, false);
    assert.equal(created.attendanceAllowedRadius, 120);
    assert.equal(created.morningCheckInStart, '07:00');
    assert.equal(created.eveningCheckInStart, null);
    assert.equal(created.attendanceStart, '06:30');

    const updated = await schoolSettingService.updateSchoolSettings({
      schoolName: 'Pilot School Updated',
      attendanceAllowedRadius: 150,
      afternoonCheckInStart: null
    });

    assert.equal(updated.schoolName, 'Pilot School Updated');
    assert.equal(updated.attendanceAllowedRadius, 150);
    assert.equal(updated.attendanceQrEnabled, false);
    assert.equal(updated.attendanceSchoolLatitude, 11.5564);
    assert.equal(updated.morningCheckInStart, '07:00');
    assert.equal(updated.afternoonCheckInStart, null);
    assert.equal(updated.attendanceStart, '06:30');

    const persisted = await SchoolSetting.findOne({ singletonKey: 'school-settings' }).lean();
    assert.equal(persisted.attendanceEnd, '17:30');
    assert.equal(persisted.attendanceGpsEnabled, true);
    assert.equal(persisted.morningCheckInEnd, '08:00');
    assert.equal(persisted.eveningCheckInStart, null);
  });

  it('uses the existing model defaults when attendance fields are absent', async () => {
    const created = await schoolSettingService.createSchoolSettings({ schoolName: 'Defaults School' });

    assert.equal(created.attendanceEnabled, true);
    assert.equal(created.attendanceQrEnabled, true);
    assert.equal(created.attendanceGpsEnabled, true);
    assert.equal(created.attendanceSchoolLatitude, null);
    assert.equal(created.attendanceSchoolLongitude, null);
    assert.equal(created.attendanceAllowedRadius, 100);
    assert.equal(created.morningCheckInStart, null);
    assert.equal(created.morningCheckInEnd, null);
    assert.equal(created.afternoonCheckInStart, null);
    assert.equal(created.afternoonCheckInEnd, null);
    assert.equal(created.eveningCheckInStart, null);
    assert.equal(created.eveningCheckInEnd, null);
    assert.equal(created.attendanceStart, '06:00');
    assert.equal(created.attendanceEnd, '18:00');
  });
});
