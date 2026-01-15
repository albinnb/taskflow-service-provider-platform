import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Provider from '../models/Provider.js';
import { sendBookingConfirmation, sendRescheduleNotification } from '../services/emailService.js';
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
        .populate('userId', 'name email phone') // Populates customer details
        .populate({
            path: 'providerId',
            select: 'businessName userId' // Populates provider details AND their linked userId
        })
        .lean();

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Authorization check: Must be the customer, provider, or admin
    // Note: Since we populated, userId and providerId are Objects, not IDs.
    const isCustomer = booking.userId._id.toString() === req.user._id.toString();
    const isProvider = booking.providerId.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
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
    const { serviceId, scheduledAt, notes } = req.body;
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

    // FIXED LOGIC: Duration comes from the Service, not the User
    const durationMinutes = service.durationMinutes || 60; // Default to 60 if missing

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
    // const bookingStartHour = bookingTime.getHours();
    // const bookingEndHour = new Date(bookingTime.getTime() + durationMinutes * 60000).getHours();

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

    // 2. Calculate Total Price (FIXED PRICE, NOT HOURLY)
    // The service.price is now treated as a specific Fixed Fee for the service.
    const totalPrice = service.price;

    // 3. Create the Booking
    const booking = await Booking.create({
        userId,
        serviceId,
        providerId: service.providerId,
        scheduledAt,
        durationMinutes, // Storing the fixed duration from service
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

    // Protection removed to allow providers to complete bookings
    // if (status === 'completed' && req.user.role !== 'admin') { ... }

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

/**
 * @route PUT /api/bookings/:id/extend
 * @desc Extend a booking by 30 mins and cascade shift future bookings
 * @access Private (Provider only)
 */
const extendBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    const provider = await Provider.findById(booking.providerId);

    if (provider.userId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to extend this booking.');
    }

    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
        res.status(400);
        throw new Error('Can only extend active bookings.');
    }

    const EXTENSION_MINUTES = 30;
    const shiftMs = EXTENSION_MINUTES * 60000;

    // 1. Calculate New End Time for Current Booking
    const currentEnd = new Date(new Date(booking.scheduledAt).getTime() + booking.durationMinutes * 60000);
    const newEnd = new Date(currentEnd.getTime() + shiftMs);

    // 2. Find ALL Future Bookings for this Provider on the SAME DAY
    // We need to shift ANY booking that starts AFTER the current booking's ORIGINAL end time
    // OR any booking that overlaps with the new extension window.
    // Simpler: Find all bookings scheduled AFTER current booking's start time on the same day.
    const startOfDay = new Date(booking.scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(booking.scheduledAt);
    endOfDay.setHours(23, 59, 59, 999);

    const futureBookings = await Booking.find({
        providerId: booking.providerId,
        _id: { $ne: booking._id }, // Exclude current
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['confirmed', 'pending'] }
    }).sort({ scheduledAt: 1 }); // Sort by time is CRITICAL

    // 3. Check for Provider Availability / Working Hours (Hard Stop)
    // We need to ensure that shifting the LAST booking doesn't push it past the provider's working hours.
    // This is the "Manual Resolution Prompt" trigger condition provided by the user.

    // Get working hours for today
    const dayOfWeek = new Date(booking.scheduledAt).getUTCDay();
    const dayName = DAY_NAMES[dayOfWeek];
    const daysArray = getDaysArrayFromAvailability(provider.availability);
    const daySchedule = daysArray.find(
        (a) => a.dayOfWeek === dayOfWeek || a.dayOfWeek === dayName
    );

    if (!daySchedule || daySchedule.slots.length === 0) {
        // Should not happen if booking exists, but safety check
        res.status(400);
        throw new Error('No working hours defined for today.');
    }

    // Determine absolute latest end time for the provider today
    // daySchedule.slots is array of { startTime, endTime }. We need the max endTime.
    // e.g., ["09:00"-"12:00", "13:00"-"17:00"] -> 17:00 is the hard stop.
    let closingTimeDate = new Date(booking.scheduledAt);
    closingTimeDate.setHours(0, 0, 0, 0); // reset

    // Find the latest end string
    const latestSlot = daySchedule.slots.reduce((latest, slot) => {
        const slotEnd = slot.to || slot.endTime;
        if (!latest) return slotEnd;
        // Compare "HH:mm" strings
        return slotEnd > latest ? slotEnd : latest;
    }, null);

    if (latestSlot) {
        const [h, m] = latestSlot.split(':');
        closingTimeDate.setHours(parseInt(h), parseInt(m), 0, 0);
    } else {
        // Fallback?
        closingTimeDate.setHours(23, 59, 0, 0);
    }

    // 4. Simulate the Shift and Check Bounds
    // We only need to shift bookings that actually overlap or are pushed.
    // But for "Cascading", we usually preserve the gaps? 
    // Optimization: Only shift if (Prev.End > Next.Start). 
    // But user asked for "Cascading Reschedule", implying everything moves to keep relative order?
    // "The system automatically moves the 12:00 booking to 12:30". 
    // If there was a gap (12:00 - 13:00 was free), moving 12:00 to 12:30 is fine.
    // But what if 13:00 booking exists? It must ALSO move to 13:30? or buffer absorbs it?
    // "Cascading" usually means *everything* downstream pushes out.
    // Let's implement full cascade for simplicity and correctness (preserves prep time/gaps).

    // Check if the FINAL booking fits
    let lastBookingEndTime;
    if (futureBookings.length > 0) {
        const lastBooking = futureBookings[futureBookings.length - 1];
        const shiftedStart = new Date(new Date(lastBooking.scheduledAt).getTime() + shiftMs);
        lastBookingEndTime = new Date(shiftedStart.getTime() + lastBooking.durationMinutes * 60000);
    } else {
        // No future bookings, just check current extended booking
        lastBookingEndTime = newEnd;
    }

    if (lastBookingEndTime > closingTimeDate) {
        // CONFLICT FOUND: Pushes past working hours.
        // Return 409 to trigger "Manual Resolution Prompt" on frontend.
        res.status(409);
        throw new Error(`Cannot auto-extend. Shifting schedule pushes the last booking past working hours (${latestSlot}). Please contact customers to resolve manually.`);
    }

    // 5. Apply Updates and Notify
    // Extend current booking
    booking.durationMinutes += EXTENSION_MINUTES;
    await booking.save();

    // Shift future bookings
    const customersToNotify = [];

    for (const futBooking of futureBookings) {
        // Only shift if it starts AFTER the original current booking? (Yes, sorted by time)
        // Check if it actually needs shifting? (i.e. is it blocked?)
        // Algorithm: A ripple. 
        // We simply add shiftMs to scheduledAt for ALL future bookings to maintain the exact schedule structure, just delayed.
        // This is the safest "Cascading" interpretation.

        futBooking.scheduledAt = new Date(new Date(futBooking.scheduledAt).getTime() + shiftMs);
        await futBooking.save();

        // Populate user to get email
        await futBooking.populate('userId', 'email name');
        customersToNotify.push({
            customer: futBooking.userId,
            booking: futBooking,
            delay: EXTENSION_MINUTES
        });
    }

    // Send Emails Asynchronously (don't block response)
    customersToNotify.forEach(({ customer, booking, delay }) => {
        sendRescheduleNotification(customer, booking, delay).catch(err => console.error("Email fail", err));
    });

    res.status(200).json({
        success: true,
        message: `Booking extended. ${futureBookings.length} future bookings were automatically rescheduled.`,
        data: booking
    });
});

export {
    getBookings,
    getBookingById,
    createBooking,
    getProviderAvailability,
    updateBookingStatus,
    cancelBooking,
    completeBookingPayout,
    extendBooking // New export
};