import { validationResult } from 'express-validator';
import Provider from '../models/Provider.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

// Helper to define standard slots (must match Booking.js enum)
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];


/**
 * @route GET /api/providers
 * @desc Get all providers...
 * @access Public
 */
const getProviders = asyncHandler(async (req, res) => {
	const features = new ApiFeatures(Provider.find().populate('userId', 'name email phone'), req.query)
		.search() 
		.filter() 
		.sort()
		.limitFields()
		.paginate();

	const providers = await features.query.lean();
	const totalCount = await Provider.countDocuments(features.query.getQuery());

	res.status(200).json({
		success: true,
		count: providers.length,
		total: totalCount,
		pagination: features.pagination,
		data: providers,
	});
});

/**
 * @route GET /api/providers/:id
 * @desc Get single provider by ID
 * @access Public
 */
const getProviderById = asyncHandler(async (req, res) => {
	const provider = await Provider.findById(req.params.id)
		.populate('userId', 'name email phone createdAt') 
		.populate('categories', 'name slug') 
		.lean();

	if (!provider) {
		res.status(404);
		throw new Error('Provider not found');
	}

	res.status(200).json({ success: true, data: provider });
});

/**
 * @route POST /api/providers
 * @desc Complete provider onboarding...
 * @access Private/Provider
 */
const createProviderProfile = asyncHandler(async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400);
		throw new Error(errors.array()[0].msg);
	}

	let provider = await Provider.findOne({ userId: req.user._id });

	if (provider && provider.businessName !== "A new service provider.") {
		res.status(400);
		throw new Error('Provider profile already completed. Use PUT to update.');
	}

	provider = await Provider.findOneAndUpdate(
		{ userId: req.user._id },
		{
			$set: {
				businessName: req.body.businessName,
				description: req.body.description,
				categories: req.body.categories,
				address: req.body.address,
				location: {
					type: 'Point',
					coordinates: req.body.location.coordinates,
				},
			},
		},
		{ new: true, upsert: true, runValidators: true }
	);

	await User.findByIdAndUpdate(req.user._id, {
		location: provider.location,
		address: provider.address,
	});

	res.status(201).json({ success: true, message: 'Provider profile created/updated successfully.', data: provider });
});

/**
 * @route PUT /api/providers/:id
 * @desc Update provider profile details...
 * @access Private/Provider, Admin
 */
const updateProviderProfile = asyncHandler(async (req, res) => {
	const providerId = req.params.id;
	const provider = await Provider.findById(providerId);

	if (!provider) {
		res.status(404);
		throw new Error('Provider not found');
	}

	if (
		provider.userId.toString() !== req.user.id &&
		req.user.role !== 'admin'
	) {
		res.status(403);
		throw new Error('Not authorized to update this profile');
	}

	const updates = { ...req.body };

	if (updates.location && updates.location.coordinates) {
		updates.location.type = 'Point'; // Ensure type is set
	}

	const updatedProvider = await Provider.findByIdAndUpdate(
		providerId,
		{ $set: updates },
		{ new: true, runValidators: true }
	);

	if (updates.location || updates.address) {
		await User.findByIdAndUpdate(updatedProvider.userId, {
			location: updatedProvider.location,
			address: updatedProvider.address,
		});
	}

	res.status(200).json({ success: true, data: updatedProvider });
});

/**
 * @route DELETE /api/providers/:id
 * @desc Delete provider profile...
 * @access Private/Admin
 */
const deleteProviderProfile = asyncHandler(async (req, res) => {
	const provider = await Provider.findById(req.params.id);

	if (!provider) {
		res.status(404);
		throw new Error('Provider not found');
	}

	await provider.deleteOne();

	await User.findByIdAndUpdate(provider.userId, {
		role: 'customer',
	});

	res.status(200).json({ success: true, message: 'Provider profile removed and user role reset' });
});


// ------------------------------------------------------------------
// NEW CONTROLLER: Update Provider Availability
// ------------------------------------------------------------------
/**
 * @route PUT /api/providers/availability
 * @desc Update the logged-in provider's weekly availability (time slots)
 * @access Private/Provider
 */
const updateProviderAvailability = asyncHandler(async (req, res) => {
    const providerUserId = req.user._id;
    const { availability } = req.body; // Expects an array matching the dailyAvailabilitySchema

    if (!Array.isArray(availability) || availability.length === 0) {
        res.status(400);
        throw new Error('Availability data is required and must be an array.');
    }
    
    // Find the provider profile linked to the user
    const provider = await Provider.findOne({ userId: providerUserId });

    if (!provider) {
        res.status(404);
        throw new Error('Provider profile not found.');
    }

    // 1. Basic validation check for the array structure
    const validDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
    availability.forEach(dayEntry => {
        if (!validDays.includes(dayEntry.dayOfWeek) || 
            !dayEntry.slots || 
            typeof dayEntry.slots.Morning !== 'boolean' ||
            typeof dayEntry.slots.Afternoon !== 'boolean' ||
            typeof dayEntry.slots.Evening !== 'boolean'
        ) {
            // Throwing an error for invalid structure
            throw new Error('Invalid availability structure provided. Check dayOfWeek, Morning, Afternoon, and Evening fields.');
        }
    });

    // 2. Update the provider's availability field
    provider.availability = availability;
    const updatedProvider = await provider.save();

    res.status(200).json({ 
        success: true, 
        message: 'Availability updated successfully.', 
        data: updatedProvider.availability 
    });
});


// ------------------------------------------------------------------
// UPDATED CONTROLLER: Get Provider Availability (Slot Logic)
// ------------------------------------------------------------------
/**
 * @route   GET /api/providers/:id/availability
 * @desc    Get a provider's available time slots for a specific date
 * @access  Public
 */
const getProviderAvailability = asyncHandler(async (req, res) => {
    const { date } = req.query;
    const { id: providerId } = req.params;

    if (!date) {
        res.status(400);
        throw new Error('Date query parameter is required');
    }

    const queryDate = new Date(date);
    // Convert to start of day for consistent comparison with bookingDate
    const dateOnly = new Date(queryDate);
    dateOnly.setUTCHours(0, 0, 0, 0); 
    const dayOfWeek = dateOnly.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

    // 1. Find the provider and their general availability for that day
    const provider = await Provider.findById(providerId).select('availability');
    if (!provider) {
        res.status(404);
        throw new Error('Provider not found');
    }

    const daySchedule = provider.availability.find(a => a.dayOfWeek === dayOfWeek);

    // If provider does not work on this day, no slots are available
    if (!daySchedule) {
        return res.status(200).json({ success: true, data: [] });
    }

    // 2. Find all *existing* bookings for this provider on that date
    const existingBookings = await Booking.find({
        providerId: providerId,
        bookingDate: dateOnly, // Use the 00:00:00Z date
        status: { $in: ['confirmed', 'pending'] } // Only check for active bookings
    }).select('timeSlot');

    const bookedSlots = existingBookings.map(b => b.timeSlot);

    // 3. Determine available slots
    const availableSlots = TIME_SLOTS.filter(slotName => {
        // Check A: Is the provider generally available in this slot according to their settings?
        const isProviderAvailable = daySchedule.slots[slotName] === true;
        
        // Check B: Is the slot already booked by another customer?
        const isAlreadyBooked = bookedSlots.includes(slotName);

        // Check C: Only allow booking slots that are in the future
        const now = new Date();
        const slotStartTime = new Date(queryDate);
        
        let slotStartHour;
        if (slotName === 'Morning') slotStartHour = 9;
        else if (slotName === 'Afternoon') slotStartHour = 12;
        else if (slotName === 'Evening') slotStartHour = 16; // 4 PM

        slotStartTime.setHours(slotStartHour, 0, 0, 0);

        const isInFuture = slotStartTime > now;


        return isProviderAvailable && !isAlreadyBooked && isInFuture;
    });

    res.status(200).json({ success: true, data: availableSlots });
});


export {
	getProviders,
	getProviderById,
	createProviderProfile,
	updateProviderProfile,
	deleteProviderProfile,
	getProviderAvailability,
    updateProviderAvailability, // <-- ADDED THIS
};