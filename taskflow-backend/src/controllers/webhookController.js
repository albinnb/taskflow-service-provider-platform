import crypto from 'crypto';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * @route POST /api/webhooks/razorpay
 * @desc Handle asynchronous webhook events from Razorpay
 * @access Public (Signature Verified)
 */
export const handleRazorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Ensure webhooks are configured to send this secret
        if (!secret) {
            logger.error('RAZORPAY_WEBHOOK_SECRET is not defined in environment variables');
            return res.status(500).send('Webhook configuration error');
        }

        const signature = req.headers['x-razorpay-signature'];
        
        // Use the raw body buffered in server.js middleware
        const payload = req.rawBody;

        if (!payload || !signature) {
            logger.warn('Webhook received without payload or signature');
            return res.status(400).send('Missing payload or signature');
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        if (expectedSignature !== signature) {
            logger.warn('Invalid Webhook Signature Received');
            return res.status(400).send('Invalid Signature');
        }

        // Handle the event
        const event = req.body;
        logger.info(`Received Razorpay Webhook Event: ${event.event}`);

        if (event.event === 'payment.captured') {
            const paymentEntity = event.payload.payment.entity;
            // The Razorpay order ID is in payment.entity.order_id
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            // Find the booking with this order ID in its meta
            const booking = await Booking.findOne({ 'meta.orderId': orderId });

            if (booking) {
                if (booking.paymentStatus !== 'paid') {
                    booking.paymentStatus = 'paid';
                    booking.meta = {
                        ...booking.meta,
                        paymentId: paymentId,
                        webhookVerifiedAt: new Date()
                    };
                    await booking.save();
                    logger.info(`Booking ${booking._id} marked as paid via webhook.`);
                } else {
                    logger.info(`Booking ${booking._id} already marked as paid.`);
                }
            } else {
                logger.warn(`Webhook: No booking found for Razorpay order ID ${orderId}`);
            }
        }

        // Respond with 200 OK so Razorpay knows we received it
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        logger.error(`Webhook Processing Error: ${error.message}`);
        res.status(500).send('Webhook Processing Error');
    }
};
