const errorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ success: false, message: 'Restricted form submission.' });
  }

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Cloudinary configuration errors
  if (err.message === 'Cloudinary configuration missing') {
    message = 'Cloudinary configuration missing';
    details = {
      missingVars: err.missingVars || [],
      info: 'Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables'
    };
    console.error('[Cloudinary Config Error]', message, details);
  } else {
    console.error('[Error]', message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details
  });
};

module.exports = errorHandler;
