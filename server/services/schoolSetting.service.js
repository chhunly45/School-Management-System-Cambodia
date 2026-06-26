const mongoose = require('mongoose');
const { SchoolSetting, AcademicYear } = require('../models');

const SINGLETON_KEY = 'school-settings';
const MAX_SUPPORTED_CURRENCIES = ['USD', 'KHR'];
const DEFAULT_EMPLOYEE_ROLES = ['teacher', 'driver', 'staff'];

const toTrimmedString = (value = '') => String(value || '').trim();

const normalizeSupportedCurrencies = (value) => {
  const list = Array.isArray(value) ? value : [value].filter(Boolean);
  const unique = [...new Set(list.map((item) => String(item).trim().toUpperCase()))];
  const filtered = unique.filter((item) => MAX_SUPPORTED_CURRENCIES.includes(item));
  return filtered.length > 0 ? filtered : ['USD', 'KHR'];
};

const normalizeEmployeeRoles = (value) => {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  const unique = [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
  return unique.length > 0 ? unique : DEFAULT_EMPLOYEE_ROLES;
};

const normalizeSettingsPayload = (payload = {}) => {
  const next = {
    singletonKey: SINGLETON_KEY,
    schoolName: toTrimmedString(payload.schoolName),
    logo: toTrimmedString(payload.logo),
    address: toTrimmedString(payload.address),
    phone: toTrimmedString(payload.phone),
    email: toTrimmedString(payload.email),
    defaultCurrency: MAX_SUPPORTED_CURRENCIES.includes(String(payload.defaultCurrency).toUpperCase()) ? String(payload.defaultCurrency).toUpperCase() : 'USD',
    supportedCurrencies: normalizeSupportedCurrencies(payload.supportedCurrencies),
    exchangeRateUsdToKhr: Number(payload.exchangeRateUsdToKhr || 0),
    receiptPrefix: toTrimmedString(payload.receiptPrefix) || 'RCPT',
    nextReceiptNumber: Math.max(Number(payload.nextReceiptNumber || 1), 1),
    monthlyDueDay: Math.min(Math.max(Number(payload.monthlyDueDay || 1), 1), 31),
    gracePeriodDays: Math.max(Number(payload.gracePeriodDays || 0), 0),
    employeeRoles: normalizeEmployeeRoles(payload.employeeRoles),
    footerText: toTrimmedString(payload.footerText),
    principalName: toTrimmedString(payload.principalName),
    qrCodeEnabled: payload.qrCodeEnabled === undefined ? true : String(payload.qrCodeEnabled).toLowerCase() !== 'false',
    currentAcademicYearId: payload.currentAcademicYearId || null,
    createdBy: payload.createdBy,
    updatedBy: payload.updatedBy
  };

  return next;
};

const ensureAcademicYearExists = async (academicYearId) => {
  if (!academicYearId) return;
  if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
    const error = new Error('Invalid currentAcademicYearId');
    error.statusCode = 400;
    throw error;
  }

  const exists = await AcademicYear.exists({ _id: academicYearId });
  if (!exists) {
    const error = new Error('Current academic year not found');
    error.statusCode = 404;
    throw error;
  }
};

const getDefaultSettings = () => ({
  singletonKey: SINGLETON_KEY,
  schoolName: '',
  logo: '',
  address: '',
  phone: '',
  email: '',
  currentAcademicYearId: null,
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD', 'KHR'],
  exchangeRateUsdToKhr: 0,
  receiptPrefix: 'RCPT',
  nextReceiptNumber: 1,
  monthlyDueDay: 1,
  gracePeriodDays: 0,
  employeeRoles: DEFAULT_EMPLOYEE_ROLES,
  footerText: '',
  principalName: '',
  qrCodeEnabled: true
});

const populateSettings = (query) => query.populate('currentAcademicYearId', 'code name status isCurrent');

const formatSettings = (settings) => {
  if (!settings) return null;
  const plain = typeof settings.toObject === 'function' ? settings.toObject() : { ...settings };
  return plain;
};

const getSchoolSettings = async () => {
  let settings = await populateSettings(SchoolSetting.findOne({ singletonKey: SINGLETON_KEY }));
  if (!settings) {
    return getDefaultSettings();
  }

  const plain = formatSettings(settings);
  return {
    ...getDefaultSettings(),
    ...plain,
    employeeRoles: normalizeEmployeeRoles(plain.employeeRoles)
  };
};

const createSchoolSettings = async (payload) => {
  const existing = await SchoolSetting.findOne({ singletonKey: SINGLETON_KEY });
  if (existing) {
    const error = new Error('School settings already exist');
    error.statusCode = 409;
    throw error;
  }

  await ensureAcademicYearExists(payload.currentAcademicYearId);
  const created = await SchoolSetting.create(normalizeSettingsPayload(payload));
  const populated = await populateSettings(SchoolSetting.findById(created._id));
  return formatSettings(populated);
};

const updateSchoolSettings = async (payload) => {
  await ensureAcademicYearExists(payload.currentAcademicYearId);

  const nextPayload = normalizeSettingsPayload(payload);
  const updated = await SchoolSetting.findOneAndUpdate(
    { singletonKey: SINGLETON_KEY },
    { $set: nextPayload, $setOnInsert: getDefaultSettings() },
    { new: true, upsert: true, runValidators: true }
  );

  const populated = await populateSettings(SchoolSetting.findById(updated._id));
  return formatSettings(populated);
};

const deleteSchoolSettings = async () => {
  const deleted = await SchoolSetting.findOneAndDelete({ singletonKey: SINGLETON_KEY });
  return deleted ? formatSettings(deleted) : null;
};

module.exports = {
  getSchoolSettings,
  createSchoolSettings,
  updateSchoolSettings,
  deleteSchoolSettings,
  getDefaultSettings
};