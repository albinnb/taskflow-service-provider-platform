import express from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.route('/').get(getCategories);

// Admin only routes
router.route('/').post(protect, authorize('admin'), createCategory);
router.route('/:id').delete(protect, authorize('admin'), deleteCategory);

export default router;