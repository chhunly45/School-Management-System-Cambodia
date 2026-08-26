const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');
const { createAttendancePolicyService } = require('../services/teacherAttendance/attendancePolicy.service');
const { createAttendanceStatusService } = require('../services/teacherAttendance/attendanceStatus.service');

const makeTime = (time) => new Date(`2026-08-07T${time}:00`);
const policy = {
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

describe('session-aware teacher attendance policy', () => {
  const service = createAttendancePolicyService({ SchoolSettingModel: {} });
  const statusService = createAttendanceStatusService();

  it('classifies Morning Present/Late and allows late scans after checkout', () => {
    const session = service.getSessionPolicy(policy, 'morning');
    assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime('06:54'), lateAfter: session.lateAfter }), 'PRESENT');
    assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime('06:55'), lateAfter: session.lateAfter }), 'LATE');
    assert.equal(service.ensureWithinAttendanceWindow(policy, makeTime('10:41'), 'morning'), undefined);
  });

  it('classifies Afternoon and Evening Present/Late boundaries', () => {
    for (const [sessionType, presentTime, lateTime] of [
      ['afternoon', '12:39', '12:40'],
      ['evening', '18:09', '18:10']
    ]) {
      const session = service.getSessionPolicy(policy, sessionType);
      assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime(presentTime), lateAfter: session.lateAfter }), 'PRESENT');
      assert.equal(statusService.calculateCheckInStatus({ checkInTime: makeTime(lateTime), lateAfter: session.lateAfter }), 'LATE');
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