import express from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/create-order', authorize('customer'), createPaymentOrder);
router.post('/verify', authorize('customer'), verifyPayment);

export default router;