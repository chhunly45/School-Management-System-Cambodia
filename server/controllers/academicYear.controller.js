const academicYearService = require('../services/academicYear.service');

const listAcademicYears = async (req, res, next) => {
  try {
    const academicYears = await academicYearService.listAcademicYears(req.query);
    res.json({ success: true, data: academicYears });
  } catch (error) {
    next(error);
  }
};

const getAcademicYear = async (req, res, next) => {
  try {
    const academicYear = await academicYearService.getAcademicYearById(req.params.id);
    res.json({ success: true, data: academicYear });
  } catch (error) {
    next(error);
  }
};

const createAcademicYear = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user?._id, updatedBy: req.user?._id };
    const academicYear = await academicYearService.createAcademicYear(payload);
    res.status(201).json({ success: true, data: academicYear });
  } catch (error) {
    next(error);
  }
};

const updateAcademicYear = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user?._id };
    const academicYear = await academicYearService.updateAcademicYear(req.params.id, payload);
    res.json({ success: true, data: academicYear });
  } catch (error) {
    next(error);
  }
};

const deleteAcademicYear = async (req, res, next) => {
  try {
    await academicYearService.deleteAcademicYear(req.params.id);
    res.json({ success: true, message: 'Academic year deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
};
