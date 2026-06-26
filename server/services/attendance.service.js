const mongoose = require('mongoose');
const { Attendance, AcademicYear, Grade, Class: ClassModel } = require('../models');

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const shouldIncludeRelations = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const normalizeToDayStart = (value) => {
  const input = new Date(value);
  if (Number.isNaN(input.getTime())) {
    const error = new Error('Invalid date');
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(input);
  start.setHours(0, 0, 0, 0);
  return start;
};

const nextDay = (dayStart) => {
  const end = new Date(dayStart);
  end.setDate(end.getDate() + 1);
  return end;
};

const ensureReferencesExist = async ({ academicYearId, gradeId, classId }) => {
  const checks = [];

  if (academicYearId) {
    ensureMongoId(academicYearId, 'academicYearId');
    checks.push(
      AcademicYear.exists({ _id: academicYearId }).then((exists) => {
        if (!exists) {
          const error = new Error('Academic year not found');
          error.statusCode = 404;
          throw error;
        }
      })
    );
  }

  if (gradeId) {
    ensureMongoId(gradeId, 'gradeId');
    checks.push(
      Grade.exists({ _id: gradeId }).then((exists) => {
        if (!exists) {
          const error = new Error('Grade not found');
          error.statusCode = 404;
          throw error;
        }
      })
    );
  }

  if (classId) {
    ensureMongoId(classId, 'classId');
    checks.push(
      ClassModel.exists({ _id: classId }).then((exists) => {
        if (!exists) {
          const error = new Error('Class not found');
          error.statusCode = 404;
          throw error;
        }
      })
    );
  }

  await Promise.all(checks);
};

const withOptionalPopulation = (queryBuilder, includeRelations) => {
  if (!includeRelations) return queryBuilder;

  return queryBuilder
    .populate('academicYearId', 'code name status')
    .populate('gradeId', 'code name level status')
    .populate('classId', 'className academicYearId gradeId status');
};

const listAttendance = async (filters = {}) => {
  const query = {};
  const includeRelations = shouldIncludeRelations(filters.includeRelations);

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { studentId: new RegExp(safeSearch, 'i') },
        { studentName: new RegExp(safeSearch, 'i') },
        { className: new RegExp(safeSearch, 'i') },
        { remarks: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.date) {
    const selectedDate = normalizeToDayStart(filters.date);
    query.date = { $gte: selectedDate, $lt: nextDay(selectedDate) };
  }

  if (filters.className) {
    query.className = new RegExp(escapeRegex(String(filters.className).trim()), 'i');
  }

  if (filters.academicYearId) {
    ensureMongoId(filters.academicYearId, 'academicYearId');
    query.academicYearId = filters.academicYearId;
  }

  if (filters.gradeId) {
    ensureMongoId(filters.gradeId, 'gradeId');
    query.gradeId = filters.gradeId;
  }

  if (filters.classId) {
    ensureMongoId(filters.classId, 'classId');
    query.classId = filters.classId;
  }

  if (filters.academicYear) {
    query.academicYear = new RegExp(escapeRegex(String(filters.academicYear).trim()), 'i');
  }

  if (filters.semester) {
    query.semester = Number(filters.semester);
  }

  if (filters.status) {
    query.status = String(filters.status).trim();
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const findQuery = withOptionalPopulation(
    Attendance.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    includeRelations
  );

  const [items, total] = await Promise.all([
    findQuery.lean(),
    Attendance.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getAttendanceById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid attendance id');
    error.statusCode = 400;
    throw error;
  }

  const attendance = await Attendance.findById(id)
    .populate('academicYearId', 'code name status')
    .populate('gradeId', 'code name level status')
    .populate('classId', 'className academicYearId gradeId status')
    .lean();
  if (!attendance) {
    const error = new Error('Attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  return attendance;
};

const createAttendance = async (payload) => {
  await ensureReferencesExist({
    academicYearId: payload.academicYearId,
    gradeId: payload.gradeId,
    classId: payload.classId
  });

  const normalizedDate = normalizeToDayStart(payload.date);
  const existing = await Attendance.findOne({ studentId: payload.studentId, date: normalizedDate });
  if (existing) {
    const error = new Error('Attendance record already exists for this student and date');
    error.statusCode = 409;
    throw error;
  }

  const attendance = await Attendance.create({
    ...payload,
    date: normalizedDate
  });
  return attendance;
};

const updateAttendance = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid attendance id');
    error.statusCode = 400;
    throw error;
  }

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    const error = new Error('Attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  await ensureReferencesExist({
    academicYearId: payload.academicYearId,
    gradeId: payload.gradeId,
    classId: payload.classId
  });

  const date = payload.date ? normalizeToDayStart(payload.date) : normalizeToDayStart(attendance.date);
  const studentId = payload.studentId || attendance.studentId;

  const existing = await Attendance.findOne({
    studentId,
    date,
    _id: { $ne: id }
  });

  if (existing) {
    const error = new Error('Attendance record already exists for this student and date');
    error.statusCode = 409;
    throw error;
  }

  Object.assign(attendance, payload);
  attendance.date = date;
  await attendance.save();

  return attendance.toObject();
};

const deleteAttendance = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid attendance id');
    error.statusCode = 400;
    throw error;
  }

  const attendance = await Attendance.findByIdAndDelete(id);
  if (!attendance) {
    const error = new Error('Attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  return attendance;
};

const getMonthlyAttendanceReport = async (filters = {}) => {
  const now = new Date();
  const year = Number(filters.year) || now.getFullYear();
  const month = Number(filters.month) || now.getMonth() + 1;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const match = {
    date: { $gte: startDate, $lt: endDate }
  };

  if (filters.academicYearId) {
    ensureMongoId(filters.academicYearId, 'academicYearId');
    match.academicYearId = new mongoose.Types.ObjectId(filters.academicYearId);
  }

  if (filters.gradeId) {
    ensureMongoId(filters.gradeId, 'gradeId');
    match.gradeId = new mongoose.Types.ObjectId(filters.gradeId);
  }

  if (filters.classId) {
    ensureMongoId(filters.classId, 'classId');
    match.classId = new mongoose.Types.ObjectId(filters.classId);
  }

  if (filters.status) {
    match.status = String(filters.status).trim();
  }

  const [statusTotals, classTotals, dailyTrend] = await Promise.all([
    Attendance.aggregate([
      { $match: match },
      { $group: { _id: '$status', total: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', total: 1 } },
      { $sort: { status: 1 } }
    ]),
    Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$className',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
        }
      },
      { $project: { _id: 0, className: '$_id', total: 1, present: 1, absent: 1, late: 1, excused: 1 } },
      { $sort: { className: 1 } }
    ]),
    Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            y: { $year: '$date' },
            m: { $month: '$date' },
            d: { $dayOfMonth: '$date' }
          },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.y',
              month: '$_id.m',
              day: '$_id.d'
            }
          },
          total: 1,
          present: 1
        }
      },
      { $sort: { date: 1 } }
    ])
  ]);

  const totalRecords = statusTotals.reduce((sum, row) => sum + row.total, 0);
  const presentTotal = statusTotals.find((row) => row.status === 'present')?.total || 0;
  const attendanceRate = totalRecords ? Number(((presentTotal / totalRecords) * 100).toFixed(2)) : 0;

  return {
    period: {
      year,
      month,
      startDate,
      endDate: new Date(endDate.getTime() - 1)
    },
    totals: {
      totalRecords,
      attendanceRate,
      byStatus: statusTotals
    },
    byClass: classTotals,
    dailyTrend: dailyTrend.map((row) => ({
      ...row,
      date: new Date(row.date).toISOString().slice(0, 10)
    }))
  };
};

module.exports = {
  listAttendance,
  getMonthlyAttendanceReport,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
};
