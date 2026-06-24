const verificationService = require('../services/verification.service');

const requestVerification = async (req, res, next) => {
  try {
    const payload = {
      idCardImage: req.body.idCardImage,
      selfieImage: req.body.selfieImage,
      businessDocument: req.body.businessDocument,
      details: req.body.details
    };

    const verification = await verificationService.createSellerVerificationRequest(req.user.id, payload);
    res.status(201).json({ success: true, data: verification });
  } catch (error) {
    next(error);
  }
};

const getVerificationStatus = async (req, res, next) => {
  try {
    const status = await verificationService.getSellerVerificationStatus(req.user.id);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

const reviewVerification = async (req, res, next) => {
  try {
    const updates = {
      status: req.body.status
    };
    const verification = await verificationService.reviewSellerVerification(req.params.id, req.user.id, updates);
    res.json({ success: true, data: verification });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestVerification,
  getVerificationStatus,
  reviewVerification
};
