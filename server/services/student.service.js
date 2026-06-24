const mongoose = require('mongoose');
const { Student } = require('../models');

const listStudents = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = filters.search.trim();
    if (search) {
      query.$or = [
        { studentId: new RegExp(search, 'i') },
        { fullName: new RegExp(search, 'i') },
        { className: new RegExp(search, 'i') },
        { guardianName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.className) {
    query.className = new RegExp(filters.className.trim(), 'i');
  }

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
