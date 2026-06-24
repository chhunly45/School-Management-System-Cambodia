const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

router.get('/provinces', locationController.getProvinces);
router.get('/provinces/:provinceId/districts', locationController.getDistricts);

module.exports = router;
