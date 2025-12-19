import express from 'express';
import { body } from 'express-validator';
import {
    createDispute,
    getDisputes,
    resolveDispute
} from '../controllers/disputeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Customer: Create a dispute
router.post(
    '/',
    [
        body('bookingId').notEmpty().withMessage('Booking ID is required'),
        body('reason').notEmpty().withMessage('Reason is required'),
    ],
    createDispute
);

// Admin: Get all disputes
router.get('/', authorize('admin'), getDisputes);

// Admin: Resolve a dispute
router.put(
    '/:id',
    authorize('admin'),
    [
        body('status').isIn(['resolved', 'refunded', 'rejected']).withMessage('Invalid status'),
    ],
    resolveDispute
);

export default router;
