import express from 'express';
import Joi from 'joi';
import validate from '../middleware/validate.js';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getPendingServices,
  updateServiceStatus,
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const serviceSchema = {
    body: Joi.object({
        title: Joi.string().required().messages({'any.required': 'Title is required'}),
        description: Joi.string().required().messages({'any.required': 'Description is required'}),
        category: Joi.string().hex().length(24).required().messages({'any.required': 'Valid category ID is required'}),
        price: Joi.number().min(0).required().messages({'number.min': 'Price must be a positive number'}),
        durationMinutes: Joi.number().integer().min(10).required().messages({'number.min': 'Duration must be at least 10 minutes'}),
        images: Joi.array().items(Joi.object({ url: Joi.string().uri() })).optional(),
        // Optional active status flag
        isActive: Joi.boolean().optional()
    })
};

// Public routes for searching
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

router.get('/', cacheMiddleware(300), getServices);
router.get('/:id', getServiceById);

// Protected routes (Provider/Admin only)
router.use(protect, authorize(['provider', 'admin']));

// POST /api/services - Create a new service
router.post('/', validate(serviceSchema), createService);

// Routes requiring specific service ID
router
  .route('/:id')
  .put(validate(serviceSchema), updateService) // Update a service (Owner or Admin)
  .delete(deleteService); // Delete a service (Owner or Admin)

// ------------------------------------------------------------------
// ADMIN ONLY Service Approval Routes
// ------------------------------------------------------------------
router.get('/admin/pending', authorize('admin'), getPendingServices);
router.put('/admin/:id/status', authorize('admin'), updateServiceStatus);

export default router;