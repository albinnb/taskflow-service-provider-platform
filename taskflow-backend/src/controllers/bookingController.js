import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Provider from '../models/Provider.js';
// import { sendBookingConfirmation } from '../services/emailService.js'; // Stays commented out
import asyncHandler from '../utils/asyncHandler.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Day names helper for new availability schema
const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

// Normalize provider.availability to an array of day objects
const getDaysArrayFromAvailability = (availability) => {
    if (!availability) return [];

    if (Array.isArray(availability)) {
        // Legacy numeric dayOfWeek array
        return availability;
    }

    if (Array.isArray(availability.days)) {
        // New object-based schema { days: [...], bufferTime }
        return availability.days;
    }

    return [];
};

// Helper function to check for time conflicts
const checkTimeConflict = async (providerId, scheduledAt, durationMinutes, bufferMinutes = 0, excludeBookingId = null) => {
    // 1. Calculate the booking start and include buffer in the "effective" duration check if needed
    // Actually, usually buffer is added to the *existing* bookings or we treat the new booking as needing a buffer after it.
    // Standard approach: The GAP between two bookings must be >= buffer.
    // So, Booking A and Booking B.
    // A.end + buffer <= B.start  OR  B.end + buffer <= A.start.

    // Invert: Conflict if NOT (A.end + buffer <= B.start OR B.end + buffer <= A.start)
    // Conflict if: A.end + buffer > B.start AND B.end + buffer > A.start

    // Let's model "Occupied Time" for an existing booking as [Start, End + Buffer].
    // And for the new booking as [Start, End + Buffer].
    // If these intervals overlap, there is a conflict.

    const newStart = new Date(scheduledAt);
    const newEnd = new Date(newStart.getTime() + (durationMinutes * 60000));
    // We add buffer to the new booking's "occupied" window to ensure future bookings respect it,
    // AND to ensure we don't butt up against a previous booking that requires a buffer?
    // Actually, simply: Existing bookings are obstacles.
    // Each existing booking effectively blocks [Start, End + Buffer].
    // BUT, we also need to ensure the *New* booking doesn't end too close to a *future* booking?
    // If New Booking is 8:00-9:00. Future booking 9:05-10:00. Buffer 15.
    // 9:00 + 15 = 9:15. This overlaps 9:05. Conflict!
    // So: Two intervals [S1, E1] and [S2, E2].
    // Conflict if Gap < Buffer.
    // Gap = max(0, S2 - E1) or max(0, S1 - E2).
    // We want Gap >= Buffer.
    // So if (S2 - E1) < Buffer AND (S1 - E2) < Buffer -> Conflict.
    // i.e., S2 < E1 + Buffer AND S1 < E2 + Buffer.

    const bufferMs = bufferMinutes * 60000;

    const conflictQuery = {
        providerId: providerId,
        status: { $in: ['confirmed', 'pending'] },
        $expr: {
            $and: [
                {
                    $lt: [
                        "$scheduledAt",
                        new Date(newEnd.getTime() + bufferMs) // Existing Start < New End + Buffer
                    ]
                },
                {
                    $gt: [
                        { $add: ["$scheduledAt", { $multiply: ["$durationMinutes", 60000] }, bufferMs] }, // Existing End + Buffer
                        newStart // > New Start
                    ]
                }
            ]
        }
    };

    if (excludeBookingId) {
        conflictQuery._id = { $ne: excludeBookingId };
    }

    const existingConflict = await Booking.findOne(conflictQuery).lean();

    return existingConflict;
};


/**
 * @route GET /api/bookings
 * @desc Get all bookings (role-based view)
 */
const getBookings = asyncHandler(async (req, res) => {
    let queryFilter = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
        queryFilter.userId = req.user._id;
    } else if (req.user.role === 'provider') {
        const provider = await Provider.findOne({ userId: req.user._id });
        if (!provider) {
            res.status(404);
            throw new Error('Provider profile not found');
        }
        queryFilter.providerId = provider._id;
    }

    const features = new ApiFeatures(
        Booking.find(queryFilter).populate('serviceId userId providerId'),
        req.query
    )
        .filter()
        .sort()
        .paginate();

    const bookings = await features.query.lean();
    const totalCount = await Booking.countDocuments({ ...queryFilter, ...features.query.getQuery() });

    res.status(200).json({
        success: true,
        count: bookings.length,
        total: totalCount,
        pagination: features.pagination,
        data: bookings,
    });
});

/**
 * @route GET /api/bookings/:id
 * @desc Get single booking
 * @access Private
 */
const getBookingById = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('serviceId')
        .populate('userId', 'name email phone')
        .populate('providerId', 'businessName')
        .lean();

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Authorization check: Must be the customer, provider, or admin
    const provider = await Provider.findById(booking.providerId);
    const isAuthorized =
        req.user._id.toString() === booking.userId.toString() || // Customer
        req.user._id.toString() === provider.userId.toString() || // Provider
        req.user.role === 'admin';

    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to view this booking.');
    }

    res.status(200).json({ success: true, data: booking });
});

/**
 * @route POST /api/bookings
 * @desc Create a new booking
 */
const createBooking = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    // --- REVERT START: Back to specific time and duration ---
    const { serviceId, scheduledAt, durationMinutes, notes } = req.body;
    const userId = req.user._id;

    // 1. Fetch Service and Provider details
    const service = await Service.findById(serviceId).lean();
    if (!service || !service.isActive) {
        res.status(404);
        throw new Error('Service not found or inactive');
    }

    const provider = await Provider.findById(service.providerId)
        .populate('userId', 'email name')
        .lean();
    if (!provider) {
        res.status(404);
        throw new Error('Provider not found');
    }

    // --- AVAILABILITY CHECK 1: Provider General Availability ---
    const bookingDate = new Date(scheduledAt);
    // Use UTC day-of-week to align with the availability generation logic
    const dayOfWeek = bookingDate.getUTCDay(); // 0 (Sunday) to 6 (Saturday)
    const dayName = DAY_NAMES[dayOfWeek];

    const daysArray = getDaysArrayFromAvailability(provider.availability);

    const dailyAvailability = daysArray.find(
        (avail) =>
            avail.dayOfWeek === dayOfWeek || // legacy numeric
            avail.dayOfWeek === dayName      // new string-based
    );

    if (!dailyAvailability || dailyAvailability.slots.length === 0) {
        res.status(400);
        throw new Error('Provider does not have general availability set for this day.');
    }

    // Check if the requested time range falls within the provider's general working hours for the day
    const bookingTime = new Date(scheduledAt);
    const bookingStartHour = bookingTime.getHours();
    const bookingEndHour = new Date(bookingTime.getTime() + durationMinutes * 60000).getHours();

    // A detailed check is complex, so we rely on the frontend to send valid slots,
    // and rely primarily on the conflict check (below) to prevent overlaps.

    // --- AVAILABILITY CHECK 2: Time Conflict Check ---
    const bufferMinutes = provider.availability?.bufferTime || 0;

    const existingConflict = await checkTimeConflict(
        service.providerId,
        scheduledAt,
        durationMinutes,
        bufferMinutes
    );

    if (existingConflict) {
        res.status(409); // Conflict
        throw new Error('The selected time slot conflicts with an existing confirmed booking.');
    }

    // 2. Calculate total price (Hourly Rate * Duration Ratio)
    const hours = durationMinutes / 60;
    // Price field is now the HOURLY RATE (e.g., ₹90.00 / hour)
    const totalPrice = service.price * hours;

    // 3. Create the Booking
    const booking = await Booking.create({
        userId,
        serviceId,
        providerId: service.providerId,
        scheduledAt,
        durationMinutes, // Storing the customer's requested duration
        totalPrice,
        status: 'pending',
        paymentStatus: 'unpaid',
        meta: { notes: notes } // Essential for TaskRabbit model
    });

    // 4. Email Confirmation (Commented out)

    res.status(201).json({
        success: true,
        message: 'Booking request created. Pending payment and confirmation.',
        data: booking,
    });
});


/**
 * @route GET /api/providers/:id/availability
 * @desc Get a provider's available time slots for a specific date (TaskRabbit Dynamic Slot Logic)
 * @access Public
 */
const getProviderAvailability = asyncHandler(async (req, res) => {
    const { date, serviceId } = req.query; // Now requires serviceId to get duration
    const { id: providerId } = req.params;

    if (!date || !serviceId) {
        res.status(400);
        throw new Error('Date and Service ID query parameters are required.');
    }

    const service = await Service.findById(serviceId).select('durationMinutes duration'); // Added duration just in case
    if (!service) {
        res.status(404);
        throw new Error('Service not found.');
    }

    // Use requested duration if provided (and valid), otherwise fallback to service minimum
    let slotDuration = service.durationMinutes;
    if (req.query.durationMinutes) {
        const requestedDuration = parseInt(req.query.durationMinutes, 10);
        if (!isNaN(requestedDuration) && requestedDuration >= slotDuration) {
            slotDuration = requestedDuration;
        }
    }

    // 1. Get the provider's general availability for that day
    const queryDate = new Date(date);
    // Use UTC day-of-week to ensure stability regardless of server timezone
    const dayOfWeek = queryDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayName = DAY_NAMES[dayOfWeek];

    const provider = await Provider.findById(providerId).select('availability');
    if (!provider) {
        res.status(404);
        throw new Error('Provider not found');
    }

    const daysArray = getDaysArrayFromAvailability(provider.availability);

    const daySchedule = daysArray.find(
        (a) =>
            a.dayOfWeek === dayOfWeek || // legacy numeric
            a.dayOfWeek === dayName      // new string-based
    );

    // If provider does not work on this day, or schedule is empty
    if (!daySchedule || daySchedule.slots.length === 0) {
        return res.status(200).json({ success: true, data: [] });
    }

    // 2. Find all existing bookings for the provider on that date
    // Note: We need bookings that might overlap via BUFFER too, so we shouldn't be too strict on the date bounds if buffer is huge,
    // but usually buffer is small. Keeping strict day bounds is usually okay for "slots on this day".
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
        providerId: providerId,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['confirmed', 'pending'] }
    }).select('scheduledAt durationMinutes');

    const bufferMinutes = provider.availability?.bufferTime || 0;
    const bufferMs = bufferMinutes * 60000;

    // 3. Generate all possible time slots based on Provider's Time Ranges
    const availableSlots = [];
    const now = new Date();
    const intervalMinutes = 30; // Generate slots every 30 minutes (TaskRabbit style)

    for (const slotRange of daySchedule.slots) {
        const startStr = slotRange.from || slotRange.startTime;
        const endStr = slotRange.to || slotRange.endTime;

        if (!startStr || !endStr) continue;

        const [startHour, startMinute] = startStr.split(':').map(Number);
        const [endHour, endMinute] = endStr.split(':').map(Number);

        let currentSlotTime = new Date(queryDate);
        currentSlotTime.setHours(startHour, startMinute, 0, 0);

        const rangeEndLimit = new Date(queryDate);
        rangeEndLimit.setHours(endHour, endMinute, 0, 0);

        while (currentSlotTime < rangeEndLimit) {
            const slotStart = new Date(currentSlotTime);
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000); // User requested Duration

            // Do not show slots that start in the past
            if (slotStart <= now) {
                currentSlotTime = new Date(currentSlotTime.getTime() + intervalMinutes * 60000);
                continue;
            }

            // Check A: Does the potential booking (slotStart to slotEnd) exceed the provider's working day end?
            if (slotEnd > rangeEndLimit) {
                // If the required duration bleeds past the end of the provider's range, skip this starting time
                break;
            }

            // Check B: Does the potential booking conflict with an existing booking (including BUFFER)?
            const isConflicting = existingBookings.some(booking => {
                const existingStart = new Date(booking.scheduledAt);
                const existingEnd = new Date(existingStart.getTime() + booking.durationMinutes * 60000);

                // Effective ranges with Buffer
                // Conflict if S2 < E1 + Buffer AND S1 < E2 + Buffer
                // slotStart < existingEnd + Buffer AND existingStart < slotEnd + Buffer

                return (
                    slotStart.getTime() < existingEnd.getTime() + bufferMs &&
                    existingStart.getTime() < slotEnd.getTime() + bufferMs
                );
            });

            if (!isConflicting) {
                // Format the time as a display string
                const timeString = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
                availableSlots.push({
                    time: timeString,
                    scheduledAt: slotStart.toISOString()
                });
            }

            // Move to the next interval (e.g., 9:00 -> 9:30)
            currentSlotTime = new Date(currentSlotTime.getTime() + intervalMinutes * 60000);
        }
    }

    res.status(200).json({ success: true, data: availableSlots });
});


/**
 * @route PUT /api/bookings/:id/complete
 * @desc Mark booking as completed and trigger conceptual payout (Escrow release)
 * @access Private (Customer or Admin)
 */
const completeBookingPayout = asyncHandler(async (req, res) => {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Authorization check: Only the customer who booked it or an admin can mark as complete
    const isAuthorized =
        req.user._id.toString() === booking.userId.toString() ||
        req.user.role === 'admin';

    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to complete this booking.');
    }

    // Status check
    if (booking.status === 'completed') {
        res.status(400);
        throw new Error('Booking is already marked complete.');
    }
    if (booking.paymentStatus !== 'paid') {
        res.status(400);
        throw new Error('Cannot complete booking: Payment was not verified or paid.');
    }

    // 1. Update status to 'completed'
    booking.status = 'completed';

    // 2. (Conceptual Escrow Release)
    console.log(`[ESCROW SIMULATED] Funds of ${booking.totalPrice} INR released for Booking ID: ${booking._id}`);

    const updatedBooking = await booking.save();

    // --- NEW: Trigger a prompt for Review submission (TaskRabbit flow) ---
    res.status(200).json({
        success: true,
        message: 'Service completed. Please submit a rating and review.',
        data: updatedBooking,
        requiresReview: true // Signal to frontend to redirect to the review page
    });
});


/**
 * @route PUT /api/bookings/:id
 * @desc Update booking status (Provider/Admin only)
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
    // ... (UNCHANGED) ...
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    const { status, paymentStatus } = req.body;

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const provider = await Provider.findById(booking.providerId);

    // Authorization check
    if (
        provider.userId.toString() !== req.user.id &&
        req.user.role !== 'admin'
    ) {
        res.status(403);
        throw new Error('Not authorized to update this booking status.');
    }

    // Protection against unauthorized completion via this general route
    if (status === 'completed' && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Use the dedicated /complete endpoint to finalize the booking.');
    }

    // Update status and paymentStatus
    if (status) {
        booking.status = status;
    }
    if (paymentStatus) {
        booking.paymentStatus = paymentStatus;
    }

    const updatedBooking = await booking.save();

    res.status(200).json({ success: true, data: updatedBooking });
});

/**
 * @route DELETE /api/bookings/:id
 * @desc Cancel a booking (Customer/Admin only)
 */
const cancelBooking = asyncHandler(async (req, res) => {
    // ... (UNCHANGED) ...
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Authorization check
    const isAuthorized =
        req.user._id.toString() === booking.userId.toString() ||
        req.user.role === 'admin';

    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to cancel this booking.');
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
        res.status(400);
        throw new Error(`Cannot cancel a booking that is already ${booking.status}.`);
    }

    // Update status to 'cancelled' (soft delete approach)
    booking.status = 'cancelled';
    // NOTE: If paymentStatus is 'paid', you must initiate a refund here.
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking successfully cancelled' });
});

export {
    getBookings,
    getBookingById,
    createBooking,
    getProviderAvailability, // <-- NEW EXPORT
    updateBookingStatus,
    cancelBooking,
    completeBookingPayout,
};