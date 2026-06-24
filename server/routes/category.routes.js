const express = require('express');
const { body, param } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.get('/:id', param('id').isMongoId(), validate, categoryController.getCategory);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  body('name').notEmpty().withMessage('Category name is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  validate,
  categoryController.createCategory
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  param('id').isMongoId(),
  body('name').optional().notEmpty(),
  body('slug').optional().notEmpty(),
  validate,
  categoryController.updateCategory
);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), param('id').isMongoId(), validate, categoryController.deleteCategory);

module.exports = router;
