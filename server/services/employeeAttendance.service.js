const mongoose = require('mongoose');
const { EmployeeAttendance, SchoolSetting } = require('../models');

const SCHOOL_SETTINGS_KEY = 'school-settings';
const DEFAULT_EMPLOYEE_ROLES = ['teacher', 'driver', 'staff'];

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const normalizeToDayStart = (value) => {
  const input = new Date(value);
  if (Number.isNaN(input.getTime())) {
    const error = new Error('Invalid date');
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(input);
  start.setHours(0, 0, 0, 0);
  return start;
};

const nextDay = (dayStart) => {
  const end = new Date(dayStart);
  end.setDate(end.getDate() + 1);
  return end;
};

const normalizeRole = (value = '') => String(value || 'staff').trim().toLowerCase();

const normalizeTimeText = (value = '') => String(value || '').trim();

const validateTimeFormat = (value, fieldName) => {
  if (!value) return;
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    const error = new Error(`${fieldName} must use HH:mm format`);
    error.statusCode = 400;
    throw error;
  }
};

const getConfiguredEmployeeRoles = async () => {
  const settings = await SchoolSetting.findOne({ singletonKey: SCHOOL_SETTINGS_KEY }).select('employeeRoles').lean();
  const roles = Array.isArray(settings?.employeeRoles) ? settings.employeeRoles : [];
  const normalized = [...new Set(roles.map((item) => normalizeRole(item)).filter(Boolean))];
  return normalized.length ? normalized : DEFAULT_EMPLOYEE_ROLES;
};

const ensureEmployeeRoleAllowed = async (employeeType) => {
  const role = normalizeRole(employeeType);
  const roles = await getConfiguredEmployeeRoles();
  if (!roles.includes(role)) {
    const error = new Error(`Employee role '${role}' is not allowed by school settings`);
    error.statusCode = 400;
    throw error;
  }
  return role;
};

const normalizeScheduleFields = (payload = {}) => {
  const scheduleLabel = normalizeTimeText(payload.scheduleLabel);
  const workStartTime = normalizeTimeText(payload.workStartTime);
  const workEndTime = normalizeTimeText(payload.workEndTime);

  validateTimeFormat(workStartTime, 'workStartTime');
  validateTimeFormat(workEndTime, 'workEndTime');

  return { scheduleLabel, workStartTime, workEndTime };
};

const listEmployeeAttendance = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { employeeCode: new RegExp(safeSearch, 'i') },
        { employeeName: new RegExp(safeSearch, 'i') },
        { department: new RegExp(safeSearch, 'i') },
        { remarks: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.date) {
    const selectedDate = normalizeToDayStart(filters.date);
    query.date = { $gte: selectedDate, $lt: nextDay(selectedDate) };
  }

  if (filters.employeeType) {
    query.employeeType = String(filters.employeeType).trim();
  }

  if (filters.status) {
    query.status = String(filters.status).trim();
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    EmployeeAttendance.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    EmployeeAttendance.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getEmployeeAttendanceById = async (id) => {
  ensureMongoId(id, 'employee attendance id');

  const attendance = await EmployeeAttendance.findById(id).lean();
  if (!attendance) {
    const error = new Error('Employee attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  return attendance;
};

const createEmployeeAttendance = async (payload) => {
  const normalizedDate = normalizeToDayStart(payload.date);
  const employeeCode = String(payload.employeeCode).trim();
  const employeeType = await ensureEmployeeRoleAllowed(payload.employeeType);
  const scheduleFields = normalizeScheduleFields(payload);

  const existing = await EmployeeAttendance.findOne({ employeeCode, date: normalizedDate });
  if (existing) {
    const error = new Error('Employee attendance record already exists for this employee and date');
    error.statusCode = 409;
    throw error;
  }

  const attendance = await EmployeeAttendance.create({
    ...payload,
    employeeCode,
    employeeType,
    ...scheduleFields,
    date: normalizedDate
  });

  return attendance;
};

const updateEmployeeAttendance = async (id, payload) => {
  ensureMongoId(id, 'employee attendance id');

  const attendance = await EmployeeAttendance.findById(id);
  if (!attendance) {
    const error = new Error('Employee attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  const nextDate = payload.date ? normalizeToDayStart(payload.date) : normalizeToDayStart(attendance.date);
  const nextEmployeeCode = payload.employeeCode ? String(payload.employeeCode).trim() : attendance.employeeCode;
  const nextEmployeeType = payload.employeeType !== undefined
    ? await ensureEmployeeRoleAllowed(payload.employeeType)
    : normalizeRole(attendance.employeeType);
  const scheduleFields = normalizeScheduleFields({
    scheduleLabel: payload.scheduleLabel !== undefined ? payload.scheduleLabel : attendance.scheduleLabel,
    workStartTime: payload.workStartTime !== undefined ? payload.workStartTime : attendance.workStartTime,
    workEndTime: payload.workEndTime !== undefined ? payload.workEndTime : attendance.workEndTime
  });

  const existing = await EmployeeAttendance.findOne({
    employeeCode: nextEmployeeCode,
    date: nextDate,
    _id: { $ne: id }
  });

  if (existing) {
    const error = new Error('Employee attendance record already exists for this employee and date');
    error.statusCode = 409;
    throw error;
  }

  Object.assign(attendance, {
    ...payload,
    employeeCode: nextEmployeeCode,
    employeeType: nextEmployeeType,
    ...scheduleFields,
    date: nextDate
  });

  await attendance.save();
  return attendance.toObject();
};

const deleteEmployeeAttendance = async (id) => {
  ensureMongoId(id, 'employee attendance id');

  const attendance = await EmployeeAttendance.findByIdAndDelete(id);
  if (!attendance) {
    const error = new Error('Employee attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  return attendance;
};

module.exports = {
  listEmployeeAttendance,
  getEmployeeAttendanceById,
  createEmployeeAttendance,
  updateEmployeeAttendance,
  deleteEmployeeAttendance
};