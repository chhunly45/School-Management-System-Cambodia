const mongoose = require('mongoose');
const { Class: ClassModel, AcademicYear, Grade } = require('../models');

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const ensureReferencesExist = async ({ academicYearId, gradeId }) => {
  ensureMongoId(academicYearId, 'academicYearId');
  ensureMongoId(gradeId, 'gradeId');

  const [yearExists, gradeExists] = await Promise.all([
    AcademicYear.exists({ _id: academicYearId }),
    Grade.exists({ _id: gradeId })
  ]);

  if (!yearExists) {
    const error = new Error('Academic year not found');
    error.statusCode = 404;
    throw error;
  }

  if (!gradeExists) {
    const error = new Error('Grade not found');
    error.statusCode = 404;
    throw error;
  }
};

const buildQuery = (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { className: new RegExp(safeSearch, 'i') },
        { description: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = String(filters.status).trim();
  }

  if (filters.academicYearId) {
    ensureMongoId(filters.academicYearId, 'academicYearId');
    query.academicYearId = filters.academicYearId;
  }

  if (filters.gradeId) {
    ensureMongoId(filters.gradeId, 'gradeId');
    query.gradeId = filters.gradeId;
  }

  return query;
};

const listClasses = async (filters = {}) => {
  const query = buildQuery(filters);
  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 20;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    ClassModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('academicYearId', 'code name')
      .populate('gradeId', 'code name level')
      .lean(),
    ClassModel.countDocuments(query)
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getClassById = async (id) => {
  ensureMongoId(id, 'class id');

  const item = await ClassModel.findById(id)
    .populate('academicYearId', 'code name')
    .populate('gradeId', 'code name level')
    .lean();

  if (!item) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }

  return item;
};

const createClass = async (payload) => {
  await ensureReferencesExist({ academicYearId: payload.academicYearId, gradeId: payload.gradeId });

  const normalizedName = String(payload.className || '').trim();
  const capacity = Number(payload.capacity);

  const existing = await ClassModel.findOne({
    className: normalizedName,
    academicYearId: payload.academicYearId,
    gradeId: payload.gradeId
  });

  if (existing) {
    const error = new Error('Class already exists for this academic year and grade');
    error.statusCode = 409;
    throw error;
  }

  const item = await ClassModel.create({
    ...payload,
    className: normalizedName,
    capacity
  });

  return item.toObject();
};

const updateClass = async (id, payload) => {
  ensureMongoId(id, 'class id');

  const item = await ClassModel.findById(id);
  if (!item) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }

  const nextAcademicYearId = payload.academicYearId || item.academicYearId.toString();
  const nextGradeId = payload.gradeId || item.gradeId.toString();
  const nextName = payload.className ? String(payload.className).trim() : item.className;
  const nextCapacity = payload.capacity !== undefined ? Number(payload.capacity) : item.capacity;

  await ensureReferencesExist({ academicYearId: nextAcademicYearId, gradeId: nextGradeId });

  const existing = await ClassModel.findOne({
    _id: { $ne: id },
    className: nextName,
    academicYearId: nextAcademicYearId,
    gradeId: nextGradeId
  });

  if (existing) {
    const error = new Error('Class already exists for this academic year and grade');
    error.statusCode = 409;
    throw error;
  }

  Object.assign(item, {
    ...payload,
    className: nextName,
    academicYearId: nextAcademicYearId,
    gradeId: nextGradeId,
    capacity: nextCapacity
  });

  await item.save();
  return item.toObject();
};

const deleteClass = async (id) => {
  ensureMongoId(id, 'class id');

  const item = await ClassModel.findByIdAndDelete(id);
  if (!item) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }

  return item.toObject();
};

module.exports = {
  listClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
