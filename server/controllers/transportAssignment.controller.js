const transportAssignmentService = require('../services/transportAssignment.service');

const listTransportAssignments = async (req, res, next) => {
  try {
    const assignments = await transportAssignmentService.listTransportAssignments(req.query);
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

const getTransportAssignment = async (req, res, next) => {
  try {
    const assignment = await transportAssignmentService.getTransportAssignmentById(req.params.id);
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

const createTransportAssignment = async (req, res, next) => {
  try {
    const assignment = await transportAssignmentService.createTransportAssignment(req.body);
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

const updateTransportAssignment = async (req, res, next) => {
  try {
    const assignment = await transportAssignmentService.updateTransportAssignment(req.params.id, req.body);
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

const deleteTransportAssignment = async (req, res, next) => {
  try {
    await transportAssignmentService.deleteTransportAssignment(req.params.id);
    res.json({ success: true, message: 'Transport assignment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTransportAssignments,
  getTransportAssignment,
  createTransportAssignment,
  updateTransportAssignment,
  deleteTransportAssignment
};