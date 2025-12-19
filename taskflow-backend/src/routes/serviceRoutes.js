import express from 'express';
import { body } from 'express-validator';
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

// Public routes for searching
router.get('/', getServices);
router.get('/:id', getServiceById);

// Protected routes (Provider/Admin only)
router.use(protect, authorize(['provider', 'admin']));

const serviceValidators = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().isMongoId().withMessage('Valid category ID is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('durationMinutes').isInt({ min: 10 }).withMessage('Duration must be at least 10 minutes'),
];

// POST /api/services - Create a new service
router.post('/', serviceValidators, createService);

// Routes requiring specific service ID
router
  .route('/:id')
  .put(serviceValidators, updateService) // Update a service (Owner or Admin)
  .delete(deleteService); // Delete a service (Owner or Admin)

// ------------------------------------------------------------------
// ADMIN ONLY Service Approval Routes
// ------------------------------------------------------------------
router.get('/admin/pending', authorize('admin'), getPendingServices);
router.put('/admin/:id/status', authorize('admin'), updateServiceStatus);

export default router;