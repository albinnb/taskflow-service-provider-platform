import { validationResult } from 'express-validator';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

/**
 * @route GET /api/reviews/provider/:providerId
 * @desc Get all reviews for a specific provider
 * @access Public
 */
const getReviewsByProvider = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.providerId)) {
    res.status(400);
    throw new Error('Invalid Provider ID');
  }

  const reviews = await Review.find({ providerId: req.params.providerId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  if (!reviews) {
    res.status(404);
    throw new Error('Provider not found or has no reviews');
  }

  res.status(200).json({ success: true, count: reviews.length, data: reviews });
});

/**
 * @route POST /api/reviews
 * @desc Create a new review (Customer only)
 * @access Private/Customer
 */
const createReview = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { providerId, bookingId, rating, comment } = req.body;
  const userId = req.user._id;

  // 1. Validation: Check if the booking exists and is completed
  const booking = await Booking.findOne({ _id: bookingId, userId });

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found for this user.');
  }
  if (booking.status !== 'completed') {
    res.status(400);
    throw new Error(`Cannot review: Booking status is '${booking.status}'. Must be 'completed'.`);
  }
  // Also check if booking's providerId matches the requested providerId

  // 2. Validation: Check if review already exists for this booking
  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already submitted a review for this booking.');
  }

  // 3. Create the review
  const review = await Review.create({
    userId,
    providerId,
    bookingId,
    rating,
    comment,
  });

  // The post-save hook on the Review model will automatically update the Provider's ratingAvg.

  res.status(201).json({ success: true, message: 'Review successfully submitted.', data: review });
});

/**
 * @route PUT /api/reviews/:id
 * @desc Update a review (Owner only)
 * @access Private/Customer
 */
const updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Authorization check: Only the review creator can update it
  if (review.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this review.');
  }

  // Update fields (only rating and comment are updatable)
  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment || review.comment;

  // Manual validation for rating update
  if (req.body.rating && (req.body.rating < 1 || req.body.rating > 5)) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const updatedReview = await review.save();

  // The post-save hook on the Review model will automatically re-calculate the Provider's ratingAvg.

  res.status(200).json({ success: true, data: updatedReview });
});

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete a review (Owner or Admin)
 * @access Private/Customer, Admin
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Authorization check: Only the review creator or an Admin can delete it
  const isAuthorized =
    review.userId.toString() === req.user.id ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    res.status(403);
    throw new Error('Not authorized to delete this review.');
  }

  // Use deleteOne on the document to trigger the post-hook for rating recalculation
  await review.deleteOne();

  res.status(200).json({ success: true, message: 'Review removed' });
});

export { getReviewsByProvider, createReview, updateReview, deleteReview };