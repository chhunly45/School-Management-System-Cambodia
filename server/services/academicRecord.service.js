const mongoose = require('mongoose');
const { AcademicRecord } = require('../models');

const calculateGrade = (score) => {
  const numericScore = Number(score);

  if (numericScore >= 90) return 'A';
  if (numericScore >= 80) return 'B';
  if (numericScore >= 70) return 'C';
  if (numericScore >= 60) return 'D';
  return 'F';
};

const buildQuery = (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = filters.search.toString().trim();
    if (search) {
      query.$or = [
        { studentId: new RegExp(search, 'i') },
        { studentName: new RegExp(search, 'i') },
        { className: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { remarks: new RegExp(search, 'i') }
      ];
    }
  }

  if (filters.className) {
    query.className = new RegExp(filters.className.toString().trim(), 'i');
  }

  if (filters.subject) {
    query.subject = new RegExp(filters.subject.toString().trim(), 'i');
  }

  if (filters.examType) {
    query.examType = filters.examType.toString().trim();
  }

  if (filters.academicYear) {
    query.academicYear = new RegExp(filters.academicYear.toString().trim(), 'i');
  }

  if (filters.semester) {
    query.semester = Number(filters.semester);
  }

  return query;
};

const listAcademicRecords = async (filters = {}) => {
  const query = buildQuery(filters);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AcademicRecord.find(query)
      .sort({ academicYear: -1, semester: -1, className: 1, subject: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AcademicRecord.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getAcademicRecordById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid academic record id');
    error.statusCode = 400;
    throw error;
  }

  const record = await AcademicRecord.findById(id).lean();
  if (!record) {
    const error = new Error('Academic record not found');
    error.statusCode = 404;
    throw error;
  }

  return record;
};

const createAcademicRecord = async (payload) => {
  payload.grade = calculateGrade(payload.score);

  const existing = await AcademicRecord.findOne({
    studentId: payload.studentId,
    subject: payload.subject,
    examType: payload.examType,
    academicYear: payload.academicYear,
    semester: payload.semester
  });

  if (existing) {
    const error = new Error('Academic record already exists for this student, subject, exam type, year and semester');
    error.statusCode = 409;
    throw error;
  }

  const record = await AcademicRecord.create(payload);
  return record;
};

const updateAcademicRecord = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid academic record id');
    error.statusCode = 400;
    throw error;
  }

  const record = await AcademicRecord.findById(id);
  if (!record) {
    const error = new Error('Academic record not found');
    error.statusCode = 404;
    throw error;
  }

  const score = payload.score !== undefined ? Number(payload.score) : record.score;
  payload.grade = calculateGrade(score);

  const studentId = payload.studentId || record.studentId;
  const subject = payload.subject || record.subject;
  const examType = payload.examType || record.examType;
  const academicYear = payload.academicYear || record.academicYear;
  const semester = payload.semester || record.semester;

  const existing = await AcademicRecord.findOne({
    studentId,
    subject,
    examType,
    academicYear,
    semester,
    _id: { $ne: id }
  });

  if (existing) {
    const error = new Error('Academic record already exists for this student, subject, exam type, year and semester');
    error.statusCode = 409;
    throw error;
  }

  Object.assign(record, payload);
  await record.save();

  return record.toObject();
};

const deleteAcademicRecord = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid academic record id');
    error.statusCode = 400;
    throw error;
  }

  const record = await AcademicRecord.findByIdAndDelete(id);
  if (!record) {
    const error = new Error('Academic record not found');
    error.statusCode = 404;
    throw error;
  }

  return record;
};

module.exports = {
  listAcademicRecords,
  getAcademicRecordById,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord
};
