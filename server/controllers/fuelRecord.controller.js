const fuelRecordService = require('../services/fuelRecord.service');

const listFuelRecords = async (req, res, next) => {
  try {
    const records = await fuelRecordService.listFuelRecords(req.query);
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getFuelRecord = async (req, res, next) => {
  try {
    const record = await fuelRecordService.getFuelRecordById(req.params.id);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const createFuelRecord = async (req, res, next) => {
  try {
    const record = await fuelRecordService.createFuelRecord(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const updateFuelRecord = async (req, res, next) => {
  try {
    const record = await fuelRecordService.updateFuelRecord(req.params.id, req.body);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const deleteFuelRecord = async (req, res, next) => {
  try {
    await fuelRecordService.deleteFuelRecord(req.params.id);
    res.json({ success: true, message: 'Fuel record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFuelRecords,
  getFuelRecord,
  createFuelRecord,
  updateFuelRecord,
  deleteFuelRecord
};