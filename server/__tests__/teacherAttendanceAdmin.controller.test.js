const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

const { createTeacherAttendanceAdminController } = require('../controllers/teacherAttendanceAdmin.controller');

const createRes = () => ({
  statusCode: 200,
  payload: null,
  headers: {},
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  },
  setHeader(key, value) {
    this.headers[key] = value;
  },
  send(body) {
    this.payload = body;
    return this;
  }
});

describe('teacherAttendanceAdmin.controller', () => {
  it('returns today attendance payload', async () => {
    const service = { getTodayAttendance: async () => ({ items: [], meta: { total: 0 } }) };
    const controller = createTeacherAttendanceAdminController({ service });
    const req = { query: {} };
    const res = createRes();

    await controller.getTodayAttendance(req, res, (err) => { throw err; });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { success: true, data: { items: [], meta: { total: 0 } } });
  });

  it('returns teacher attendance detail payload', async () => {
    const service = {
      getTeacherAttendanceDetail: async (teacherId) => ({ teacherId })
    };
    const controller = createTeacherAttendanceAdminController({ service });
    const req = { params: { teacherId: 'abc' }, query: {} };
    const res = createRes();

    await controller.getTeacherAttendanceDetail(req, res, (err) => { throw err; });
    assert.deepEqual(res.payload, { success: true, data: { teacherId: 'abc' } });
  });

  it('exports excel with attachment headers', async () => {
    const service = {
      exportExcel: async () => ({
        filename: 'report.xls',
        contentType: 'application/vnd.ms-excel',
        content: Buffer.from('abc')
      })
    };
    const controller = createTeacherAttendanceAdminController({ service });
    const req = { query: {} };
    const res = createRes();

    await controller.exportExcel(req, res, (err) => { throw err; });

    assert.equal(res.headers['Content-Type'], 'application/vnd.ms-excel');
    assert.equal(res.headers['Content-Disposition'], 'attachment; filename="report.xls"');
    assert.ok(Buffer.isBuffer(res.payload));
  });

  it('exports pdf with attachment headers', async () => {
    const service = {
      exportPdf: async () => ({
        filename: 'report.pdf',
        contentType: 'application/pdf',
        content: Buffer.from('xyz')
      })
    };
    const controller = createTeacherAttendanceAdminController({ service });
    const req = { query: {} };
    const res = createRes();

    await controller.exportPdf(req, res, (err) => { throw err; });

    assert.equal(res.headers['Content-Type'], 'application/pdf');
    assert.equal(res.headers['Content-Disposition'], 'attachment; filename="report.pdf"');
    assert.ok(Buffer.isBuffer(res.payload));
  });

  it('passes errors to next()', async () => {
    const expected = new Error('boom');
    const service = {
      getDailyReport: async () => {
        throw expected;
      }
    };
    const controller = createTeacherAttendanceAdminController({ service });
    const req = { query: {} };
    const res = createRes();
    let received = null;

    await controller.getDailyReport(req, res, (err) => { received = err; });
    assert.equal(received, expected);
  });
});
