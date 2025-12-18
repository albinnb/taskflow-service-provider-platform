import express from 'express';
import { body } from 'express-validator';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  completeBookingPayout, 
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All booking routes require authentication

// GET /api/bookings - Get all user/provider/admin bookings
router.get('/', getBookings);

// --- MODIFICATION START: Reverting to TaskRabbit Dynamic Scheduling Validation ---
// POST /api/bookings - Create a new booking (Customer only)
router.post(
  '/',
  authorize('customer'),
  [
    body('serviceId').isMongoId().withMessage('Valid service ID is required'),
    
    // Reverted fields validation:
    body('scheduledAt').isISO8601().toDate().withMessage('Valid scheduled date/time is required (ISO 8601)'),
    body('durationMinutes')
      .isInt({ min: 30 }).withMessage('Duration must be at least 30 minutes')
      .toInt(), // Convert to integer
    
    // NEW: Add validation for the task description/notes field
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters.'),
  ],
  createBooking
);
// --- MODIFICATION END ---

// Routes requiring specific booking ID
router
  .route('/:id')
  .get(getBookingById) // Get single booking
  .put(
    authorize(['provider', 'admin']), // Update status (Provider/Admin)
    [
      body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status'),
    ],
    updateBookingStatus
  )
  .delete(cancelBooking); // DELETE can be used for cancellation or soft-delete (Customer/Admin)

// --- ESCROW ROUTE: Kept for professional payout logic ---
router.put(
    '/:id/complete',
    authorize(['customer', 'admin']), // Customer completes their own booking, Admin can override
    completeBookingPayout
);

export default router;