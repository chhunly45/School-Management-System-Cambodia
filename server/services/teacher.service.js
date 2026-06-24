const mongoose = require('mongoose');
const { Teacher } = require('../models');

const listTeachers = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = filters.search.trim();
    if (search) {
      query.$or = [
        { teacherId: new RegExp(search, 'i') },
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') },
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
    Teacher.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Teacher.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getTeacherById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid teacher id');
    error.statusCode = 400;
    throw error;
  }

  const teacher = await Teacher.findById(id).lean();
  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  return teacher;
};

const createTeacher = async (payload) => {
  const existing = await Teacher.findOne({ teacherId: payload.teacherId });
  if (existing) {
    const error = new Error('Teacher ID already exists');
    error.statusCode = 409;
    throw error;
  }

  const teacher = await Teacher.create(payload);
  return teacher;
};

const updateTeacher = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid teacher id');
    error.statusCode = 400;
    throw error;
  }

  const teacher = await Teacher.findById(id);
  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  if (payload.teacherId && payload.teacherId !== teacher.teacherId) {
    const existing = await Teacher.findOne({ teacherId: payload.teacherId });
    if (existing) {
      const error = new Error('Teacher ID already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(teacher, payload);
  await teacher.save();

  return teacher.toObject();
};

const deleteTeacher = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid teacher id');
    error.statusCode = 400;
    throw error;
  }

  const teacher = await Teacher.findByIdAndDelete(id);
  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  return teacher;
};

module.exports = {
  listTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
