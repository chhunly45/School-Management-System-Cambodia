const User = require('../models/User');
const Product = require('../models/Product');
const Favorite = require('../models/Favorite');
const authService = require('../services/auth.service');

// Cambodian phone validation: +855 followed by 9 digits or 8-9 digits without +
const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Optional field
  const cambodianPhoneRegex = /^(\+855|0)(1|2|8|9|7|6|5|3)\d{7,8}$/;
  return cambodianPhoneRegex.test(phone.replace(/\s+/g, ''));
};

const getProfileById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -refreshTokens');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const products = await Product.find({ seller: user._id }).select('_id viewsCount').lean();
    const productIds = products.map((product) => product._id);
    const totalViews = products.reduce((sum, product) => sum + (product.viewsCount || 0), 0);
    const favoritesCount = productIds.length
      ? await Favorite.countDocuments({ product: { $in: productIds } })
      : 0;

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          totalProducts: products.length,
          totalViews,
          favoritesCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { avatar, coverPhoto, phone, telegram, phoneNumber, coverImage, ...otherUpdates } = req.body;

    // Validate phone number if provided
    if (phone || phoneNumber) {
      const phoneToValidate = phone || phoneNumber;
      if (!validatePhoneNumber(phoneToValidate)) {
        const error = new Error('Invalid phone number. Please use a valid Cambodian phone number (e.g., +855 12 345 678 or 0123456789)');
        error.statusCode = 400;
        throw error;
      }
    }

    // Map field names to model schema
    const updates = {
      ...otherUpdates,
      ...(avatar && { avatar }),
      ...(coverPhoto && { coverImage: coverPhoto }),
      ...(coverImage && { coverImage }),
      ...(phone && { phoneNumber: phone }),
      ...(phoneNumber && { phoneNumber }),
      ...(telegram && { telegram })
    };

    // Call service to update profile (handles image uploads to Cloudinary)
    const user = await authService.updateProfile(req.user.id, updates);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfileById,
  updateProfile
};
