import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendServiceDeletedNotification } from '../services/emailService.js';
import mongoose from 'mongoose';

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

/**
 * @route   GET /api/admin/services
 * @desc    Get ALL services from ALL providers
 * @access  Private/Admin
 */
export const getAllServices = asyncHandler(async (req, res) => {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    // Optional Search/Filter
    const keyword = req.query.keyword
        ? {
            $or: [
                { title: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } }
            ]
        }
        : {};

    const count = await Service.countDocuments({ ...keyword });
    const services = await Service.find({ ...keyword })
        .populate('providerId', 'businessName email phone')
        .populate('category', 'name')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: services,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

/**
 * @route   GET /api/admin/logs
 * @desc    Get Admin Activity Logs
 * @access  Private/Admin
 * */
export const getActivityLogs = asyncHandler(async (req, res) => {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    const count = await ActivityLog.countDocuments({});
    const logs = await ActivityLog.find({})
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        success: true,
        data: logs,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

/**
 * @route   DELETE /api/admin/services/:id
 * @desc    Admin delete any service
 * @access  Private/Admin
 */
export const deleteService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id).populate('providerId'); // Populate to get provider details directly?
    // providerId in Service is ref to Provider. Provider has userId.

    if (!service) {
        res.status(404);
        throw new Error('Service not found');
    }

    // Log the action
    await ActivityLog.create({
        adminId: req.user.id,
        action: 'SERVICE_DELETED',
        targetId: service._id,
        details: `Deleted service "${service.title}" from provider "${service.providerId?.businessName}"`
    });

    // Notify the provider
    if (service.providerId?.userId) {
        // Need to fetch the User object for email
        const providerUser = await User.findById(service.providerId.userId);
        if (providerUser) {
            await sendServiceDeletedNotification(providerUser, service.title);
        }
    }

    await service.deleteOne();

    res.json({ success: true, message: 'Service removed by Admin' });
});

/**
 * @route   GET /api/admin/bookings
 * @desc    Get ALL bookings with filtering
 * @access  Private/Admin
 */
export const getAllBookings = asyncHandler(async (req, res) => {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    let query = {};

    // Filter by Date (Temporal Filter)
    if (req.query.date) {
        const date = new Date(req.query.date);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        query.scheduledAt = {
            $gte: date,
            $lt: nextDay
        };
    }

    // Filter by Status
    if (req.query.status) {
        query.status = req.query.status;
    }

    // Filter by Provider (Revenue Details)
    if (req.query.providerId) {
        query.providerId = req.query.providerId;
    }

    const count = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
        .populate('userId', 'name email mobile')
        .populate('providerId', 'businessName mobile')
        .populate('serviceId', 'title')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ scheduledAt: -1 });

    res.json({
        success: true,
        data: bookings,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

/**
 * @route   PUT /api/admin/bookings/:id/cancel
 * @desc    Admin cancel any booking
 * @access  Private/Admin
 */


/**
 * @route   GET /api/admin/revenue
 * @desc    Get Revenue Overview per provider
 * @access  Private/Admin
 */
export const getRevenueOverview = asyncHandler(async (req, res) => {
    // Aggregation to group total earnings by provider
    const revenueData = await Booking.aggregate([
        {
            $match: {
                status: 'completed',
                paymentStatus: 'paid'
            }
        },
        {
            $group: {
                _id: '$providerId',
                totalRevenue: { $sum: '$totalPrice' },
                completedBookings: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'providers',
                localField: '_id',
                foreignField: '_id',
                as: 'providerDetails'
            }
        },
        {
            $unwind: '$providerDetails'
        },
        {
            $project: {
                _id: 1,
                totalRevenue: 1,
                completedBookings: 1,
                providerName: '$providerDetails.businessName',
                providerEmail: '$providerDetails.email'
            }
        },
        { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
        success: true,
        data: revenueData
    });
});
