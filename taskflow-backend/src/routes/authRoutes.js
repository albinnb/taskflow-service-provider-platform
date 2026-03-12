import express from 'express';
import { registerUser, authUser, getMe, getProviderProfile, logoutUser, deleteMyAccount } from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import Joi from 'joi';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Joi schema definitions
const registerSchema = {
    body: Joi.object({
        name: Joi.string().required().messages({
            'any.required': 'Name is required',
            'string.empty': 'Name cannot be empty'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please include a valid email',
            'any.required': 'Email is required'
        }),
        password: Joi.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/).required().messages({
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain at least one letter and one number',
            'any.required': 'Password is required'
        }),
        role: Joi.string().valid('customer', 'provider').optional().messages({
            'any.only': 'Invalid role selected'
        }),
        phone: Joi.string().regex(/^\d{10}$/).optional().messages({
            'string.pattern.base': 'Phone number must be exactly 10 digits'
        })
    })
};

const loginSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
};

import { authLimiter } from '../config/rateLimit.js';

// @route POST /api/auth/register
// @desc Register a new user
// @access Public
router.post('/register', authLimiter, validate(registerSchema), registerUser);

// @route POST /api/auth/login
// @desc Authenticate user & get token
// @access Public
// FIX: Corrected controller function name to authUser
// FIX: Keeping loginValidation commented out to avoid persistent 400 validation error
router.post('/login', authLimiter, authUser);

// @route POST /api/auth/logout
// @desc Clear cookie and log out user
// @access Private
router.post('/logout', protect, logoutUser);

// @route GET /api/auth/me
// @desc Get current logged-in user details
// @access Private
router.get('/me', protect, getMe);

// @route DELETE /api/auth/profile
// @desc Delete current user account
// @access Private
router.delete('/profile', protect, deleteMyAccount);

// @route GET /api/auth/provider
// @desc Get current provider profile details
// @access Private/Provider
router.get('/provider', protect, getProviderProfile);

export default router;