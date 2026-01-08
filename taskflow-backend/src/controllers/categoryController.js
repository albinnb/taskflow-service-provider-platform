import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  // Find all categories and sort them by name
  const categories = await Category.find().sort({ name: 'asc' });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private/Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, image } = req.body;

  if (!name || !slug) {
    res.status(400);
    throw new Error('Name and Slug are required');
  }

  const categoryExists = await Category.findOne({ slug });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await Category.create({ name, slug, image });

  res.status(201).json({
    success: true,
    data: category,
  });
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category
 * @access  Private/Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Optional: Check if any services use this category before deleting?
  // For now, simple delete as requested.

  await category.deleteOne();

  res.status(200).json({ success: true, message: 'Category removed' });
});