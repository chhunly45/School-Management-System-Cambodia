const mongoose = require('mongoose');
const { Student, AcademicYear, Grade, Class: ClassModel } = require('../models');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
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

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('academicYearId', 'code name status')
      .populate('gradeId', 'code name level status')
      .populate('classId', 'className academicYearId gradeId status')
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

  const student = await Student.findById(id)
    .populate('academicYearId', 'code name status')
    .populate('gradeId', 'code name level status')
    .populate('classId', 'className academicYearId gradeId status')
    .lean();
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

  await ensureReferencesExist({
    academicYearId: payload.academicYearId,
    gradeId: payload.gradeId,
    classId: payload.classId
  });

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

  await ensureReferencesExist({
    academicYearId: payload.academicYearId,
    gradeId: payload.gradeId,
    classId: payload.classId
  });

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
