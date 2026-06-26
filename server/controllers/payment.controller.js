const paymentService = require('../services/payment.service');

const listPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.listPayments(req.query);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.query);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const getMonthlySummary = async (req, res, next) => {
  try {
    const summary = await paymentService.getMonthlyPaymentSummary(req.query);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    await paymentService.deletePayment(req.params.id);
    res.json({ success: true, message: 'Payment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPayments,
  getMonthlySummary,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment
};
