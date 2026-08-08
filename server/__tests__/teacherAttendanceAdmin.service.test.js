const { strict: assert } = require('node:assert');
const { describe, it } = require('node:test');

const { createTeacherAttendanceAdminService } = require('../services/teacherAttendanceAdmin.service');

describe('teacherAttendanceAdmin.service', () => {
  it('builds daily report from reused summary and attendance queries', async () => {
    const service = createTeacherAttendanceAdminService({
      nowProvider: () => new Date('2026-08-07T08:00:00Z'),
      TeacherModel: {
        find: () => ({ select: () => ({ lean: async () => [] }) })
      },
      TeacherAttendanceModel: {
        find: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => ({ lean: async () => [{ status: 'PRESENT', attendanceMethod: 'QR', teacherId: { teacherId: 'T-001', fullName: 'A' } }] })
              })
            })
          })
        }),
        countDocuments: async () => 1,
        aggregate: async () => []
      },
      businessServices: {
        todayAttendanceSummaryService: {
          getTodaySummary: async () => ({
            date: new Date('2026-08-07T00:00:00Z'),
            checkedIn: 1,
            checkedOut: 0,
            byStatus: { PRESENT: 1, LATE: 0, ABSENT: 0, LEAVE: 0 }
          })
        },
        attendanceHistoryQueryService: {
          queryHistory: async () => ({ items: [], meta: { total: 0 } })
        }
      }
    });

    const report = await service.getDailyReport({});
    assert.equal(report.meta.total, 1);
    assert.equal(report.summary.byStatus.PRESENT, 1);
  });

  it('returns teacher detail with totals and history', async () => {
    const service = createTeacherAttendanceAdminService({
      TeacherModel: {
        findById: () => ({ lean: async () => ({ _id: '507f1f77bcf86cd799439011', fullName: 'Teacher A' }) }),
        find: () => ({ select: () => ({ lean: async () => [] }) })
      },
      TeacherAttendanceModel: {
        aggregate: async () => [{ present: 2, late: 1, absent: 0, leave: 0, checkedIn: 3, checkedOut: 2, total: 3 }]
      },
      businessServices: {
        attendanceHistoryQueryService: {
          queryHistory: async () => ({ items: [{ _id: '1' }], meta: { total: 1 } })
        },
        todayAttendanceSummaryService: {
          getTodaySummary: async () => ({ byStatus: { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 } })
        }
      }
    });

    const detail = await service.getTeacherAttendanceDetail('507f1f77bcf86cd799439011', {});
    assert.equal(detail.teacher.fullName, 'Teacher A');
    assert.equal(detail.totals.total, 3);
    assert.equal(detail.history.meta.total, 1);
  });

  it('exports excel and pdf payloads', async () => {
    const service = createTeacherAttendanceAdminService({
      nowProvider: () => new Date('2026-08-07T08:00:00Z'),
      TeacherModel: {
        find: () => ({ select: () => ({ lean: async () => [] }) })
      },
      TeacherAttendanceModel: {
        find: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => ({ lean: async () => [] })
              })
            })
          })
        }),
        countDocuments: async () => 0,
        aggregate: async () => []
      },
      businessServices: {
        todayAttendanceSummaryService: {
          getTodaySummary: async () => ({
            date: new Date('2026-08-07T00:00:00Z'),
            checkedIn: 0,
            checkedOut: 0,
            byStatus: { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 }
          })
        },
        attendanceHistoryQueryService: {
          queryHistory: async () => ({ items: [], meta: { total: 0 } })
        }
      }
    });

    const excel = await service.exportExcel({ reportType: 'daily' });
    const pdf = await service.exportPdf({ reportType: 'daily' });

    assert.equal(excel.contentType, 'application/vnd.ms-excel');
    assert.ok(Buffer.isBuffer(excel.content));
    assert.equal(pdf.contentType, 'application/pdf');
    assert.ok(Buffer.isBuffer(pdf.content));
  });
});
