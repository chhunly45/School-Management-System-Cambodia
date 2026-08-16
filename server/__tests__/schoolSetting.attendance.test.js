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
      attendanceStart: '06:00',
      attendanceEnd: '18:00'
    })).length, 0);

    const errors = await validatePayload({
      attendanceSchoolLatitude: 91,
      attendanceSchoolLongitude: -181,
      attendanceAllowedRadius: 0,
      attendanceStart: '25:00',
      attendanceEnd: '18:60'
    });

    assert.deepEqual(
      errors.map((error) => error.path).sort(),
      ['attendanceAllowedRadius', 'attendanceEnd', 'attendanceSchoolLatitude', 'attendanceSchoolLongitude', 'attendanceStart']
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
      attendanceStart: '06:30',
      attendanceEnd: '17:30'
    });

    assert.equal(created.attendanceQrEnabled, false);
    assert.equal(created.attendanceAllowedRadius, 120);
    assert.equal(created.attendanceStart, '06:30');

    const updated = await schoolSettingService.updateSchoolSettings({
      schoolName: 'Pilot School Updated',
      attendanceAllowedRadius: 150
    });

    assert.equal(updated.schoolName, 'Pilot School Updated');
    assert.equal(updated.attendanceAllowedRadius, 150);
    assert.equal(updated.attendanceQrEnabled, false);
    assert.equal(updated.attendanceSchoolLatitude, 11.5564);
    assert.equal(updated.attendanceStart, '06:30');

    const persisted = await SchoolSetting.findOne({ singletonKey: 'school-settings' }).lean();
    assert.equal(persisted.attendanceEnd, '17:30');
    assert.equal(persisted.attendanceGpsEnabled, true);
  });

  it('uses the existing model defaults when attendance fields are absent', async () => {
    const created = await schoolSettingService.createSchoolSettings({ schoolName: 'Defaults School' });

    assert.equal(created.attendanceEnabled, true);
    assert.equal(created.attendanceQrEnabled, true);
    assert.equal(created.attendanceGpsEnabled, true);
    assert.equal(created.attendanceSchoolLatitude, null);
    assert.equal(created.attendanceSchoolLongitude, null);
    assert.equal(created.attendanceAllowedRadius, 100);
    assert.equal(created.attendanceStart, '06:00');
    assert.equal(created.attendanceEnd, '18:00');
  });
});
