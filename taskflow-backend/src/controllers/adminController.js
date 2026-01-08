import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get system-wide statistics for the Admin Dashboard
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Total Users
    const totalUsers = await User.countDocuments({});

    // 2. Total Services
    const totalServices = await Service.countDocuments({});

    // 3. Pending Services (Awaiting Approval)
    const pendingServicesCount = await Service.countDocuments({ approvalStatus: 'pending' });

    // 4. Total Revenue (Sum of completed bookings)
    // We assume 'totalPrice' is stored in the Booking model
    const revenueStats = await Booking.aggregate([
        {
            $match: {
                status: 'completed',
                // paymentStatus: 'paid' // Optional: strictly check payment status too
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' }
            }
        }
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            totalServices,
            pendingServicesCount,
            totalRevenue
        }
    });
});
