const subjectService = require('../services/subject.service');

const listSubjects = async (req, res, next) => {
  try {
    const subjects = await subjectService.listSubjects(req.query);
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

const getSubject = async (req, res, next) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id);
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user?._id, updatedBy: req.user?._id };
    const subject = await subjectService.createSubject(payload);
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user?._id };
    const subject = await subjectService.updateSubject(req.params.id, payload);
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    await subjectService.deleteSubject(req.params.id);
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
};