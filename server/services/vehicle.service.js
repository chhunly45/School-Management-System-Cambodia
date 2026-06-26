const mongoose = require('mongoose');
const { Vehicle } = require('../models');

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const normalizeCode = (value = '') => String(value || '').trim().toUpperCase();

const normalizePlate = (value = '') => String(value || '').trim().toUpperCase();

const normalizePayload = (payload = {}) => ({
  vehicleCode: normalizeCode(payload.vehicleCode),
  plateNumber: normalizePlate(payload.plateNumber),
  brand: String(payload.brand || '').trim(),
  model: String(payload.model || '').trim(),
  year: Number(payload.year || 2000),
  color: String(payload.color || '').trim(),
  seatCapacity: Number(payload.seatCapacity || 1),
  fuelType: String(payload.fuelType || 'gasoline').trim().toLowerCase(),
  status: String(payload.status || 'active').trim().toLowerCase(),
  notes: String(payload.notes || '').trim()
});

const listVehicles = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { vehicleCode: new RegExp(safeSearch, 'i') },
        { plateNumber: new RegExp(safeSearch, 'i') },
        { brand: new RegExp(safeSearch, 'i') },
        { model: new RegExp(safeSearch, 'i') },
        { notes: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.fuelType) {
    query.fuelType = String(filters.fuelType).trim().toLowerCase();
  }

  if (filters.status) {
    query.status = String(filters.status).trim().toLowerCase();
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Vehicle.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getVehicleById = async (id) => {
  ensureMongoId(id, 'vehicle id');
  const vehicle = await Vehicle.findById(id).lean();
  if (!vehicle) {
    const error = new Error('Vehicle not found');
    error.statusCode = 404;
    throw error;
  }
  return vehicle;
};

const ensureUniqueVehicleCode = async (vehicleCode, excludingId) => {
  const query = { vehicleCode };
  if (excludingId) query._id = { $ne: excludingId };
  const existing = await Vehicle.findOne(query);
  if (existing) {
    const error = new Error('Vehicle code already exists');
    error.statusCode = 409;
    throw error;
  }
};

const ensureUniquePlateNumber = async (plateNumber, excludingId) => {
  const query = { plateNumber };
  if (excludingId) query._id = { $ne: excludingId };
  const existing = await Vehicle.findOne(query);
  if (existing) {
    const error = new Error('Plate number already exists');
    error.statusCode = 409;
    throw error;
  }
};

const createVehicle = async (payload) => {
  const next = normalizePayload(payload);
  await Promise.all([
    ensureUniqueVehicleCode(next.vehicleCode),
    ensureUniquePlateNumber(next.plateNumber)
  ]);

  return Vehicle.create(next);
};

const updateVehicle = async (id, payload) => {
  ensureMongoId(id, 'vehicle id');
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    const error = new Error('Vehicle not found');
    error.statusCode = 404;
    throw error;
  }

  const next = normalizePayload({ ...vehicle.toObject(), ...payload });

  await Promise.all([
    ensureUniqueVehicleCode(next.vehicleCode, id),
    ensureUniquePlateNumber(next.plateNumber, id)
  ]);

  Object.assign(vehicle, next);
  await vehicle.save();
  return vehicle.toObject();
};

const deleteVehicle = async (id) => {
  ensureMongoId(id, 'vehicle id');
  const vehicle = await Vehicle.findByIdAndDelete(id);
  if (!vehicle) {
    const error = new Error('Vehicle not found');
    error.statusCode = 404;
    throw error;
  }
  return vehicle;
};

module.exports = {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};