import express from 'express';
import { body } from 'express-validator';
import {
  getReviewsByProvider,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/reviews/provider/:providerId - Public view of all reviews for a provider
router.get('/provider/:providerId', getReviewsByProvider);

router.use(protect); // All other actions require authentication

// POST /api/reviews - Create a new review (Customer only)
router.post(
  '/',
  authorize('customer'),
  [
    body('providerId').isMongoId().withMessage('Valid provider ID is required'),
    body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  ],
  createReview
);

// Routes requiring specific review ID
router
  .route('/:id')
  .put(authorize('customer'), updateReview) // Customer can update their own review
  .delete(authorize(['customer', 'admin']), deleteReview); // Customer or Admin can delete

export default router;