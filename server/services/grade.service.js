const mongoose = require('mongoose');
const { Grade } = require('../models');

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCode = (value = '') => value.trim().toUpperCase();

const buildQuery = (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { code: new RegExp(safeSearch, 'i') },
        { name: new RegExp(safeSearch, 'i') },
        { remarks: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = String(filters.status).trim();
  }

  if (filters.level) {
    query.level = Number(filters.level);
  }

  return query;
};

const listGrades = async (filters = {}) => {
  const query = buildQuery(filters);
  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 20;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Grade.find(query).sort({ level: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Grade.countDocuments(query)
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

const getGradeById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid grade id');
    error.statusCode = 400;
    throw error;
  }

  const grade = await Grade.findById(id).lean();
  if (!grade) {
    const error = new Error('Grade not found');
    error.statusCode = 404;
    throw error;
  }

  return grade;
};

const createGrade = async (payload) => {
  const code = normalizeCode(payload.code);
  const level = Number(payload.level);

  const existingCode = await Grade.findOne({ code });
  if (existingCode) {
    const error = new Error('Grade code already exists');
    error.statusCode = 409;
    throw error;
  }

  const existingLevel = await Grade.findOne({ level });
  if (existingLevel) {
    const error = new Error('Grade level already exists');
    error.statusCode = 409;
    throw error;
  }

  const grade = await Grade.create({
    ...payload,
    code,
    level
  });

  return grade.toObject();
};

const updateGrade = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid grade id');
    error.statusCode = 400;
    throw error;
  }

  const grade = await Grade.findById(id);
  if (!grade) {
    const error = new Error('Grade not found');
    error.statusCode = 404;
    throw error;
  }

  const nextCode = payload.code ? normalizeCode(payload.code) : grade.code;
  const nextLevel = payload.level !== undefined ? Number(payload.level) : grade.level;

  if (nextCode !== grade.code) {
    const existingCode = await Grade.findOne({ code: nextCode });
    if (existingCode) {
      const error = new Error('Grade code already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  if (nextLevel !== grade.level) {
    const existingLevel = await Grade.findOne({ level: nextLevel });
    if (existingLevel) {
      const error = new Error('Grade level already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(grade, {
    ...payload,
    code: nextCode,
    level: nextLevel
  });

  await grade.save();
  return grade.toObject();
};

const deleteGrade = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid grade id');
    error.statusCode = 400;
    throw error;
  }

  const grade = await Grade.findByIdAndDelete(id);
  if (!grade) {
    const error = new Error('Grade not found');
    error.statusCode = 404;
    throw error;
  }

  return grade.toObject();
};

module.exports = {
  listGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade
};
