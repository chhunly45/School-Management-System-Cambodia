const mongoose = require('mongoose');
const { Route: RouteModel } = require('../models');

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

const normalizePickupAreas = (value) => {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return list.map((item) => String(item || '').trim()).filter(Boolean);
};

const normalizePayload = (payload = {}) => ({
  routeCode: normalizeCode(payload.routeCode),
  routeName: String(payload.routeName || '').trim(),
  pickupAreas: normalizePickupAreas(payload.pickupAreas),
  estimatedDistanceKm: Number(payload.estimatedDistanceKm || 0),
  estimatedDurationMinutes: Number(payload.estimatedDurationMinutes || 0),
  status: String(payload.status || 'active').trim().toLowerCase(),
  notes: String(payload.notes || '').trim()
});

const listRoutes = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { routeCode: new RegExp(safeSearch, 'i') },
        { routeName: new RegExp(safeSearch, 'i') },
        { pickupAreas: new RegExp(safeSearch, 'i') },
        { notes: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = String(filters.status).trim().toLowerCase();
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    RouteModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    RouteModel.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getRouteById = async (id) => {
  ensureMongoId(id, 'route id');
  const route = await RouteModel.findById(id).lean();
  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }
  return route;
};

const ensureUniqueRouteCode = async (routeCode, excludingId) => {
  const query = { routeCode };
  if (excludingId) query._id = { $ne: excludingId };
  const existing = await RouteModel.findOne(query);
  if (existing) {
    const error = new Error('Route code already exists');
    error.statusCode = 409;
    throw error;
  }
};

const createRoute = async (payload) => {
  const next = normalizePayload(payload);
  await ensureUniqueRouteCode(next.routeCode);
  return RouteModel.create(next);
};

const updateRoute = async (id, payload) => {
  ensureMongoId(id, 'route id');
  const route = await RouteModel.findById(id);
  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }

  const next = normalizePayload({ ...route.toObject(), ...payload });
  await ensureUniqueRouteCode(next.routeCode, id);

  Object.assign(route, next);
  await route.save();
  return route.toObject();
};

const deleteRoute = async (id) => {
  ensureMongoId(id, 'route id');
  const route = await RouteModel.findByIdAndDelete(id);
  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }
  return route;
};

module.exports = {
  listRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
};