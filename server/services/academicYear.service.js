const mongoose = require('mongoose');
const { AcademicYear } = require('../models');

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCode = (value = '') => value.trim().toUpperCase();

const assertDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const error = new Error('Invalid start or end date');
    error.statusCode = 400;
    throw error;
  }

  if (start >= end) {
    const error = new Error('startDate must be earlier than endDate');
    error.statusCode = 400;
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
        { code: new RegExp(safeSearch, 'i') },
        { name: new RegExp(safeSearch, 'i') },
        { remarks: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = String(filters.status).trim();
  }

  if (filters.isCurrent !== undefined) {
    if (String(filters.isCurrent).toLowerCase() === 'true') query.isCurrent = true;
    if (String(filters.isCurrent).toLowerCase() === 'false') query.isCurrent = false;
  }

  return query;
};

const listAcademicYears = async (filters = {}) => {
  const query = buildQuery(filters);
  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 20;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AcademicYear.find(query).sort({ startDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    AcademicYear.countDocuments(query)
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

const getAcademicYearById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid academic year id');
    error.statusCode = 400;
    throw error;
  }

  const academicYear = await AcademicYear.findById(id).lean();
  if (!academicYear) {
    const error = new Error('Academic year not found');
    error.statusCode = 404;
    throw error;
  }

  return academicYear;
};

const createAcademicYear = async (payload) => {
  const code = normalizeCode(payload.code);
  assertDateRange(payload.startDate, payload.endDate);

  const existing = await AcademicYear.findOne({ code });
  if (existing) {
    const error = new Error('Academic year code already exists');
    error.statusCode = 409;
    throw error;
  }

  const createPayload = {
    ...payload,
    code
  };

  if (createPayload.isCurrent) {
    await AcademicYear.updateMany({ isCurrent: true }, { $set: { isCurrent: false } });
  }

  const academicYear = await AcademicYear.create(createPayload);
  return academicYear.toObject();
};

const updateAcademicYear = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid academic year id');
    error.statusCode = 400;
    throw error;
  }

  const academicYear = await AcademicYear.findById(id);
  if (!academicYear) {
    const error = new Error('Academic year not found');
    error.statusCode = 404;
    throw error;
  }

  const nextCode = payload.code ? normalizeCode(payload.code) : academicYear.code;
  const nextStartDate = payload.startDate || academicYear.startDate;
  const nextEndDate = payload.endDate || academicYear.endDate;

  assertDateRange(nextStartDate, nextEndDate);

  if (nextCode !== academicYear.code) {
    const existing = await AcademicYear.findOne({ code: nextCode });
    if (existing) {
      const error = new Error('Academic year code already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  if (payload.isCurrent === true) {
    await AcademicYear.updateMany({ isCurrent: true, _id: { $ne: id } }, { $set: { isCurrent: false } });
  }

  Object.assign(academicYear, { ...payload, code: nextCode });
  await academicYear.save();

  return academicYear.toObject();
};

const deleteAcademicYear = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid academic year id');
    error.statusCode = 400;
    throw error;
  }

  const academicYear = await AcademicYear.findByIdAndDelete(id);
  if (!academicYear) {
    const error = new Error('Academic year not found');
    error.statusCode = 404;
    throw error;
  }

  return academicYear.toObject();
};

module.exports = {
  listAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
};
