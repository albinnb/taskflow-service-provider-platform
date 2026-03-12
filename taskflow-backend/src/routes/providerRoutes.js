import express from 'express';
import Joi from 'joi';
import validate from '../middleware/validate.js';
import {
  getProviders,
  getProviderById,
  createProviderProfile,
  updateProviderProfile,
  deleteProviderProfile,
  updateProviderAvailability,
  getProviderAnalytics,
} from '../controllers/providerController.js';
import { getProviderAvailability } from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const providerProfileSchema = {
    body: Joi.object({
        businessName: Joi.string().required().messages({
            'any.required': 'Business name is required',
            'string.empty': 'Business name is required'
        }),
        description: Joi.string().min(50).required().messages({
            'string.min': 'Description must be at least 50 characters',
            'any.required': 'Description is required'
        }),
        categories: Joi.array().items(Joi.string()).optional(),
        address: Joi.object().required().messages({
            'any.required': 'Address is required'
        }),
        location: Joi.object({
            coordinates: Joi.array().length(2).items(Joi.number()).required().messages({
                'array.length': 'Location coordinates [lng, lat] are required',
                'any.required': 'Location coordinates are required'
            })
        }).unknown(true).required(),
        phone: Joi.string().optional()
    })
};

// ------------------------------------------------------------------
// PUBLIC ROUTES (Accessible by everyone)
// ------------------------------------------------------------------

// GET /api/providers/:id/availability - Get dynamic time slots for a given date
router.get('/:id/availability', getProviderAvailability);

// GET /api/providers - Get all providers
router.get('/', getProviders);

// GET /api/providers/:id - Get a specific provider profile
router.get('/:id', getProviderById);


// ------------------------------------------------------------------
// PROTECTED ROUTES (Requires user to be logged in)
// ------------------------------------------------------------------
router.use(protect);

// GET /api/providers/:id/analytics - Get Provider Analytics
router.get('/:id/analytics', authorize('provider'), getProviderAnalytics);

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
  validate(providerProfileSchema),
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