const mongoose = require('mongoose');
const {
  TransportAssignment,
  Vehicle,
  Route,
  EmployeeAttendance
} = require('../models');

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const parseDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Invalid assignmentDate');
    error.statusCode = 400;
    throw error;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const normalizePayload = (payload = {}) => ({
  assignmentDate: parseDateOnly(payload.assignmentDate),
  vehicleId: String(payload.vehicleId || '').trim(),
  routeId: String(payload.routeId || '').trim(),
  driverEmployeeCode: String(payload.driverEmployeeCode || '').trim(),
  driverName: String(payload.driverName || '').trim(),
  status: String(payload.status || 'scheduled').trim().toLowerCase(),
  notes: String(payload.notes || '').trim()
});

const ensureRelationsValid = async ({ vehicleId, routeId, driverEmployeeCode }) => {
  ensureMongoId(vehicleId, 'vehicleId');
  ensureMongoId(routeId, 'routeId');

  const [vehicle, route, driverAttendance] = await Promise.all([
    Vehicle.findById(vehicleId).select('vehicleCode').lean(),
    Route.findById(routeId).select('routeCode routeName').lean(),
    EmployeeAttendance.findOne({ employeeCode: driverEmployeeCode, employeeType: 'driver' })
      .sort({ date: -1, createdAt: -1 })
      .select('employeeCode employeeName employeeType')
      .lean()
  ]);

  if (!vehicle) {
    const error = new Error('Vehicle not found');
    error.statusCode = 404;
    throw error;
  }

  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }

  if (!driverAttendance || String(driverAttendance.employeeType || '').toLowerCase() !== 'driver') {
    const error = new Error('Driver must be an employee with role driver');
    error.statusCode = 400;
    throw error;
  }

  return {
    vehicleCode: vehicle.vehicleCode || '',
    routeCode: route.routeCode || '',
    driverName: driverAttendance.employeeName || ''
  };
};

const listTransportAssignments = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { vehicleCode: new RegExp(safeSearch, 'i') },
        { routeCode: new RegExp(safeSearch, 'i') },
        { driverEmployeeCode: new RegExp(safeSearch, 'i') },
        { driverName: new RegExp(safeSearch, 'i') },
        { notes: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = String(filters.status).trim().toLowerCase();
  }

  if (filters.assignmentDate) {
    const selectedDate = parseDateOnly(filters.assignmentDate);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    query.assignmentDate = { $gte: selectedDate, $lt: nextDate };
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    TransportAssignment.find(query)
      .sort({ assignmentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('vehicleId', 'vehicleCode plateNumber brand model status')
      .populate('routeId', 'routeCode routeName status')
      .lean(),
    TransportAssignment.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getTransportAssignmentById = async (id) => {
  ensureMongoId(id, 'transport assignment id');
  const assignment = await TransportAssignment.findById(id)
    .populate('vehicleId', 'vehicleCode plateNumber brand model status')
    .populate('routeId', 'routeCode routeName status')
    .lean();

  if (!assignment) {
    const error = new Error('Transport assignment not found');
    error.statusCode = 404;
    throw error;
  }

  return assignment;
};

const createTransportAssignment = async (payload) => {
  const next = normalizePayload(payload);
  const relationDetails = await ensureRelationsValid(next);

  return TransportAssignment.create({
    ...next,
    vehicleCode: relationDetails.vehicleCode,
    routeCode: relationDetails.routeCode,
    driverName: next.driverName || relationDetails.driverName
  });
};

const updateTransportAssignment = async (id, payload) => {
  ensureMongoId(id, 'transport assignment id');
  const assignment = await TransportAssignment.findById(id);
  if (!assignment) {
    const error = new Error('Transport assignment not found');
    error.statusCode = 404;
    throw error;
  }

  const next = normalizePayload({
    assignmentDate: assignment.assignmentDate,
    vehicleId: assignment.vehicleId,
    routeId: assignment.routeId,
    driverEmployeeCode: assignment.driverEmployeeCode,
    driverName: assignment.driverName,
    status: assignment.status,
    notes: assignment.notes,
    ...payload
  });

  const relationDetails = await ensureRelationsValid(next);

  Object.assign(assignment, {
    ...next,
    vehicleCode: relationDetails.vehicleCode,
    routeCode: relationDetails.routeCode,
    driverName: next.driverName || relationDetails.driverName
  });

  await assignment.save();
  return assignment.toObject();
};

const deleteTransportAssignment = async (id) => {
  ensureMongoId(id, 'transport assignment id');
  const assignment = await TransportAssignment.findByIdAndDelete(id);
  if (!assignment) {
    const error = new Error('Transport assignment not found');
    error.statusCode = 404;
    throw error;
  }
  return assignment;
};

module.exports = {
  listTransportAssignments,
  getTransportAssignmentById,
  createTransportAssignment,
  updateTransportAssignment,
  deleteTransportAssignment
};