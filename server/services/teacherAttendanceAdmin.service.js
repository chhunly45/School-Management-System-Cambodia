const mongoose = require('mongoose');
const { TeacherAttendance, Teacher } = require('../models');
const { createTeacherAttendanceServices } = require('./teacherAttendance');
const { normalizeToDayStart, addDays } = require('./teacherAttendance/time.utils');

const MAX_PER_PAGE = 100;

const escapeXml = (value = '') => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const escapePdf = (value = '') => String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildSimplePdfBuffer = (lines = []) => {
  const safeLines = lines.slice(0, 80);
  const contentLines = ['BT', '/F1 11 Tf', '40 780 Td'];
  safeLines.forEach((line, index) => {
    if (index > 0) contentLines.push('0 -14 Td');
    contentLines.push(`(${escapePdf(line)}) Tj`);
  });
  contentLines.push('ET');

  const stream = contentLines.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ];

  let body = '';
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += obj;
  });

  const header = '%PDF-1.4\n';
  const xrefStart = Buffer.byteLength(header + body, 'utf8');
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    const absoluteOffset = Buffer.byteLength(header, 'utf8') + offsets[i];
    xref += `${String(absoluteOffset).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(header + body + xref + trailer, 'utf8');
};

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const createTeacherAttendanceAdminService = ({
  TeacherAttendanceModel = TeacherAttendance,
  TeacherModel = Teacher,
  businessServices = createTeacherAttendanceServices(),
  nowProvider = () => new Date()
} = {}) => {
  const resolveTeacherIdsBySearch = async (search) => {
    const term = String(search || '').trim();
    if (!term) return null;

    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const teachers = await TeacherModel.find({
      $or: [{ teacherId: re }, { fullName: re }, { email: re }, { phone: re }]
    }).select('_id').lean();

    return teachers.map((item) => item._id);
  };

  const getTodayAttendance = async ({ search, status, sessionType, page = 1, perPage = 20, date } = {}) => {
    const dayStart = normalizeToDayStart(date || nowProvider());
    const dayEnd = addDays(dayStart, 1);

    const query = {
      attendanceDate: { $gte: dayStart, $lt: dayEnd },
      isDeleted: false
    };

    if (status) {
      query.status = String(status).trim().toUpperCase();
    }
    if (sessionType) {
      query.sessionType = String(sessionType).trim().toLowerCase();
    }

    const teacherIds = await resolveTeacherIdsBySearch(search);
    if (teacherIds && teacherIds.length === 0) {
      return {
        summary: await businessServices.todayAttendanceSummaryService.getTodaySummary({ referenceDate: dayStart }),
        items: [],
        meta: { page: 1, limit: Math.min(Math.max(Number(perPage) || 20, 1), MAX_PER_PAGE), total: 0 }
      };
    }
    if (teacherIds && teacherIds.length > 0) {
      query.teacherId = { $in: teacherIds };
    }

    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedPerPage = Math.min(Math.max(Number(perPage) || 20, 1), MAX_PER_PAGE);
    const skip = (normalizedPage - 1) * normalizedPerPage;

    const [summary, items, total] = await Promise.all([
      businessServices.todayAttendanceSummaryService.getTodaySummary({ referenceDate: dayStart }),
      TeacherAttendanceModel.find(query)
        .populate('teacherId', 'teacherId fullName phone email status')
        .sort({ checkInTime: 1, createdAt: 1 })
        .skip(skip)
        .limit(normalizedPerPage)
        .lean(),
      TeacherAttendanceModel.countDocuments(query)
    ]);

    return {
      summary,
      items,
      meta: {
        page: normalizedPage,
        limit: normalizedPerPage,
        total
      }
    };
  };

  const settleAbsent = async ({ date, sessionType } = {}) => businessServices.absentSettlementService.settleAbsent({ date, sessionType });

  const getTeacherAttendanceDetail = async (teacherId, query = {}) => {
    ensureMongoId(teacherId, 'teacherId');

    const teacher = await TeacherModel.findById(teacherId).lean();
    if (!teacher) {
      const error = new Error('Teacher not found');
      error.statusCode = 404;
      throw error;
    }

    const history = await businessServices.attendanceHistoryQueryService.queryHistory({
      teacherId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      status: query.status,
      attendanceMethod: query.attendanceMethod,
      sessionType: query.sessionType,
      page: query.page,
      perPage: query.perPage
    });

    const match = { teacherId: new mongoose.Types.ObjectId(teacherId), isDeleted: false };
    if (query.fromDate || query.toDate) {
      const start = query.fromDate ? normalizeToDayStart(query.fromDate) : new Date(0);
      const end = query.toDate ? addDays(normalizeToDayStart(query.toDate), 1) : new Date('9999-12-31T23:59:59.999Z');
      match.attendanceDate = { $gte: start, $lt: end };
    }

    const totals = await TeacherAttendanceModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ['$status', 'LEAVE'] }, 1, 0] } },
          checkedIn: { $sum: { $cond: [{ $ne: ['$checkInTime', null] }, 1, 0] } },
          checkedOut: { $sum: { $cond: [{ $ne: ['$checkOutTime', null] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    return {
      teacher,
      totals: totals[0] || { present: 0, late: 0, absent: 0, leave: 0, checkedIn: 0, checkedOut: 0, total: 0 },
      history
    };
  };

  const getDailyReport = async ({ date, search, status, page, perPage } = {}) => {
    return getTodayAttendance({ date, search, status, page, perPage });
  };

  const getMonthlyReport = async ({ year, month, search } = {}) => {
    const now = nowProvider();
    const reportYear = Number(year) || now.getFullYear();
    const reportMonth = Number(month) || (now.getMonth() + 1);
    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 1);

    const match = {
      attendanceDate: { $gte: startDate, $lt: endDate },
      isDeleted: false
    };

    const teacherIds = await resolveTeacherIdsBySearch(search);
    if (teacherIds && teacherIds.length === 0) {
      return {
        period: { year: reportYear, month: reportMonth, startDate, endDate },
        totals: { totalRecords: 0, byStatus: [], byMethod: [] },
        dailyTrend: [],
        teachers: []
      };
    }
    if (teacherIds && teacherIds.length > 0) {
      match.teacherId = { $in: teacherIds };
    }

    const [byStatus, byMethod, dailyTrend, teachers] = await Promise.all([
      TeacherAttendanceModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', total: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', total: 1 } },
        { $sort: { status: 1 } }
      ]),
      TeacherAttendanceModel.aggregate([
        { $match: match },
        { $group: { _id: '$attendanceMethod', total: { $sum: 1 } } },
        { $project: { _id: 0, method: '$_id', total: 1 } },
        { $sort: { method: 1 } }
      ]),
      TeacherAttendanceModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$attendanceDate' },
              month: { $month: '$attendanceDate' },
              day: { $dayOfMonth: '$attendanceDate' }
            },
            total: { $sum: 1 },
            late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      TeacherAttendanceModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$teacherId',
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
            leave: { $sum: { $cond: [{ $eq: ['$status', 'LEAVE'] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'teachers',
            localField: '_id',
            foreignField: '_id',
            as: 'teacher'
          }
        },
        { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            teacherId: '$_id',
            teacherCode: '$teacher.teacherId',
            teacherName: '$teacher.fullName',
            total: 1,
            present: 1,
            late: 1,
            absent: 1,
            leave: 1
          }
        },
        { $sort: { teacherName: 1 } }
      ])
    ]);

    const totalRecords = byStatus.reduce((sum, item) => sum + item.total, 0);
    return {
      period: { year: reportYear, month: reportMonth, startDate, endDate },
      totals: { totalRecords, byStatus, byMethod },
      dailyTrend: dailyTrend.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        total: item.total,
        late: item.late
      })),
      teachers
    };
  };

  const exportExcel = async ({ reportType = 'daily', ...query } = {}) => {
    const normalizedType = String(reportType || 'daily').toLowerCase();
    const report = normalizedType === 'monthly'
      ? await getMonthlyReport(query)
      : await getDailyReport(query);

    const rows = normalizedType === 'monthly'
      ? [
        ['Report', 'Teacher Attendance Monthly'],
        ['Year', report.period.year],
        ['Month', report.period.month],
        ['Total Records', report.totals.totalRecords],
        [],
        ['Date', 'Total', 'Late'],
        ...report.dailyTrend.map((item) => [item.date, item.total, item.late])
      ]
      : [
        ['Report', 'Teacher Attendance Daily'],
        ['Date', new Date(report.summary.date).toISOString().slice(0, 10)],
        ['Checked In', report.summary.checkedIn],
        ['Checked Out', report.summary.checkedOut],
        ['Present', report.summary.byStatus.PRESENT],
        ['Late', report.summary.byStatus.LATE],
        ['Absent', report.summary.byStatus.ABSENT],
        ['Leave', report.summary.byStatus.LEAVE],
        [],
        ['Teacher Code', 'Teacher Name', 'Session', 'Status', 'Method', 'Check In', 'Check Out'],
        ...report.items.map((item) => [
          item.teacherId?.teacherId || '',
          item.teacherId?.fullName || '',
          item.sessionType || 'legacy',
          item.status,
          item.attendanceMethod,
          item.checkInTime ? new Date(item.checkInTime).toISOString() : '',
          item.checkOutTime ? new Date(item.checkOutTime).toISOString() : ''
        ])
      ];

    const xml = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n  <Worksheet ss:Name="Attendance">\n    <Table>\n${rows.map((row) => `      <Row>${(row || []).map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`).join('\n')}\n    </Table>\n  </Worksheet>\n</Workbook>`;

    return {
      filename: `teacher-attendance-${normalizedType}-${new Date().toISOString().slice(0, 10)}.xls`,
      contentType: 'application/vnd.ms-excel',
      content: Buffer.from(xml, 'utf8')
    };
  };

  const exportPdf = async ({ reportType = 'daily', ...query } = {}) => {
    const normalizedType = String(reportType || 'daily').toLowerCase();
    const report = normalizedType === 'monthly'
      ? await getMonthlyReport(query)
      : await getDailyReport(query);

    const lines = normalizedType === 'monthly'
      ? [
        'Teacher Attendance Monthly Report',
        `Period: ${report.period.year}-${String(report.period.month).padStart(2, '0')}`,
        `Total Records: ${report.totals.totalRecords}`,
        '',
        'Daily Trend:',
        ...report.dailyTrend.slice(0, 50).map((item) => `${item.date} | total=${item.total} | late=${item.late}`)
      ]
      : [
        'Teacher Attendance Daily Report',
        `Date: ${new Date(report.summary.date).toISOString().slice(0, 10)}`,
        `Checked In: ${report.summary.checkedIn}`,
        `Checked Out: ${report.summary.checkedOut}`,
        `Present: ${report.summary.byStatus.PRESENT}`,
        `Late: ${report.summary.byStatus.LATE}`,
        `Absent: ${report.summary.byStatus.ABSENT}`,
        `Leave: ${report.summary.byStatus.LEAVE}`,
        '',
        'Records:',
        ...report.items.slice(0, 50).map((item) => `${item.teacherId?.teacherId || '-'} | ${item.teacherId?.fullName || '-'} | ${item.sessionType || 'legacy'} | ${item.status} | ${item.attendanceMethod}`)
      ];

    return {
      filename: `teacher-attendance-${normalizedType}-${new Date().toISOString().slice(0, 10)}.pdf`,
      contentType: 'application/pdf',
      content: buildSimplePdfBuffer(lines)
    };
  };

  return {
    getTodayAttendance,
    getTeacherAttendanceDetail,
    getDailyReport,
    getMonthlyReport,
    exportExcel,
    exportPdf
    ,settleAbsent
  };
};

module.exports = createTeacherAttendanceAdminService();
module.exports.createTeacherAttendanceAdminService = createTeacherAttendanceAdminService;
