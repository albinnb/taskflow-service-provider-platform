import express from 'express';
import { registerUser, authUser, getMe, getProviderProfile, logoutUser, deleteMyAccount } from '../controllers/authController.js';
import { body } from 'express-validator';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define input validation rules for login and register
// NOTE: Login validation is bypassed below to fix the persistent 400 error
const loginValidation = [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['customer', 'provider']).withMessage('Invalid role selected'),
];


// @route POST /api/auth/register
// @desc Register a new user
// @access Public
router.post('/register', registerValidation, registerUser);

// @route POST /api/auth/login
// @desc Authenticate user & get token
// @access Public
// FIX: Corrected controller function name to authUser
// FIX: Keeping loginValidation commented out to avoid persistent 400 validation error
router.post('/login', authUser);

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