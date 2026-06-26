const mongoose = require('mongoose');
const { Teacher, Subject, Class: ClassModel } = require('../models');

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

const ensureReferencesExist = async ({ subjectIds, homeroomClassId }) => {
  if (homeroomClassId) {
    ensureMongoId(homeroomClassId, 'homeroomClassId');
    const homeroomExists = await ClassModel.exists({ _id: homeroomClassId });
    if (!homeroomExists) {
      const error = new Error('Homeroom class not found');
      error.statusCode = 404;
      throw error;
    }
  }

  if (Array.isArray(subjectIds) && subjectIds.length > 0) {
    const normalizedIds = [...new Set(subjectIds.map((id) => String(id)))];
    normalizedIds.forEach((id) => ensureMongoId(id, 'subjectIds'));

    const matchedCount = await Subject.countDocuments({ _id: { $in: normalizedIds } });
    if (matchedCount !== normalizedIds.length) {
      const error = new Error('One or more subjects were not found');
      error.statusCode = 404;
      throw error;
    }
  }
};

const withOptionalPopulation = (queryBuilder, includeRelations) => {
  if (!includeRelations) return queryBuilder;

  return queryBuilder
    .populate('subjectIds', 'code name status')
    .populate('homeroomClassId', 'className academicYearId gradeId status');
};

const listTeachers = async (filters = {}) => {
  const query = {};
  const includeRelations = shouldIncludeRelations(filters.includeRelations);

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { teacherId: new RegExp(safeSearch, 'i') },
        { fullName: new RegExp(safeSearch, 'i') },
        { email: new RegExp(safeSearch, 'i') },
        { specialization: new RegExp(safeSearch, 'i') },
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

  if (filters.subjectId) {
    ensureMongoId(filters.subjectId, 'subjectId');
    query.subjectIds = filters.subjectId;
  }

  if (filters.homeroomClassId) {
    ensureMongoId(filters.homeroomClassId, 'homeroomClassId');
    query.homeroomClassId = filters.homeroomClassId;
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const findQuery = withOptionalPopulation(
    Teacher.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    includeRelations
  );

  const [items, total] = await Promise.all([
    findQuery.lean(),
    Teacher.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getTeacherById = async (id, options = {}) => {
  ensureMongoId(id, 'teacher id');
  const includeRelations = shouldIncludeRelations(options.includeRelations);

  const query = withOptionalPopulation(Teacher.findById(id), includeRelations);
  const teacher = await query.lean();
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

  await ensureReferencesExist({
    subjectIds: payload.subjectIds,
    homeroomClassId: payload.homeroomClassId
  });

  const teacher = await Teacher.create(payload);
  return teacher;
};

const updateTeacher = async (id, payload) => {
  ensureMongoId(id, 'teacher id');

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

  await ensureReferencesExist({
    subjectIds: payload.subjectIds,
    homeroomClassId: payload.homeroomClassId
  });

  Object.assign(teacher, payload);
  await teacher.save();

  return teacher.toObject();
};

const deleteTeacher = async (id) => {
  ensureMongoId(id, 'teacher id');

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
