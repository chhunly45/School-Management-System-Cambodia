const mongoose = require('mongoose');
const { Certificate } = require('../models');

const listCertificates = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = filters.search.toString().trim();
    if (search) {
      query.$or = [
        { certificateNumber: new RegExp(search, 'i') },
        { studentName: new RegExp(search, 'i') },
        { className: new RegExp(search, 'i') },
        { academicYear: new RegExp(search, 'i') },
        { remarks: new RegExp(search, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.certificateType) {
    query.certificateType = filters.certificateType;
  }

  if (filters.academicYear) {
    query.academicYear = new RegExp(filters.academicYear.toString().trim(), 'i');
  }

  if (filters.studentId && mongoose.Types.ObjectId.isValid(filters.studentId)) {
    query.studentId = filters.studentId;
  }

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Certificate.find(query).sort({ issueDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Certificate.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getCertificateById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid certificate id');
    error.statusCode = 400;
    throw error;
  }

  const certificate = await Certificate.findById(id).lean();
  if (!certificate) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    throw error;
  }

  return certificate;
};

const createCertificate = async (payload) => {
  const existing = await Certificate.findOne({ certificateNumber: payload.certificateNumber });
  if (existing) {
    const error = new Error('Certificate number already exists');
    error.statusCode = 409;
    throw error;
  }

  const certificate = await Certificate.create(payload);
  return certificate;
};

const updateCertificate = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid certificate id');
    error.statusCode = 400;
    throw error;
  }

  const certificate = await Certificate.findById(id);
  if (!certificate) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    throw error;
  }

  if (payload.certificateNumber && payload.certificateNumber !== certificate.certificateNumber) {
    const existing = await Certificate.findOne({ certificateNumber: payload.certificateNumber });
    if (existing) {
      const error = new Error('Certificate number already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(certificate, payload);
  await certificate.save();

  return certificate.toObject();
};

const deleteCertificate = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid certificate id');
    error.statusCode = 400;
    throw error;
  }

  const certificate = await Certificate.findByIdAndDelete(id);
  if (!certificate) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    throw error;
  }

  return certificate;
};

module.exports = {
  listCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate
};
