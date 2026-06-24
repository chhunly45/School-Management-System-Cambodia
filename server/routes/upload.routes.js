const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const uploadController = require('../controllers/upload.controller');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  upload.array('images', 6),
  body('productId').optional().isMongoId().withMessage('Product ID must be a valid id'),
  validate,
  uploadController.uploadImages
);

router.delete(
  '/:id',
  authMiddleware,
  param('id').isMongoId().withMessage('Image ID is required'),
  validate,
  uploadController.deleteImage
);

module.exports = router;
