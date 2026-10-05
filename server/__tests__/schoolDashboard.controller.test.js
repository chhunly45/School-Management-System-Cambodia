const { strict: assert } = require('node:assert');
const { describe, it, before, after } = require('node:test');
const { createGetSchoolStats } = require('../controllers/schoolDashboard.controller');
const { getSchoolDayBounds } = require('../services/teacherAttendance/time.utils');

const originalSchoolTimezone = process.env.SCHOOL_TIMEZONE;

before(() => {
  process.env.SCHOOL_TIMEZONE = 'Asia/Phnom_Penh';
});

after(() => {
  if (originalSchoolTimezone === undefined) {
    delete process.env.SCHOOL_TIMEZONE;
  } else {
    process.env.SCHOOL_TIMEZONE = originalSchoolTimezone;
  }
});

const makeQuery = (documents) => ({
  select() {
    return this;
  },
  sort() {
    return this;
  },
  limit() {
    return this;
  },
  lean() {
    return Promise.resolve(documents);
  }
});

const makeModels = ({ payments = [], students = [] } = {}) => {
  const attendanceQueries = [];
  const paymentAggregatePipelines = [];
  const inRange = (date, range) => {
    const timestamp = new Date(date).getTime();
    return timestamp >= range.$gte.getTime()
      && (range.$lt ? timestamp < range.$lt.getTime() : timestamp <= range.$lte.getTime());
  };

  const models = {
    Student: {
      find: () => makeQuery([]),
      countDocuments: async (query) => students.filter((student) => (
        student.status === query.status
        && (!query.gender || student.gender === query.gender)
      )).length
    },
    Payment: {
      aggregate: async (pipeline) => {
        paymentAggregatePipelines.push(pipeline);
        const match = pipeline[0].$match;
        const group = pipeline.find((stage) => stage.$group).$group;
        const matchingPayments = payments.filter((payment) => {
          if (match.status && payment.status !== match.status) return false;
          if (match.paymentDate && !inRange(payment.paymentDate, match.paymentDate)) return false;
          if (match.remainingBalance && !(payment.remainingBalance > match.remainingBalance.$gt)) return false;
          return true;
        });

        if (matchingPayments.length === 0) return [];
        if (pipeline.some((stage) => stage.$count === 'total')) {
          return [{ total: new Set(matchingPayments.map((payment) => payment.studentId)).size }];
        }
        if (group.totalIncome) {
          return [{
            total: matchingPayments.length,
            totalIncome: matchingPayments.reduce((total, payment) => total + payment.amount, 0)
          }];
        }
        if (group.total && group.total.$sum === '$amount') {
          return [{ total: matchingPayments.reduce((total, payment) => total + payment.amount, 0) }];
        }
        return [{
          total: matchingPayments.reduce((total, payment) => total + payment.remainingBalance, 0)
        }];
      },
      find: (query) => {
        if (query.remainingBalance) {
          return makeQuery(payments.filter((payment) => payment.remainingBalance > query.remainingBalance.$gt));
        }
        return makeQuery([]);
      }
    },
    Attendance: {
      countDocuments: async (query) => {
        attendanceQueries.push(query);
        return 0;
      }
    },
    EmployeeAttendance: {
      countDocuments: async () => 0
    },
    Certificate: {
      countDocuments: async () => 0
    },
    Transport: {
      countDocuments: async () => 0
    }
  };

  return { models, attendanceQueries, paymentAggregatePipelines };
};

const getStats = async ({ now, payments = [], students = [] }) => {
  const testModels = makeModels({ payments, students });
  const handler = createGetSchoolStats({
    models: testModels.models,
    nowProvider: () => new Date(now)
  });
  let response;
  let nextError;

  await handler({}, {
    json(body) {
      response = body;
    }
  }, (error) => {
    nextError = error;
  });

  if (nextError) throw nextError;
  return { data: response.data, ...testModels };
};

describe('school dashboard controller', () => {
  it('returns active student totals split by male and female without counting other as either', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      students: [
        { status: 'active', gender: 'male' },
        { status: 'active', gender: 'male' },
        { status: 'active', gender: 'female' },
        { status: 'active', gender: 'other' },
        { status: 'inactive', gender: 'female' },
        { status: 'graduated', gender: 'male' }
      ]
    });

    assert.equal(data.totalStudents, 4);
    assert.equal(data.maleStudents, 2);
    assert.equal(data.femaleStudents, 1);
  });

  it('includes all required student count fields in the dashboard response', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z'
    });

    assert.ok(Object.hasOwn(data, 'totalStudents'));
    assert.ok(Object.hasOwn(data, 'maleStudents'));
    assert.ok(Object.hasOwn(data, 'femaleStudents'));
    assert.ok(Object.hasOwn(data, 'studentsPaidToday'));
  });

  it('returns the sum of paid payments made today', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { status: 'paid', paymentDate: '2026-06-10T18:00:00.000Z', amount: 37.5, remainingBalance: 0 },
        { status: 'paid', paymentDate: '2026-06-11T17:00:00.000Z', amount: 100, remainingBalance: 0 },
        { status: 'pending', paymentDate: '2026-06-10T19:00:00.000Z', amount: 200, remainingBalance: 20 }
      ]
    });

    assert.equal(data.todaysIncome, 37.5);
  });

  it('counts three paid transactions for three different students separately', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-1', status: 'paid', paymentDate: '2026-06-10T18:00:00.000Z', amount: 10 },
        { studentId: 'STUDENT-2', status: 'paid', paymentDate: '2026-06-10T19:00:00.000Z', amount: 20 },
        { studentId: 'STUDENT-3', status: 'paid', paymentDate: '2026-06-10T20:00:00.000Z', amount: 30 }
      ]
    });

    assert.equal(data.studentsPaidToday, 3);
  });

  it('counts three paid transactions for the same student once', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-1', status: 'paid', paymentDate: '2026-06-10T18:00:00.000Z', amount: 10 },
        { studentId: 'STUDENT-1', status: 'paid', paymentDate: '2026-06-10T19:00:00.000Z', amount: 20 },
        { studentId: 'STUDENT-1', status: 'paid', paymentDate: '2026-06-10T20:00:00.000Z', amount: 30 }
      ]
    });

    assert.equal(data.studentsPaidToday, 1);
  });

  it('counts paid transactions only, excluding pending and overdue payments', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-1', status: 'paid', paymentDate: '2026-06-10T18:00:00.000Z', amount: 10 },
        { studentId: 'STUDENT-2', status: 'pending', paymentDate: '2026-06-10T19:00:00.000Z', amount: 20 },
        { studentId: 'STUDENT-3', status: 'overdue', paymentDate: '2026-06-10T20:00:00.000Z', amount: 30 }
      ]
    });

    assert.equal(data.studentsPaidToday, 1);
  });

  it('counts paid payments today but excludes yesterday by Cambodia school-day boundary', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-TODAY', status: 'paid', paymentDate: '2026-06-10T17:00:00.000Z', amount: 10 },
        { studentId: 'STUDENT-YESTERDAY', status: 'paid', paymentDate: '2026-06-10T16:59:59.999Z', amount: 20 }
      ]
    });

    assert.equal(data.studentsPaidToday, 1);
  });

  it('counts a student once when they have multiple paid payments alongside another student', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-1', status: 'paid', paymentDate: '2026-06-10T18:00:00.000Z', amount: 10 },
        { studentId: 'STUDENT-1', status: 'paid', paymentDate: '2026-06-10T19:00:00.000Z', amount: 20 },
        { studentId: 'STUDENT-2', status: 'paid', paymentDate: '2026-06-10T20:00:00.000Z', amount: 30 }
      ]
    });

    assert.equal(data.studentsPaidToday, 2);
  });

  it('returns zero when there are no matching paid payments today', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-PENDING', status: 'pending', paymentDate: '2026-06-10T18:00:00.000Z', amount: 10 },
        { studentId: 'STUDENT-YESTERDAY', status: 'paid', paymentDate: '2026-06-09T18:00:00.000Z', amount: 20 }
      ]
    });

    assert.equal(data.studentsPaidToday, 0);
  });

  it('returns zero when there are no paid payments today', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { status: 'paid', paymentDate: '2026-06-09T18:00:00.000Z', amount: 45, remainingBalance: 0 }
      ]
    });

    assert.equal(data.todaysIncome, 0);
  });

  it('returns zero when there are no payment records', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z'
    });

    assert.equal(data.todaysIncome, 0);
  });

  it('counts an outstanding payment due yesterday as overdue', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [{
        studentId: 'STUDENT-1',
        status: 'pending',
        remainingBalance: 10,
        dueDate: '2026-06-10',
        gracePeriodDays: 0
      }]
    });

    assert.equal(data.overduePayments, 1);
  });

  it('does not count an outstanding payment due today as overdue', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [{
        studentId: 'STUDENT-1',
        status: 'pending',
        remainingBalance: 10,
        dueDate: '2026-06-11',
        gracePeriodDays: 0
      }]
    });

    assert.equal(data.overduePayments, 0);
  });

  it('does not count an outstanding payment with a future due date as overdue', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [{
        studentId: 'STUDENT-1',
        status: 'pending',
        remainingBalance: 10,
        dueDate: '2026-06-12',
        gracePeriodDays: 0
      }]
    });

    assert.equal(data.overduePayments, 0);
  });

  it('does not count a fully paid obligation as overdue', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [{
        studentId: 'STUDENT-1',
        status: 'paid',
        remainingBalance: 0,
        dueDate: '2026-06-10',
        gracePeriodDays: 0
      }]
    });

    assert.equal(data.overduePayments, 0);
  });

  it('does not count missing or invalid due dates as overdue', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-1', status: 'pending', remainingBalance: 10, gracePeriodDays: 0 },
        {
          studentId: 'STUDENT-2',
          status: 'pending',
          remainingBalance: 10,
          dueDate: 'not-a-date',
          gracePeriodDays: 0
        }
      ]
    });

    assert.equal(data.overduePayments, 0);
  });

  it('counts multiple overdue payment records for the same student once', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-1', status: 'pending', remainingBalance: 10, dueDate: '2026-06-09', gracePeriodDays: 0 },
        { studentId: 'STUDENT-1', status: 'overdue', remainingBalance: 20, dueDate: '2026-06-10', gracePeriodDays: 0 }
      ]
    });

    assert.equal(data.overduePayments, 1);
  });

  it('counts different overdue students separately', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [
        { studentId: 'STUDENT-1', status: 'pending', remainingBalance: 10, dueDate: '2026-06-10', gracePeriodDays: 0 },
        { studentId: 'STUDENT-2', status: 'pending', remainingBalance: 20, dueDate: '2026-06-09', gracePeriodDays: 0 }
      ]
    });

    assert.equal(data.overduePayments, 2);
  });

  it('preserves the configured payment grace period', async () => {
    const { data } = await getStats({
      now: '2026-06-11T03:00:00.000Z',
      payments: [{
        studentId: 'STUDENT-1',
        status: 'pending',
        remainingBalance: 10,
        dueDate: '2026-06-10',
        gracePeriodDays: 1
      }]
    });

    assert.equal(data.gracePeriodPayments, 1);
    assert.equal(data.overduePayments, 0);
  });

  it('uses Cambodia school-day boundaries for today queries and overdue dates', async () => {
    const { data, attendanceQueries, paymentAggregatePipelines } = await getStats({
      now: '2026-06-10T17:00:00.000Z',
      payments: [
        {
          studentId: 'STUDENT-YESTERDAY',
          status: 'pending',
          remainingBalance: 10,
          dueDate: '2026-06-10T16:59:59.999Z',
          gracePeriodDays: 0
        },
        {
          studentId: 'STUDENT-TODAY',
          status: 'pending',
          remainingBalance: 10,
          dueDate: '2026-06-10T17:00:00.000Z',
          gracePeriodDays: 0
        }
      ]
    });
    const { start, end } = getSchoolDayBounds(new Date('2026-06-10T17:00:00.000Z'));

    assert.equal(start.toISOString(), '2026-06-10T17:00:00.000Z');
    assert.equal(end.toISOString(), '2026-06-11T17:00:00.000Z');
    assert.deepEqual(attendanceQueries[0].date, { $gte: start, $lt: end });
    assert.deepEqual(paymentAggregatePipelines[0][0].$match.paymentDate, { $gte: start, $lt: end });
    assert.deepEqual(paymentAggregatePipelines[1][0].$match, {
      status: 'paid',
      paymentDate: { $gte: start, $lt: end }
    });
    assert.deepEqual(paymentAggregatePipelines[1].slice(1), [
      { $group: { _id: '$studentId' } },
      { $count: 'total' }
    ]);
    assert.equal(data.studentsPaidToday, 0);
    assert.equal(data.overduePayments, 1);
  });
});
