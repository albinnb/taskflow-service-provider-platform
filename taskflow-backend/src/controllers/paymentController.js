import Razorpay from 'razorpay';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Log initialization
console.log('Razorpay initialized with Key ID:', process.env.RAZORPAY_KEY_ID?.substring(0, 20) + '...');

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay Payment Order for an EXISTING Booking
 * @access  Private (Customer)
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('serviceId');
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Authorization check
    if (booking.userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to pay for this booking');
    }

    if (booking.paymentStatus === 'paid') {
        res.status(400);
        throw new Error('Booking is already paid');
    }

    const amountInPaise = Math.round(booking.totalPrice * 100);

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
            bookingId: booking._id.toString(),
            serviceId: booking.serviceId._id.toString(),
        }
    };

    try {
        const order = await razorpay.orders.create(options);
        res.status(200).json({
            success: true,
            order,
            totalPrice: booking.totalPrice,
            bookingId: booking._id
        });
    } catch (error) {
        console.error("Razorpay Order Creation Failed:", error);
        res.status(500);
        throw new Error('Razorpay Order Creation Failed');
    }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay Payment & Update Booking to PAID
 * @access  Private (Customer)
 */
export const verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Find the existing booking and update it
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            res.status(404);
            throw new Error('Booking not found during verification');
        }

        booking.paymentStatus = 'paid';
        booking.meta = {
            ...booking.meta,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paidAt: new Date()
        };

        const updatedBooking = await booking.save();

        res.status(200).json({
            success: true,
            message: 'Payment verification successful. Booking marked as paid.',
            data: updatedBooking
        });
    } else {
        res.status(400);
        throw new Error('Invalid Payment Signature');
    }
});