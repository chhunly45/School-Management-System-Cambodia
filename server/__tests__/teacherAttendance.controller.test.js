const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

const { createTeacherAttendanceController } = require('../controllers/teacherAttendance.controller');

const createRes = () => {
  const result = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
  return result;
};

describe('teacherAttendance.controller', () => {
  it('checkIn delegates to service and responds 201', async () => {
    const expected = { _id: 'a1', status: 'PRESENT' };
    const service = {
      checkIn: async (payload) => {
        assert.equal(payload.attendanceMethod, 'QR');
        return expected;
      }
    };

    const controller = createTeacherAttendanceController({ teacherAttendanceService: service });
    const req = {
      user: { _id: 'u1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest', 'x-request-id': 'req-1' },
      body: { attendanceMethod: 'QR', qrToken: 't1' }
    };
    const res = createRes();

    await controller.checkIn(req, res, (err) => { throw err; });

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.payload, { success: true, data: expected });
  });

  it('checkOut delegates to service and responds 200', async () => {
    const expected = { _id: 'a1', checkOutTime: 'x' };
    const service = {
      checkOut: async () => expected
    };

    const controller = createTeacherAttendanceController({ teacherAttendanceService: service });
    const req = {
      user: { _id: 'u1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest', 'x-request-id': 'req-2' },
      body: { latitude: 11.55, longitude: 104.92 }
    };
    const res = createRes();

    await controller.checkOut(req, res, (err) => { throw err; });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { success: true, data: expected });
  });

  it('getTodayAttendance delegates to service', async () => {
    const expected = { attendance: null, canCheckIn: true, canCheckOut: false };
    const service = {
      getTodayAttendance: async () => expected
    };

    const controller = createTeacherAttendanceController({ teacherAttendanceService: service });
    const req = { user: { _id: 'u1' } };
    const res = createRes();

    await controller.getTodayAttendance(req, res, (err) => { throw err; });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { success: true, data: expected });
  });

  it('getAttendanceHistory delegates to service with query', async () => {
    const expected = { items: [], meta: { page: 1, limit: 20, total: 0 } };
    const service = {
      getAttendanceHistory: async ({ query }) => {
        assert.equal(query.page, 1);
        return expected;
      }
    };

    const controller = createTeacherAttendanceController({ teacherAttendanceService: service });
    const req = { user: { _id: 'u1' }, query: { page: 1 } };
    const res = createRes();

    await controller.getAttendanceHistory(req, res, (err) => { throw err; });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { success: true, data: expected });
  });

  it('passes errors to next()', async () => {
    const expectedError = new Error('failure');
    const service = {
      checkIn: async () => {
        throw expectedError;
      }
    };

    const controller = createTeacherAttendanceController({ teacherAttendanceService: service });
    const req = { user: { _id: 'u1' }, body: {}, headers: {}, ip: '' };
    const res = createRes();
    let received = null;

    await controller.checkIn(req, res, (error) => {
      received = error;
    });

    assert.equal(received, expectedError);
  });
});
