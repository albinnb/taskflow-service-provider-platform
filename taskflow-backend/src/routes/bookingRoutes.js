import express from 'express';
import Joi from 'joi';
import validate from '../middleware/validate.js';
import {
    getBookings,
    getBookingById,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    completeBookingPayout,
    extendBooking // Import new controller
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All booking routes require authentication

// Joi Schemas
const createBookingSchema = {
    body: Joi.object({
        serviceId: Joi.string().hex().length(24).required().messages({
            'any.required': 'Valid service ID is required',
            'string.hex': 'Valid service ID is required'
        }),
        scheduledAt: Joi.date().iso().required().messages({
            'any.required': 'Valid scheduled date/time is required (ISO 8601)',
            'date.format': 'Valid scheduled date/time is required (ISO 8601)'
        }),
        durationMinutes: Joi.number().integer().min(30).optional().messages({
            'number.min': 'Duration must be at least 30 minutes'
        }),
        notes: Joi.string().max(500).allow('').optional().messages({
            'string.max': 'Notes cannot exceed 500 characters.'
        }),
        idempotencyKey: Joi.string().max(100).allow('').optional()
    })
};

const updateStatusSchema = {
    body: Joi.object({
        status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled').optional().messages({
            'any.only': 'Invalid status'
        }),
        paymentStatus: Joi.string().valid('paid', 'unpaid', 'on-service', 'refunded').optional()
    })
};

// GET /api/bookings - Get all user/provider/admin bookings
router.get('/', getBookings);

// POST /api/bookings - Create a new booking (Customer only)
router.post(
    '/',
    authorize('customer'),
    validate(createBookingSchema),
    createBooking
);

// Routes requiring specific booking ID
router
    .route('/:id')
    .get(getBookingById) // Get single booking
    .put(
        authorize(['provider', 'admin']), // Update status (Provider/Admin)
        validate(updateStatusSchema),
        updateBookingStatus
    )
    .delete(cancelBooking); // DELETE can be used for cancellation or soft-delete (Customer/Admin)

// --- ESCROW ROUTE: Kept for professional payout logic ---
router.put(
    '/:id/complete',
    authorize(['customer', 'admin']), // Customer completes their own booking, Admin can override
    completeBookingPayout
);

// New Extend Booking Route
router.put(
    '/:id/extend',
    authorize(['provider']),
    extendBooking
);

export default router;