const { Image, Product } = require('../models');
const cloudinary = require('../config/cloudinary');
const { validateCloudinaryConfig } = require('../utils/cloudinary-validator');

const uploadStream = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', {
          message: error.message,
          code: error.code,
          statusCode: error.status,
          http_code: error.http_code
        });
        return reject(error);
      }
      resolve(result);
    });
    stream.end(fileBuffer);
  });
};

const createImages = async (userId, files, productId) => {
  try {
    validateCloudinaryConfig();
  } catch (configError) {
    console.error('Upload failed: Cloudinary not configured');
    throw configError;
  }

  if (productId) {
    await Product.findById(productId).orFail();
  }

  let shouldSetCover = false;
  if (productId) {
    const product = await Product.findById(productId).select('coverImage').lean();
    shouldSetCover = !product?.coverImage;
  }

  const createdImages = [];

  for (const file of files) {
    try {
      const result = await uploadStream(file.buffer, {
        folder: `marketplace/${productId || 'tmp'}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      const image = await Image.create({
        product: productId || null,
        uploadedBy: userId,
        url: result.secure_url || result.url,
        secureUrl: result.secure_url || result.url,
        publicId: result.public_id,
        altText: file.originalname,
        sortOrder: 0
      });

      if (productId) {
        const update = { $push: { images: image._id } };
        if (shouldSetCover) {
          update.$set = { coverImage: image._id };
          shouldSetCover = false;
        }
        await Product.findByIdAndUpdate(productId, update);
      }

      createdImages.push(image);
    } catch (uploadError) {
      console.error('Failed to upload single image:', {
        file: file.originalname,
        error: uploadError.message
      });
      throw uploadError;
    }
  }

  return createdImages;
};

const deleteImage = async (user, imageId) => {
  const image = await Image.findById(imageId);
  if (!image) {
    const error = new Error('Image not found');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = image.uploadedBy.toString() === user.id.toString();
  const isAdmin = ['admin', 'moderator'].includes(user.role);
  if (!isOwner && !isAdmin) {
    const error = new Error('Permission denied');
    error.statusCode = 403;
    throw error;
  }

  if (image.product) {
    const imageCount = await Image.countDocuments({ product: image.product });
    if (imageCount <= 1) {
      const error = new Error('At least one product image is required');
      error.statusCode = 400;
      throw error;
    }
  }

  if (image.publicId) {
    await cloudinary.uploader.destroy(image.publicId, { resource_type: 'image' });
  }

  if (image.product) {
    const product = await Product.findById(image.product).select('coverImage').lean();
    const update = { $pull: { images: image._id } };
    if (product?.coverImage?.toString() === image._id.toString()) {
      const replacementImage = await Image.findOne({ product: image.product, _id: { $ne: image._id } }).sort({ sortOrder: 1 }).lean();
      update.$set = { coverImage: replacementImage ? replacementImage._id : null };
    }
    await Product.findByIdAndUpdate(image.product, update);
  }

  await image.deleteOne();
};

module.exports = {
  createImages,
  deleteImage
};
