import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// @route POST /api/webhooks/razorpay
// @desc Handle Razorpay webhooks (e.g., payment.captured)
// @access Public (Verified via signature)
router.post('/razorpay', handleRazorpayWebhook);

export default router;
