import express from 'express';
import {
  getProviders,
  getProviderById,
  createProviderProfile,
  updateProviderProfile,
  deleteProviderProfile,
  getProviderAvailability,
  updateProviderAvailability, // <-- NEW IMPORT
} from '../controllers/providerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

// ------------------------------------------------------------------
// PUBLIC ROUTES (Accessible by everyone)
// ------------------------------------------------------------------

// GET /api/providers/:id/availability - Get current day's availability for display
router.get('/:id/availability', getProviderAvailability); 

// GET /api/providers - Get all providers
router.get('/', getProviders);

// GET /api/providers/:id - Get a specific provider profile
router.get('/:id', getProviderById);


// ------------------------------------------------------------------
// PROTECTED ROUTES (Requires user to be logged in)
// ------------------------------------------------------------------
router.use(protect);

// PUT /api/providers/availability - Update the logged-in provider's weekly availability
router.put(
    '/availability',
    authorize('provider'), // ONLY the Provider role can use this
    updateProviderAvailability // <-- NEW CONTROLLER FUNCTION
);


// POST /api/providers - Create/Complete Provider Onboarding (must be 'provider' role)
router.post(
  '/',
  authorize('provider'),
  [
    body('businessName').notEmpty().withMessage('Business name is required'),
    body('description').isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
    body('address.line').notEmpty().withMessage('Address line is required'),
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Location coordinates [lng, lat] are required'),
  ],
  createProviderProfile
);

// PUT /api/providers/:id - Update provider profile (Owner or Admin)
router.put(
  '/:id',
  authorize(['provider', 'admin']),
  updateProviderProfile
);

// DELETE /api/providers/:id - Delete provider profile (Admin only, potentially dangerous)
router.delete('/:id', authorize('admin'), deleteProviderProfile);

export default router;