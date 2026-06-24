const transportService = require('../services/transport.service');

const listTransport = async (req, res, next) => {
  try {
    const records = await transportService.listTransport(req.query);
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getTransport = async (req, res, next) => {
  try {
    const record = await transportService.getTransportById(req.params.id);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const createTransport = async (req, res, next) => {
  try {
    const record = await transportService.createTransport(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const updateTransport = async (req, res, next) => {
  try {
    const record = await transportService.updateTransport(req.params.id, req.body);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const deleteTransport = async (req, res, next) => {
  try {
    await transportService.deleteTransport(req.params.id);
    res.json({ success: true, message: 'Transport record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTransport,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport
};
