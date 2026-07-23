const mongoose = require('mongoose');
const { Student } = require('../models');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listStudents = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { studentId: new RegExp(safeSearch, 'i') },
        { fullName: new RegExp(safeSearch, 'i') },
        { className: new RegExp(safeSearch, 'i') },
        { guardianName: new RegExp(safeSearch, 'i') },
        { phone: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.className) {
    query.className = new RegExp(escapeRegex(String(filters.className).trim()), 'i');
  }

  if (filters.academicYear) {
    query.academicYear = new RegExp(escapeRegex(String(filters.academicYear).trim()), 'i');
  }

  if (filters.course) {
    query.course = new RegExp(escapeRegex(String(filters.course).trim()), 'i');
  }

  if (filters.level) {
    query.level = new RegExp(escapeRegex(String(filters.level).trim()), 'i');
  }

  if (filters.room) {
    query.room = new RegExp(escapeRegex(String(filters.room).trim()), 'i');
  }

  if (filters.studyShift) {
    query.studyShift = new RegExp(escapeRegex(String(filters.studyShift).trim()), 'i');
  }

  if (filters.grade) {
    query.grade = new RegExp(escapeRegex(String(filters.grade).trim()), 'i');
  }

  if (filters.className) {
    query.className = new RegExp(escapeRegex(String(filters.className).trim()), 'i');
  }

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getStudentById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid student id');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(id).lean();
  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  return student;
};

const createStudent = async (payload) => {
  const existing = await Student.findOne({ studentId: payload.studentId });
  if (existing) {
    const error = new Error('Student ID already exists');
    error.statusCode = 409;
    throw error;
  }

  const student = await Student.create(payload);
  return student;
};

const updateStudent = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid student id');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(id);
  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  if (payload.studentId && payload.studentId !== student.studentId) {
    const existing = await Student.findOne({ studentId: payload.studentId });
    if (existing) {
      const error = new Error('Student ID already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(student, payload);
  await student.save();

  return student.toObject();
};

const deleteStudent = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid student id');
    error.statusCode = 400;
    throw error;
  }

  const student = await Student.findById(id);
  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  await student.deleteOne();
};

module.exports = {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
