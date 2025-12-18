import express from 'express';
import {
  upsertMyAvailability,
  getMyAvailability,
  getProviderAvailability,
} from '../controllers/availabilityController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Protected routes (provider-only)
// ---------------------------------------------------------------------------

// GET /api/availability/me - Get logged-in provider's schedule
// Must come BEFORE /:providerId or "me" will be treated as an ID
router.get('/me', protect, authorize('provider'), getMyAvailability);

// PUT /api/availability - Upsert logged-in provider's schedule
router.put('/', protect, authorize('provider'), upsertMyAvailability);

// ---------------------------------------------------------------------------
// Public routes (for customers)
// ---------------------------------------------------------------------------

// GET /api/availability/:providerId - Get a specific provider's schedule
router.get('/:providerId', getProviderAvailability);

export default router;


