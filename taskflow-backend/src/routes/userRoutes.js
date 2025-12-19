import express from 'express';
import { body } from 'express-validator';
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    // We will add the new controller function here soon
    updateAddress,
    updateUserProfile,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ------------------------------------------------------------------
// PROTECTED ROUTES (Accessible by all logged-in users: Customer/Provider/Admin)
// ------------------------------------------------------------------

router.route('/profile/address')
    .put(
        protect, // Only requires a user to be logged in
        [
            // Validation for Indian Address Fields
            body('house_name').notEmpty().withMessage('House/Flat name is required'),
            body('street_address').notEmpty().withMessage('Street/Locality is required'),
            body('city_district').notEmpty().withMessage('City/District is required'),
            body('state').notEmpty().withMessage('State is required'),
            body('pincode')
                .isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits')
                .isNumeric().withMessage('Pincode must be numeric'),
        ],
        updateAddress // The new controller function we'll create
    );


router.route('/profile')
    .put(protect, updateUserProfile);

// ------------------------------------------------------------------
// ADMIN ONLY Routes (All routes below this line require 'admin' role)
// ------------------------------------------------------------------
router.use(protect, authorize('admin'));

// GET /api/users - Get all users (Admin only)
router.get('/', getUsers);

// GET /api/users/:id - Get, Update, Delete a specific user (Admin only)
router
    .route('/:id')
    .get(getUserById)
    .put(
        [
            body('name').optional().notEmpty().withMessage('Name is required'),
            body('email').optional().isEmail().withMessage('Valid email is required'),
            body('role').optional().isIn(['customer', 'provider', 'admin']).withMessage('Invalid role'),
        ],
        updateUser
    )
    .delete(deleteUser);

export default router;