const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');
const { createAttendancePolicyService } = require('../services/teacherAttendance/attendancePolicy.service');
const { createAttendanceStatusService } = require('../services/teacherAttendance/attendanceStatus.service');
const { getLocalMinutes, zonedDateTimeToUtc } = require('../services/teacherAttendance/time.utils');

const makeTime = (time) => new Date(`2026-08-07T${time}:00`);
const policy = {
  attendanceStart: '06:00',
  attendanceLateAfter: '08:00',
  attendanceEnd: '18:00',
  morningCheckInStart: '06:45',
  morningCheckInEnd: '10:45',
  morningLateAfter: '06:50',
  morningCheckoutTime: '10:45',
  afternoonCheckInStart: '12:30',
  afternoonCheckInEnd: '16:00',
  afternoonLateAfter: '12:35',
  afternoonCheckoutTime: '16:00',
  eveningCheckInStart: '18:00',
  eveningCheckInEnd: '20:00',
  eveningLateAfter: '18:05',
  eveningCheckoutTime: '20:00'
};

describe('session-aware teacher attendance policy', () => {
  const service = createAttendancePolicyService({ SchoolSettingModel: {} });
  const statusService = createAttendanceStatusService();

  it('classifies Morning Present/Late and rejects check-in at the session boundary', () => {
    const session = service.getSessionPolicy(policy, 'morning');
    assert.equal(session.checkInStart, '06:45');
    assert.equal(session.checkInEnd, '10:45');
    assert.equal(session.lateAfter, '06:50');
    assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime('06:49'), lateAfter: session.lateAfter }), 'PRESENT');
    assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime('06:50'), lateAfter: session.lateAfter }), 'LATE');
    assert.throws(
      () => service.ensureWithinAttendanceWindow(policy, makeTime('18:00'), 'morning'),
      (error) => error && error.code === 'OUTSIDE_ATTENDANCE_WINDOW'
    );
  });

  it('classifies Afternoon and Evening Present/Late boundaries', () => {
    for (const [sessionType, expectedStart, expectedEnd, presentTime, lateTime] of [
      ['afternoon', '12:30', '16:00', '12:34', '12:35'],
      ['evening', '18:00', '20:00', '18:04', '18:05']
    ]) {
      const session = service.getSessionPolicy(policy, sessionType);
      assert.equal(session.checkInStart, expectedStart);
      assert.equal(session.checkInEnd, expectedEnd);
      assert.equal(session.lateAfter, lateTime);
      assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime(presentTime), lateAfter: session.lateAfter }), 'PRESENT');
      assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime(lateTime), lateAfter: session.lateAfter }), 'LATE');
      assert.throws(
        () => service.ensureWithinAttendanceWindow(policy, makeTime(expectedEnd), sessionType),
        (error) => error && error.code === 'OUTSIDE_ATTENDANCE_WINDOW'
      );
    }
  });

  it('rejects check-in before the start and after the end of the work window', () => {
    assert.throws(
      () => service.ensureWithinAttendanceWindow(policy, makeTime('05:59'), 'morning'),
      (error) => error && error.code === 'OUTSIDE_ATTENDANCE_WINDOW'
    );
    assert.throws(
      () => service.ensureWithinAttendanceWindow(policy, makeTime('18:00'), 'morning'),
      (error) => error && error.code === 'OUTSIDE_ATTENDANCE_WINDOW'
    );
  });

  it('uses the configured school timezone when the server timezone differs', () => {
    const previousTimezone = process.env.SCHOOL_TIMEZONE;
    process.env.SCHOOL_TIMEZONE = 'Asia/Phnom_Penh';
    try {
      const schoolStart = zonedDateTimeToUtc({ year: 2026, month: 8, day: 7, hour: 6, minute: 45 }, 'Asia/Phnom_Penh');
      const schoolEnd = zonedDateTimeToUtc({ year: 2026, month: 8, day: 7, hour: 18, minute: 0 }, 'Asia/Phnom_Penh');
      assert.equal(getLocalMinutes(schoolStart, 'Asia/Phnom_Penh'), 405);
      assert.equal(getLocalMinutes(schoolEnd, 'Asia/Phnom_Penh'), 1080);
      assert.equal(service.ensureWithinAttendanceWindow(policy, schoolStart, 'morning'), undefined);
      assert.throws(
        () => service.ensureWithinAttendanceWindow(policy, schoolEnd, 'morning'),
        (error) => error && error.code === 'OUTSIDE_ATTENDANCE_WINDOW'
      );
    } finally {
      if (previousTimezone === undefined) delete process.env.SCHOOL_TIMEZONE;
      else process.env.SCHOOL_TIMEZONE = previousTimezone;
    }
  });

  it('classifies Early Leave only before the session checkout time', () => {
    assert.equal(statusService.calculateFinalStatus({ existingStatus: 'PRESENT', checkOutTime: makeTime('10:39'), sessionCheckoutTime: '10:40' }), 'LEAVE');
    assert.equal(statusService.calculateFinalStatus({ existingStatus: 'PRESENT', checkOutTime: makeTime('10:40'), sessionCheckoutTime: '10:40' }), 'PRESENT');
    assert.equal(statusService.calculateFinalStatus({ existingStatus: 'LATE', checkOutTime: makeTime('15:59'), sessionCheckoutTime: '16:00' }), 'LEAVE');
    assert.equal(statusService.calculateFinalStatus({ existingStatus: 'LATE', checkOutTime: makeTime('19:59'), sessionCheckoutTime: '20:00' }), 'LEAVE');
  });

  it('settles Absent only at or after session end', () => {
    assert.equal(statusService.calculateAbsentStatus({ checkInTime: null, referenceTime: makeTime('10:39'), sessionCheckoutTime: '10:40' }), null);
    assert.equal(statusService.calculateAbsentStatus({ checkInTime: null, referenceTime: makeTime('10:40'), sessionCheckoutTime: '10:40' }), 'ABSENT');
    assert.equal(statusService.calculateAbsentStatus({ checkInTime: makeTime('10:45'), referenceTime: makeTime('11:00'), sessionCheckoutTime: '10:40' }), null);
  });
});