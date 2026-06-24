const certificateService = require('../services/certificate.service');

const listCertificates = async (req, res, next) => {
  try {
    const certificates = await certificateService.listCertificates(req.query);
    res.json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};

const getCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);
    res.json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

const createCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateService.createCertificate(req.body);
    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

const updateCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateService.updateCertificate(req.params.id, req.body);
    res.json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

const deleteCertificate = async (req, res, next) => {
  try {
    await certificateService.deleteCertificate(req.params.id);
    res.json({ success: true, message: 'Certificate deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate
};
