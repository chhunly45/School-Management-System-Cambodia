const classService = require('../services/class.service');

const listClasses = async (req, res, next) => {
  try {
    const classes = await classService.listClasses(req.query);
    res.json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

const getClass = async (req, res, next) => {
  try {
    const item = await classService.getClassById(req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user?._id, updatedBy: req.user?._id };
    const item = await classService.createClass(payload);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user?._id };
    const item = await classService.updateClass(req.params.id, payload);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id);
    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass
};
