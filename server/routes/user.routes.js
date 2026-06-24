const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

/**
 * GET /api/users/profile/:id
 * Fetch public user profile by ID with seller statistics
 * No authentication required
 * 
 * Responses:
 * - 200: {success: true, data: {user object with stats}}
 * - 404: User not found
 */
router.get('/profile/:id', userController.getProfileById);

/**
 * PUT /api/users/profile
 * Update authenticated user's profile
 * Requires: Authorization header with Bearer token
 * 
 * Request body:
 * {
 *   avatar: string (data URL or URL),
 *   coverPhoto: string (data URL or URL),
 *   phone: string (Cambodian format: +855 12 345 678 or 012 345 6789),
 *   telegram: string (@username),
 *   displayName: string (optional),
 *   bio: string (optional),
 *   location: string (optional)
 * }
 * 
 * Responses:
 * - 200: {success: true, message: "Profile updated successfully", data: {updated user}}
 * - 400: Invalid phone format or validation error
 * - 401: Unauthorized
 * - 500: Server error
 */
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
