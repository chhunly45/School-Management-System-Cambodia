const gradeService = require('../services/grade.service');

const listGrades = async (req, res, next) => {
  try {
    const grades = await gradeService.listGrades(req.query);
    res.json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
};

const getGrade = async (req, res, next) => {
  try {
    const grade = await gradeService.getGradeById(req.params.id);
    res.json({ success: true, data: grade });
  } catch (error) {
    next(error);
  }
};

const createGrade = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user?._id, updatedBy: req.user?._id };
    const grade = await gradeService.createGrade(payload);
    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    next(error);
  }
};

const updateGrade = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user?._id };
    const grade = await gradeService.updateGrade(req.params.id, payload);
    res.json({ success: true, data: grade });
  } catch (error) {
    next(error);
  }
};

const deleteGrade = async (req, res, next) => {
  try {
    await gradeService.deleteGrade(req.params.id);
    res.json({ success: true, message: 'Grade deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade
};
