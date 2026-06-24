const config = require('../config');

const validateCloudinaryConfig = () => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    const missingVars = [];
    if (!cloudName) missingVars.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missingVars.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missingVars.push('CLOUDINARY_API_SECRET');

    console.error('Cloudinary configuration missing. Required environment variables:', missingVars.join(', '));

    const error = new Error('Cloudinary configuration missing');
    error.statusCode = 500;
    error.missingVars = missingVars;
    throw error;
  }
};

module.exports = { validateCloudinaryConfig };
