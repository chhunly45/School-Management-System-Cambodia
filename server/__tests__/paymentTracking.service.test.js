const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');
const { buildTrackingStatus, calculateDaysLeft, buildPaymentTrackingRows } = require('../services/paymentTracking.service');

describe('paymentTracking.service', () => {
  it('marks expired, warning, and paid rows according to workbook rules', () => {
    assert.equal(buildTrackingStatus({ dueDate: '2025-01-01', remainingBalance: 200, today: '2025-01-01' }).status, 'Expired');
    assert.equal(buildTrackingStatus({ dueDate: '2025-01-06', remainingBalance: 200, today: '2025-01-01' }).status, 'Warning');
    assert.equal(buildTrackingStatus({ dueDate: '2025-01-10', remainingBalance: 200, today: '2025-01-01' }).status, 'Paid');
  });

  it('calculates days left from the expiry date', () => {
    assert.equal(calculateDaysLeft('2025-01-10', '2025-01-01'), 9);
    assert.equal(calculateDaysLeft('2025-01-01', '2025-01-02'), -1);
  });

  it('groups a student and latest payment into a single tracking row', () => {
    const students = [{
      _id: 'student-1',
      studentId: 'S-001',
      fullName: 'Alice / សាលី',
      gender: 'female',
      phone: '012345678',
      room: 'Room 1',
      studyShift: 'Morning',
      className: 'Grade 1',
      academicYear: '2025-2026',
      monthlyTuition: 120,
      status: 'active'
    }];

    const payments = [{
      studentId: 'S-001',
      studentName: 'Alice / សាលី',
      className: 'Grade 1',
      paymentPlan: 'monthly',
      tuitionAmount: 120,
      amount: 120,
      discount: 0,
      remainingBalance: 0,
      dueDate: '2025-01-10',
      paymentDate: '2025-01-01',
      academicYear: '2025-2026',
      status: 'paid'
    }];

    const transportRecords = [{
      studentId: 'student-1',
      routeName: 'Route A',
      vehicleNumber: 'ABC-123',
      monthlyFee: 25
    }];

    const rows = buildPaymentTrackingRows({ students, payments, today: '2025-01-05', transportRecords });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'Warning');
    assert.equal(rows[0].daysLeft, 5);
    assert.equal(rows[0].session, 'Morning');
    assert.equal(rows[0].englishName, 'Alice');
    assert.equal(rows[0].khmerName, 'សាលី');
    assert.equal(rows[0].route, 'Route A');
    assert.equal(rows[0].vehicle, 'ABC-123');
    assert.equal(rows[0].monthlyRouteFee, 25);
    assert.equal(rows[0].transportCharge, 25);
  });
});
