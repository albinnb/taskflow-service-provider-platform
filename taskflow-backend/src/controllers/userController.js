import { validationResult } from 'express-validator';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// ------------------------------------------------------------------
// NEW CONTROLLER: Update User Address (for self-update)
// @route PUT /api/users/profile/address
// @desc Update the logged-in user's address
// @access Private (All authenticated users)
// ------------------------------------------------------------------
const updateAddress = asyncHandler(async (req, res) => {
    // 1. Check for validation errors from the userRoutes.js middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    // 2. Get the logged-in user's ID from the 'protect' middleware
    const userId = req.user._id;

    // 3. Find the user and update the nested address fields
    const updatedUser = await User.findById(userId);

    if (updatedUser) {
        // Apply the updates to the nested address object
        updatedUser.address.house_name = req.body.house_name;
        updatedUser.address.street_address = req.body.street_address;
        updatedUser.address.city_district = req.body.city_district;
        updatedUser.address.state = req.body.state;
        updatedUser.address.pincode = req.body.pincode;

        // Save the updated user document
        await updatedUser.save();

        // 4. Send success response with the new completion status
        // We can use the isAddressComplete method we added to the model!
        const isProfileComplete = updatedUser.isAddressComplete();
        
        res.status(200).json({
            success: true,
            message: 'Address updated successfully.',
            isProfileComplete: isProfileComplete,
            data: {
                // Return minimal, non-sensitive data
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                address: updatedUser.address
            }
        });

    } else {
        // Should not happen if 'protect' middleware works, but good practice to check
        res.status(404);
        throw new Error('User not found');
    }
});


/**
 * @route GET /api/users
 * @desc Get all users (Admin only)
 * @access Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    // Use .select('-passwordHash') to ensure passwords are never returned
    const users = await User.find({}).select('-passwordHash');
    res.status(200).json({ success: true, count: users.length, data: users });
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID (Admin only)
 * @access Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (user) {
        res.status(200).json({ success: true, data: user });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user profile (Admin only)
 * @access Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    const user = await User.findById(req.params.id);

    if (user) {
        // Prevent updating password via this route (should use a dedicated /change-password route)
        if (req.body.password) {
            res.status(400);
            throw new Error('Password cannot be updated via this route.');
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.phone = req.body.phone || user.phone;
        // This line is for Admin updates, allowing them to override the whole address object.
        user.address = req.body.address || user.address; 
        // Location update logic could be complex; kept simple for admin CRUD

        const updatedUser = await user.save();
        res.status(200).json({
            success: true,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (Admin only)
 * @access Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Note: In a production app, you'd also need to delete associated Provider,
        // Services, Bookings, and Reviews before deleting the User.
        await User.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export { getUsers, getUserById, updateUser, deleteUser, updateAddress };
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// MODIFICATION: Added updateAddress to the export list to fix the error.