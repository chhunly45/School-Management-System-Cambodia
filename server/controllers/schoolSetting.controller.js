const schoolSettingService = require('../services/schoolSetting.service');

const getSchoolSettings = async (req, res, next) => {
  try {
    const settings = await schoolSettingService.getSchoolSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const createSchoolSettings = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user?._id, updatedBy: req.user?._id };
    const settings = await schoolSettingService.createSchoolSettings(payload);
    res.status(201).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateSchoolSettings = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user?._id };
    const settings = await schoolSettingService.updateSchoolSettings(payload);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const deleteSchoolSettings = async (req, res, next) => {
  try {
    await schoolSettingService.deleteSchoolSettings();
    res.json({ success: true, message: 'School settings deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchoolSettings,
  createSchoolSettings,
  updateSchoolSettings,
  deleteSchoolSettings
};