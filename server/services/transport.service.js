const mongoose = require('mongoose');
const { Transport } = require('../models');

const listTransport = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = filters.search.toString().trim();
    if (search) {
      query.$or = [
        { studentName: new RegExp(search, 'i') },
        { className: new RegExp(search, 'i') },
        { routeName: new RegExp(search, 'i') },
        { pickupPoint: new RegExp(search, 'i') },
        { dropoffPoint: new RegExp(search, 'i') },
        { vehicleNumber: new RegExp(search, 'i') },
        { academicYear: new RegExp(search, 'i') },
        { remarks: new RegExp(search, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.routeName) {
    query.routeName = new RegExp(filters.routeName.toString().trim(), 'i');
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
    Transport.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transport.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getTransportById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid transport id');
    error.statusCode = 400;
    throw error;
  }

  const transport = await Transport.findById(id).lean();
  if (!transport) {
    const error = new Error('Transport record not found');
    error.statusCode = 404;
    throw error;
  }

  return transport;
};

const createTransport = async (payload) => {
  const existing = await Transport.findOne({
    studentId: payload.studentId,
    academicYear: payload.academicYear
  });

  if (existing) {
    const error = new Error('Transport record already exists for this student and academic year');
    error.statusCode = 409;
    throw error;
  }

  const transport = await Transport.create(payload);
  return transport;
};

const updateTransport = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid transport id');
    error.statusCode = 400;
    throw error;
  }

  const transport = await Transport.findById(id);
  if (!transport) {
    const error = new Error('Transport record not found');
    error.statusCode = 404;
    throw error;
  }

  const studentId = payload.studentId || transport.studentId;
  const academicYear = payload.academicYear || transport.academicYear;

  if (studentId && academicYear) {
    const existing = await Transport.findOne({
      studentId,
      academicYear,
      _id: { $ne: id }
    });

    if (existing) {
      const error = new Error('Transport record already exists for this student and academic year');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(transport, payload);
  await transport.save();

  return transport.toObject();
};

const deleteTransport = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid transport id');
    error.statusCode = 400;
    throw error;
  }

  const transport = await Transport.findByIdAndDelete(id);
  if (!transport) {
    const error = new Error('Transport record not found');
    error.statusCode = 404;
    throw error;
  }

  return transport;
};

module.exports = {
  listTransport,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
};
