const mongoose = require('mongoose');
const {
  FuelRecord,
  Vehicle,
  TransportAssignment,
  SchoolSetting
} = require('../models');

const MAX_PER_PAGE = 100;
const SETTINGS_SINGLETON_KEY = 'school-settings';

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

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

const getAllowedCurrencies = async () => {
  const settings = await SchoolSetting.findOne({ singletonKey: SETTINGS_SINGLETON_KEY })
    .select('supportedCurrencies defaultCurrency')
    .lean();

  const list = Array.isArray(settings?.supportedCurrencies)
    ? settings.supportedCurrencies
    : [settings?.defaultCurrency || 'USD', 'KHR'];

  const normalized = [...new Set(list.map((item) => String(item || '').trim().toUpperCase()).filter(Boolean))];
  return normalized.length > 0 ? normalized : ['USD', 'KHR'];
};

const normalizePayload = (payload = {}) => ({
  vehicleId: String(payload.vehicleId || '').trim(),
  transportAssignmentId: payload.transportAssignmentId ? String(payload.transportAssignmentId).trim() : '',
  assignmentDate: parseDateOnly(payload.assignmentDate),
  odometer: Number(payload.odometer),
  fuelType: String(payload.fuelType || '').trim().toLowerCase(),
  liters: Number(payload.liters),
  pricePerLiter: Number(payload.pricePerLiter),
  currency: String(payload.currency || '').trim().toUpperCase(),
  totalCost: Number(payload.totalCost),
  fuelStation: String(payload.fuelStation || '').trim(),
  receiptNumber: String(payload.receiptNumber || '').trim(),
  notes: String(payload.notes || '').trim()
});

const ensureRelationsAndRules = async (next, options = {}) => {
  ensureMongoId(next.vehicleId, 'vehicleId');
  if (next.transportAssignmentId) {
    ensureMongoId(next.transportAssignmentId, 'transportAssignmentId');
  }

  if (!Number.isFinite(next.odometer) || next.odometer < 0) {
    const error = new Error('Odometer must be zero or greater');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(next.liters) || next.liters <= 0) {
    const error = new Error('Liters must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(next.pricePerLiter) || next.pricePerLiter < 0) {
    const error = new Error('Price per liter must be zero or greater');
    error.statusCode = 400;
    throw error;
  }

  const [vehicle, assignment, allowedCurrencies] = await Promise.all([
    Vehicle.findById(next.vehicleId).select('vehicleCode fuelType').lean(),
    next.transportAssignmentId
      ? TransportAssignment.findById(next.transportAssignmentId).select('vehicleId').lean()
      : Promise.resolve(null),
    getAllowedCurrencies()
  ]);

  if (!vehicle) {
    const error = new Error('Vehicle not found');
    error.statusCode = 404;
    throw error;
  }

  if (next.transportAssignmentId && !assignment) {
    const error = new Error('Transport assignment not found');
    error.statusCode = 404;
    throw error;
  }

  if (assignment && String(assignment.vehicleId) !== String(next.vehicleId)) {
    const error = new Error('Transport assignment must belong to the selected vehicle');
    error.statusCode = 400;
    throw error;
  }

  if (!allowedCurrencies.includes(next.currency)) {
    const error = new Error(`Currency must be one of: ${allowedCurrencies.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const computedTotalCost = toMoney(next.liters * next.pricePerLiter);
  if (Number.isFinite(next.totalCost)) {
    const provided = toMoney(next.totalCost);
    if (Math.abs(provided - computedTotalCost) > 0.01) {
      const error = new Error('Total Cost must equal Liters × Price Per Liter');
      error.statusCode = 400;
      throw error;
    }
  }

  const odometerQuery = { vehicleId: next.vehicleId };
  if (options.excludeId) {
    odometerQuery._id = { $ne: options.excludeId };
  }
  const highestOdometerRecord = await FuelRecord.findOne(odometerQuery)
    .sort({ odometer: -1, assignmentDate: -1, createdAt: -1 })
    .select('odometer')
    .lean();

  if (highestOdometerRecord && next.odometer < Number(highestOdometerRecord.odometer || 0)) {
    const error = new Error('Odometer cannot decrease for the same vehicle');
    error.statusCode = 400;
    throw error;
  }

  return {
    vehicleCode: vehicle.vehicleCode || '',
    totalCost: computedTotalCost,
    transportAssignmentId: next.transportAssignmentId || null
  };
};

const listFuelRecords = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { vehicleCode: new RegExp(safeSearch, 'i') },
        { fuelStation: new RegExp(safeSearch, 'i') },
        { receiptNumber: new RegExp(safeSearch, 'i') },
        { notes: new RegExp(safeSearch, 'i') },
        { currency: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.vehicleId) {
    ensureMongoId(filters.vehicleId, 'vehicleId filter');
    query.vehicleId = filters.vehicleId;
  }

  if (filters.fuelType) {
    query.fuelType = String(filters.fuelType).trim().toLowerCase();
  }

  if (filters.currency) {
    query.currency = String(filters.currency).trim().toUpperCase();
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
    FuelRecord.find(query)
      .sort({ assignmentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('vehicleId', 'vehicleCode plateNumber brand model fuelType status')
      .populate('transportAssignmentId', 'assignmentDate vehicleCode routeCode driverEmployeeCode driverName status')
      .lean(),
    FuelRecord.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getFuelRecordById = async (id) => {
  ensureMongoId(id, 'fuel record id');
  const record = await FuelRecord.findById(id)
    .populate('vehicleId', 'vehicleCode plateNumber brand model fuelType status')
    .populate('transportAssignmentId', 'assignmentDate vehicleCode routeCode driverEmployeeCode driverName status')
    .lean();

  if (!record) {
    const error = new Error('Fuel record not found');
    error.statusCode = 404;
    throw error;
  }

  return record;
};

const createFuelRecord = async (payload) => {
  const next = normalizePayload(payload);
  const details = await ensureRelationsAndRules(next);

  return FuelRecord.create({
    ...next,
    vehicleCode: details.vehicleCode,
    totalCost: details.totalCost,
    transportAssignmentId: details.transportAssignmentId
  });
};

const updateFuelRecord = async (id, payload) => {
  ensureMongoId(id, 'fuel record id');
  const record = await FuelRecord.findById(id);
  if (!record) {
    const error = new Error('Fuel record not found');
    error.statusCode = 404;
    throw error;
  }

  const next = normalizePayload({
    vehicleId: record.vehicleId,
    transportAssignmentId: record.transportAssignmentId,
    assignmentDate: record.assignmentDate,
    odometer: record.odometer,
    fuelType: record.fuelType,
    liters: record.liters,
    pricePerLiter: record.pricePerLiter,
    currency: record.currency,
    totalCost: record.totalCost,
    fuelStation: record.fuelStation,
    receiptNumber: record.receiptNumber,
    notes: record.notes,
    ...payload
  });

  const details = await ensureRelationsAndRules(next, { excludeId: id });

  Object.assign(record, {
    ...next,
    vehicleCode: details.vehicleCode,
    totalCost: details.totalCost,
    transportAssignmentId: details.transportAssignmentId
  });

  await record.save();
  return record.toObject();
};

const deleteFuelRecord = async (id) => {
  ensureMongoId(id, 'fuel record id');
  const record = await FuelRecord.findByIdAndDelete(id);
  if (!record) {
    const error = new Error('Fuel record not found');
    error.statusCode = 404;
    throw error;
  }
  return record;
};

module.exports = {
  listFuelRecords,
  getFuelRecordById,
  createFuelRecord,
  updateFuelRecord,
  deleteFuelRecord
};