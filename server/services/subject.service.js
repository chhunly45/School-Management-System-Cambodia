const mongoose = require('mongoose');
const { Subject } = require('../models');

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
        { description: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = String(filters.status).trim();
  }

  return query;
};

const listSubjects = async (filters = {}) => {
  const query = buildQuery(filters);
  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 20;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Subject.find(query).sort({ name: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subject.countDocuments(query)
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

const getSubjectById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid subject id');
    error.statusCode = 400;
    throw error;
  }

  const subject = await Subject.findById(id).lean();
  if (!subject) {
    const error = new Error('Subject not found');
    error.statusCode = 404;
    throw error;
  }

  return subject;
};

const createSubject = async (payload) => {
  const code = normalizeCode(payload.code);
  const credit = payload.credit === undefined ? 1 : Number(payload.credit);

  const existingCode = await Subject.findOne({ code });
  if (existingCode) {
    const error = new Error('Subject code already exists');
    error.statusCode = 409;
    throw error;
  }

  const subject = await Subject.create({
    ...payload,
    code,
    credit
  });

  return subject.toObject();
};

const updateSubject = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid subject id');
    error.statusCode = 400;
    throw error;
  }

  const subject = await Subject.findById(id);
  if (!subject) {
    const error = new Error('Subject not found');
    error.statusCode = 404;
    throw error;
  }

  const nextCode = payload.code ? normalizeCode(payload.code) : subject.code;
  const nextCredit = payload.credit !== undefined ? Number(payload.credit) : subject.credit;

  if (nextCode !== subject.code) {
    const existingCode = await Subject.findOne({ code: nextCode });
    if (existingCode) {
      const error = new Error('Subject code already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(subject, {
    ...payload,
    code: nextCode,
    credit: nextCredit
  });

  await subject.save();
  return subject.toObject();
};

const deleteSubject = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid subject id');
    error.statusCode = 400;
    throw error;
  }

  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    const error = new Error('Subject not found');
    error.statusCode = 404;
    throw error;
  }

  return subject.toObject();
};

module.exports = {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};