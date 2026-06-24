const uploadService = require('../services/upload.service');

const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) {
      const error = new Error('No images were uploaded');
      error.statusCode = 400;
      throw error;
    }

    const images = await uploadService.createImages(req.user.id, req.files, req.body.productId);
    console.info('Upload response:', images);
    res.status(201).json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    await uploadService.deleteImage(req.user, req.params.id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImages,
  deleteImage
};
