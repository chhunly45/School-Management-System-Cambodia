const academicRecordService = require('../services/academicRecord.service');

const listAcademicRecords = async (req, res, next) => {
  try {
    const records = await academicRecordService.listAcademicRecords(req.query);
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getAcademicRecord = async (req, res, next) => {
  try {
    const record = await academicRecordService.getAcademicRecordById(req.params.id);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const createAcademicRecord = async (req, res, next) => {
  try {
    const payload = { ...req.body, recordedBy: req.user?._id };
    const record = await academicRecordService.createAcademicRecord(payload);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const updateAcademicRecord = async (req, res, next) => {
  try {
    const record = await academicRecordService.updateAcademicRecord(req.params.id, req.body);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const deleteAcademicRecord = async (req, res, next) => {
  try {
    await academicRecordService.deleteAcademicRecord(req.params.id);
    res.json({ success: true, message: 'Academic record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAcademicRecords,
  getAcademicRecord,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord
};
