const express = require('express');
const schoolDashboardController = require('../controllers/schoolDashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get('/stats', adminOnly, schoolDashboardController.getSchoolStats);

module.exports = router;
