const teacherService = require('../services/teacher.service');

const listTeachers = async (req, res, next) => {
  try {
    const teachers = await teacherService.listTeachers(req.query);
    res.json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

const getTeacher = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherById(req.params.id, req.query);
    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

const createTeacher = async (req, res, next) => {
  try {
    const teacher = await teacherService.createTeacher(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await teacherService.updateTeacher(req.params.id, req.body);
    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    await teacherService.deleteTeacher(req.params.id);
    res.json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
