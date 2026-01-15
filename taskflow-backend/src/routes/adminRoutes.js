import express from 'express';
import {
    getDashboardStats,
    getAllServices,
    deleteService,
    getAllBookings,
    getRevenueOverview,
    getActivityLogs
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are for Admin only
router.use(protect, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get dashboard stats
// @access  Private/Admin
router.get('/dashboard', getDashboardStats);

router.route('/services')
    .get(getAllServices);

router.route('/services/:id')
    .delete(deleteService);

router.route('/bookings')
    .get(getAllBookings);

router.get('/revenue', getRevenueOverview);
router.get('/logs', getActivityLogs);

export default router;
