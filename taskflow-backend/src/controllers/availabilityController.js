import Provider from '../models/Provider.js';
import asyncHandler from '../utils/asyncHandler.js';

const VALID_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function isValidTimeString(str) {
  // Very simple "HH:mm" 24h format check
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(str);
}

function validateAvailabilityPayload({ days, bufferTime }) {
  if (!Array.isArray(days)) {
    throw new Error('`days` must be an array.');
  }

  const seenDays = new Set();

  for (const day of days) {
    const { dayOfWeek, isAvailable, slots } = day || {};

    if (!VALID_DAYS.includes(dayOfWeek)) {
      throw new Error(
        `Invalid dayOfWeek "${dayOfWeek}". Must be one of: ${VALID_DAYS.join(
          ', '
        )}`
      );
    }

    if (seenDays.has(dayOfWeek)) {
      throw new Error(
        `Duplicate dayOfWeek "${dayOfWeek}" in availability.days.`
      );
    }
    seenDays.add(dayOfWeek);

    if (typeof isAvailable !== 'boolean') {
      throw new Error(
        `isAvailable must be a boolean for day "${dayOfWeek}".`
      );
    }

    if (!isAvailable) {
      // If not available, we ignore/clear slots
      continue;
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      throw new Error(
        `At least one slot is required when isAvailable is true for "${dayOfWeek}".`
      );
    }

    for (const slot of slots) {
      const { startTime, endTime } = slot || {};
      if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
        throw new Error(
          `Invalid time format for day "${dayOfWeek}". Expected "HH:mm" for startTime and endTime.`
        );
      }
      if (startTime >= endTime) {
        throw new Error(
          `startTime must be before endTime for day "${dayOfWeek}" (got ${startTime} - ${endTime}).`
        );
      }
    }
  }

  if (bufferTime != null) {
    if (typeof bufferTime !== 'number' || bufferTime < 0) {
      throw new Error('bufferTime must be a non-negative number (minutes).');
    }
  }
}

/**
 * @route   PUT /api/availability
 * @desc    Save or update the logged‑in provider's weekly availability
 * @access  Private (role: provider)
 */
const upsertMyAvailability = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const { days, bufferTime } = req.body || {};

  // Validate structure
  try {
    validateAvailabilityPayload({ days, bufferTime });
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }

  // Find provider profile for this user
  const provider = await Provider.findOne({ userId });

  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found for this user.');
  }

  // Persist
  provider.availability = {
    days,
    // If client omits bufferTime, keep existing (or fallback to 0 if not set)
    bufferTime:
      typeof bufferTime === 'number'
        ? bufferTime
        : provider.availability?.bufferTime ?? 0,
  };

  await provider.save();

  res.status(200).json({
    success: true,
    message: 'Availability updated successfully.',
    data: provider.availability,
  });
});

/**
 * @route   GET /api/availability/me
 * @desc    Get the logged‑in provider's availability schedule
 * @access  Private (role: provider)
 */
const getMyAvailability = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  let provider;
  try {
    provider = await Provider.findOne({ userId }).select('availability');
  } catch (err) {
    // In case of any unexpected DB error, fall back to empty availability
    console.error('Error loading provider availability for user:', userId, err);
  }

  // If no provider profile yet, return a safe empty structure instead of 500
  if (!provider || !provider.availability) {
    return res.status(200).json({
      success: true,
      data: { days: [], bufferTime: 0 },
    });
  }

  res.status(200).json({
    success: true,
    data: provider.availability || { days: [], bufferTime: 0 },
  });
});

/**
 * @route   GET /api/availability/:providerId
 * @desc    Get a specific provider's availability schedule
 * @access  Public (for customers)
 */
const getProviderAvailability = asyncHandler(async (req, res) => {
  const { providerId } = req.params;

  const provider = await Provider.findById(providerId).select('availability');

  if (!provider) {
    res.status(404);
    throw new Error('Provider not found.');
  }

  res.status(200).json({
    success: true,
    data: provider.availability || { days: [], bufferTime: 0 },
  });
});

export { upsertMyAvailability, getMyAvailability, getProviderAvailability };


