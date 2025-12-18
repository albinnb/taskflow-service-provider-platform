import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  // Find all categories and sort them by name
  const categories = await Category.find().sort({ name: 'asc' });
  
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});