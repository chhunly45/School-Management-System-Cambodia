const { getProvinces: getProvincesData, getDistrictsByProvince: getDistrictsByProvinceData } = require('../config/provinces');

const getProvinces = async (req, res, next) => {
  try {
    const provinces = getProvincesData();
    res.json({ success: true, data: provinces });
  } catch (error) {
    next(error);
  }
};

const getDistricts = async (req, res, next) => {
  try {
    const { provinceId } = req.params;
    if (!provinceId) {
      const error = new Error('Province ID is required');
      error.statusCode = 400;
      throw error;
    }
    const districts = getDistrictsByProvinceData(provinceId);
    res.json({ success: true, data: districts });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProvinces,
  getDistricts
};
