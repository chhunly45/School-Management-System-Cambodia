const mongoose = require('mongoose');
const { Attendance } = require('../models');

const listAttendance = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = filters.search.toString().trim();
    if (search) {
      query.$or = [
        { studentId: new RegExp(search, 'i') },
        { studentName: new RegExp(search, 'i') },
        { className: new RegExp(search, 'i') },
        { remarks: new RegExp(search, 'i') }
      ];
    }
  }

  if (filters.date) {
    const selectedDate = new Date(filters.date);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    query.date = { $gte: selectedDate, $lt: nextDate };
  }

  if (filters.className) {
    query.className = new RegExp(filters.className.toString().trim(), 'i');
  }

  if (filters.academicYear) {
    query.academicYear = new RegExp(filters.academicYear.toString().trim(), 'i');
  }

  if (filters.semester) {
    query.semester = Number(filters.semester);
  }

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Attendance.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
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

  const attendance = await Attendance.findById(id).lean();
  if (!attendance) {
    const error = new Error('Attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  return attendance;
};

const createAttendance = async (payload) => {
  const existing = await Attendance.findOne({ studentId: payload.studentId, date: payload.date });
  if (existing) {
    const error = new Error('Attendance record already exists for this student and date');
    error.statusCode = 409;
    throw error;
  }

  const attendance = await Attendance.create(payload);
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

  const date = payload.date || attendance.date;
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

module.exports = {
  listAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
};
