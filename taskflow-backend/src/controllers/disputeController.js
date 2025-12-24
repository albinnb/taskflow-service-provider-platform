import asyncHandler from '../utils/asyncHandler.js';
import Dispute from '../models/Dispute.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendDisputeResolution } from '../services/emailService.js';

/**
 * @route POST /api/disputes
 * @desc Create a new dispute for a booking
 * @access Private/Customer
 */
const createDispute = asyncHandler(async (req, res) => {
    const { bookingId, providerId, reason } = req.body;
    const userId = req.user._id;

    // Validate booking ownership
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found or does not belong to you.');
    }

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({ bookingId });
    if (existingDispute) {
        res.status(400);
        throw new Error('A dispute has already been raised for this booking.');
    }

    const dispute = await Dispute.create({
        bookingId,
        raisedBy: userId,
        providerId: booking.providerId, // Derived from the verified booking
        reason,
        status: 'open'
    });

    res.status(201).json({ success: true, data: dispute });
});

/**
 * @route GET /api/disputes
 * @desc Get all disputes (Admin only)
 * @access Private/Admin
 */
const getDisputes = asyncHandler(async (req, res) => {
    const disputes = await Dispute.find({})
        .populate('raisedBy', 'name email phone')
        .populate({
            path: 'providerId',
            select: 'businessName userId',
            populate: {
                path: 'userId',
                select: 'name email phone'
            }
        })
        .populate('bookingId')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: disputes.length, data: disputes });
});

/**
 * @route PUT /api/disputes/:id
 * @desc Resolve a dispute (Admin only)
 * @access Private/Admin
 */
const resolveDispute = asyncHandler(async (req, res) => {
    const { status, adminNotes } = req.body;
    // status: 'resolved', 'refunded', 'rejected'

    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
        res.status(404);
        throw new Error('Dispute not found.');
    }

    dispute.status = status || dispute.status;
    dispute.adminNotes = adminNotes || dispute.adminNotes;

    if (status) dispute.resolutionDate = Date.now();



    await dispute.save();

    // Send Emails
    try {
        const fullDispute = await Dispute.findById(dispute._id).populate('bookingId');
        // Need to fetch customer and provider User objects
        // The dispute has raisedBy (likely customer) and providerId (Provider Model)
        // Wait, providerId in Dispute is ref to 'Provider' model? Let's check model or Create logic.
        // In createDispute: providerId: booking.providerId. Booking.providerId is ref to Provider.
        // So we need:
        // Customer: User.findById(fullDispute.raisedBy) ? Or checking who raised it.
        // Actually, usually booking has userId (customer) and providerId (provider).
        // Let's rely on Booking to identify Customer and Provider.

        const booking = await Booking.findById(fullDispute.bookingId).populate('providerId');
        if (booking) {
            const customer = await User.findById(booking.userId);
            const provider = await Booking.model('Provider').findById(booking.providerId).populate('userId');
            const providerUser = provider ? provider.userId : null;

            if (customer && providerUser) {
                await sendDisputeResolution(fullDispute, customer, providerUser);
            }
        }
    } catch (error) {
        console.error("Failed to send dispute emails:", error);
    }

    // Logic for Refunds could handle Razorpay refund API here if we had it
    // if (status === 'refunded') { ... }

    res.status(200).json({ success: true, data: dispute });
});

export { createDispute, getDisputes, resolveDispute };
