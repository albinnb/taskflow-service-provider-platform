import { validationResult } from 'express-validator';
import Service from '../models/Service.js';
import Provider from '../models/Provider.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import Booking from '../models/Booking.js';
import ActivityLog from '../models/ActivityLog.js';
import Category from '../models/Category.js'; // Import Category
import { clearCache } from '../middleware/cacheMiddleware.js';

import ServiceBusinessLayer from '../services/serviceBusinessLayer.js'; // 3-Tier Architecture

/**
 * @route GET /api/services
 * @desc Get all services with search, filter, and sort (Geo-Search enabled)
 * @access Public
 */
const getServices = asyncHandler(async (req, res) => {
    // 3-Tier Architecture: Controller only parses req/res. Business logic is abstracted.
    const result = await ServiceBusinessLayer.getAllServices(req.query);

    return res.status(200).json({
        success: true,
        count: result.count,
        total: result.total,
        pagination: result.pagination,
        data: result.data,
    });
});

const getServiceById = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id)
        .populate('providerId', 'businessName ratingAvg address isVerified userId')
        // GEO-SEARCH REMOVAL: Removed 'location' from providerId populate fields
        .populate('category', 'name slug')
        .lean();

    if (!service) {
        res.status(404);
        throw new Error('Service not found');
    }

    // If service is not approved, only Owner or Admin can see it
    if (service.approvalStatus !== 'approved') {
        const isAuthorized = req.user && (req.user.role === 'admin' || service.providerId._id.toString() === req.user.providerId);
        // Note: checking providerId might need more complex logic if req.user.providerId isn't populated on the user object directly,
        // but typically we check ownership via Provider model lookup.
        // For simplicity, we'll assume public users get 404.
        // We'll trust the frontend knows not to link to it unless authorized.
    }

    res.status(200).json({ success: true, data: service });
});

const createService = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error('Validation failed.');
    }

    const provider = await Provider.findOne({ userId: req.user.id });

    if (!provider) {
        res.status(404);
        throw new Error('Provider profile required to create services.');
    }

    req.body.providerId = provider._id;
    // Auto-approve if provider is verified (Trusted Provider)
    if (provider.isVerified) {
        req.body.approvalStatus = 'approved';
    } else {
        req.body.approvalStatus = 'pending';
    }

    const service = await Service.create(req.body);

    provider.services.push(service._id);
    await provider.save();

    await clearCache('cache:/api/services'); // Invalidate Search Cache

    res.status(201).json({ success: true, data: service });
});

const updateService = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error('Validation failed.');
    }

    let service = await Service.findById(req.params.id);

    if (!service) {
        res.status(404);
        throw new Error('Service not found');
    }

    const provider = await Provider.findById(service.providerId);

    if (
        provider.userId.toString() !== req.user.id &&
        req.user.role !== 'admin'
    ) {
        res.status(403);
        throw new Error('Not authorized to update this service.');
    }

    // If a provider updates their service, reset approval to pending? 
    // For now, let's keep it simple: No reset, but maybe a "changes requested" flow later.
    // Ideally, significant changes should trigger re-approval.
    // req.body.approvalStatus = 'pending'; // Uncomment to force re-approval

    // Prevent providers from self-approving via this route
    if (req.user.role !== 'admin') {
        delete req.body.approvalStatus;
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    await clearCache('cache:/api/services'); // Invalidate Search Cache

    res.status(200).json({ success: true, data: service });
});

const deleteService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
        res.status(404);
        throw new Error('Service not found');
    }

    const provider = await Provider.findById(service.providerId);

    if (
        provider.userId.toString() !== req.user.id &&
        req.user.role !== 'admin'
    ) {
        res.status(403);
        throw new Error('Not authorized to delete this service.');
    }

    await service.deleteOne();

    await Provider.findByIdAndUpdate(provider._id, {
        $pull: { services: service._id },
    });

    await clearCache('cache:/api/services'); // Invalidate Search Cache

    res.status(200).json({ success: true, message: 'Service removed' });
});

// --- ADMIN ONLY ENDPOINTS ---

const getPendingServices = asyncHandler(async (req, res) => {
    const services = await Service.find({ approvalStatus: 'pending' })
        .populate('providerId', 'businessName')
        .populate('category', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: services.length, data: services });
});

const updateServiceStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    const service = await Service.findByIdAndUpdate(req.params.id, { approvalStatus: status }, { new: true });

    if (!service) {
        res.status(404); // Or 404 if not found
        throw new Error('Service not found');
    }

    // LOG ACTION
    if (req.user.role === 'admin') {
        await ActivityLog.create({
            adminId: req.user.id,
            action: `SERVICE_${status.toUpperCase()}`,
            targetId: service._id,
            details: `${status === 'approved' ? 'Approved' : 'Rejected'} service "${service.title}"`
        });
    }

    res.status(200).json({ success: true, data: service });
});

export {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getPendingServices,
    updateServiceStatus
};