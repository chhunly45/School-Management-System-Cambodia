const mongoose = require('mongoose');
const { User, Teacher, Subject, Class: ClassModel } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authService = require('./auth.service');
const { normalizeCambodiaPhone, phoneSearchVariants } = require('../utils/phone');

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

  const teacherEmails = items.map((item) => String(item.email || '').trim().toLowerCase()).filter(Boolean);
  const accountUsers = teacherEmails.length
    ? await User.find({ email: { $in: teacherEmails } }).select('email').lean()
    : [];
  const accountEmails = new Set(accountUsers.map((item) => item.email));

  return {
    items: items.map((item) => ({ ...item, hasLoginAccount: accountEmails.has(String(item.email || '').trim().toLowerCase()) })),
    meta: { page, limit, total }
  };
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

const createTeacherAccount = async (id) => {
  ensureMongoId(id, 'teacher id');

  const teacher = await Teacher.findById(id).lean();
  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  if (teacher.status !== 'active') {
    const error = new Error('Only active teachers can receive login accounts');
    error.statusCode = 400;
    throw error;
  }

  const email = String(teacher.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Teacher must have a valid email to receive a login account');
    error.statusCode = 400;
    throw error;
  }

  const phoneNumber = normalizeCambodiaPhone(teacher.phone);
  const existingEmail = await User.findOne({ email }).select('_id').lean();
  if (existingEmail) {
    const error = new Error('A login account already exists for this teacher email');
    error.statusCode = 409;
    throw error;
  }

  if (phoneNumber) {
    const existingPhone = await User.findOne({ phoneNumber: { $in: phoneSearchVariants(phoneNumber) } }).select('_id').lean();
    if (existingPhone) {
      const error = new Error('A login account already exists for this teacher phone number');
      error.statusCode = 409;
      throw error;
    }
  }

  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  const user = await User.create({
    email,
    phoneNumber,
    displayName: teacher.fullName,
    passwordHash,
    isActive: true,
    role: 'teacher',
    teacherId: teacher._id,
    emailVerified: true
  });

  try {
    await authService.requestPasswordReset(email);
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  return {
    accountCreated: true,
    user: {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive
    },
    passwordSetup: 'email-reset'
  };
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
  createTeacherAccount,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
