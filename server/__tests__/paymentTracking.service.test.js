const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');
const { buildTrackingStatus, calculateDaysLeft, buildPaymentTrackingRows } = require('../services/paymentTracking.service');

describe('paymentTracking.service', () => {
  it('marks expired, warning, and paid rows according to workbook rules', () => {
    assert.equal(buildTrackingStatus({ dueDate: '2025-01-01', remainingBalance: 200, today: '2025-01-01' }).status, 'Expired');
    assert.equal(buildTrackingStatus({ dueDate: '2025-01-06', remainingBalance: 200, today: '2025-01-01' }).status, 'Warning');
    assert.equal(buildTrackingStatus({ dueDate: '2025-01-10', remainingBalance: 200, today: '2025-01-01' }).status, 'Paid');
  });

  it('keeps valid payment rows on the existing payment status logic', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-valid', studentId: 'S-VALID', fullName: 'Valid Student', monthlyTuition: 120 }],
      payments: [{
        studentId: 'S-VALID',
        tuitionAmount: 120,
        amount: 120,
        remainingBalance: 60,
        discount: 0,
        dueDate: '2025-01-10',
        paymentDate: '2025-01-01',
        paymentPlan: 'monthly'
      }],
      today: '2025-01-05'
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'Warning');
    assert.equal(rows[0].daysLeft, 5);
    assert.equal(rows[0].tuitionAmount, 120);
    assert.equal(rows[0].totalAmount, 120);
    assert.equal(rows[0].remainingBalance, 60);
  });

  it('preserves the existing expired-payment logic', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-expired', studentId: 'S-EXPIRED', fullName: 'Expired Student', monthlyTuition: 120 }],
      payments: [{
        studentId: 'S-EXPIRED',
        tuitionAmount: 120,
        amount: 120,
        remainingBalance: 20,
        discount: 0,
        dueDate: '2025-01-01',
        paymentDate: '2025-01-01',
        paymentPlan: 'monthly'
      }],
      today: '2025-01-05'
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'Expired');
    assert.equal(rows[0].daysLeft, -4);
  });

  it('preserves the existing warning/grace payment logic', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-warning', studentId: 'S-WARN', fullName: 'Warning Student', monthlyTuition: 120 }],
      payments: [{
        studentId: 'S-WARN',
        tuitionAmount: 120,
        amount: 120,
        remainingBalance: 40,
        discount: 5,
        dueDate: '2025-01-06',
        paymentDate: '2025-01-01',
        paymentPlan: 'monthly'
      }],
      today: '2025-01-01'
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'Warning');
    assert.equal(rows[0].daysLeft, 5);
    assert.equal(rows[0].discount, 5);
    assert.equal(rows[0].totalAmount, 120);
  });

  it('does not classify students with no payment as Expired just because dueDate is missing', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-no-payment', studentId: 'S-NO-PAY', fullName: 'No Payment Student', monthlyTuition: 100 }],
      payments: [],
      transportRecords: [],
      today: '2025-01-05'
    });

    assert.equal(rows.length, 1);
    assert.notEqual(rows[0].status, 'Expired');
    assert.equal(rows[0].status, 'Unclassified');
    assert.equal(rows[0].statusCode, 'unclassified');
    assert.equal(rows[0].tuitionAmount, 100);
  });

  it('keeps students visible in tracking even when no payment record exists', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-visible', studentId: 'S-VISIBLE', fullName: 'Visible Student', monthlyTuition: 90 }],
      payments: [],
      transportRecords: [],
      today: '2025-01-05'
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].studentId, 'S-VISIBLE');
    assert.equal(rows[0].fullName, 'Visible Student');
  });

  it('keeps transport optional and still works with zero transport records', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-transport-zero', studentId: 'S-TRANS-ZERO', fullName: 'Zero Transport', monthlyTuition: 75 }],
      payments: [],
      transportRecords: [],
      today: '2025-01-05'
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].route, '');
    assert.equal(rows[0].monthlyRouteFee, 0);
    assert.equal(rows[0].status, 'Unclassified');
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

  it('keeps the student row when transport data is missing', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-2', studentId: 'S-002', fullName: 'Bob', monthlyTuition: 100 }],
      payments: [{
        studentId: 'S-002',
        paymentDate: '2025-01-01',
        dueDate: '2025-01-10',
        amount: 100,
        remainingBalance: 0
      }],
      transportRecords: [],
      today: '2025-01-05'
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].route, '');
    assert.equal(rows[0].vehicle, '');
    assert.equal(rows[0].monthlyRouteFee, 0);
    assert.equal(rows[0].transportCharge, 0);
  });

  it('ignores a transport record with a missing relation without affecting the row', () => {
    const rows = buildPaymentTrackingRows({
      students: [{ _id: 'student-3', studentId: 'S-003', fullName: 'Cara', monthlyTuition: 100 }],
      payments: [],
      transportRecords: [{ routeName: 'Unrelated Route', vehicleNumber: 'CAR-3', monthlyFee: 30 }]
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].route, '');
    assert.equal(rows[0].monthlyRouteFee, 0);
  });
});
