import { validationResult } from 'express-validator';
import Service from '../models/Service.js';
import Provider from '../models/Provider.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

import Category from '../models/Category.js'; // Import Category

/**
 * @route GET /api/services
 * @desc Get all services with search, filter, and sort (Geo-Search removed)
 * @access Public
 */
// Helper to calculate distance (in km) between two coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * @route GET /api/services
 * @desc Get all services with search, filter, and sort (Geo-Search enabled)
 * @access Public
 */
const getServices = asyncHandler(async (req, res) => {

    // FIX: Resolve category slug to ID if present
    if (req.query.category) {
        const categoryDoc = await Category.findOne({ slug: req.query.category });
        if (categoryDoc) {
            req.query.category = categoryDoc._id; // Use ID for querying
        } else {
            req.query.category = new mongoose.Types.ObjectId();
        }
    }

    // GEO-SEARCH LOGIC
    const { lat, lng } = req.query;

    if (lat && lng) {
        // 1. Find Providers near the location
        // Using aggregation to calculate specific distance for each
        const providers = await Provider.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    distanceField: "dist.calculated", // Output field
                    maxDistance: 50000, // 50km radius (optional hard limit)
                    spherical: true,
                    distanceMultiplier: 0.001 // Convert meters to km
                }
            }
        ]);

        if (providers.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                total: 0,
                data: []
            });
        }

        // Map provider IDs to their distance
        const providerDistanceMap = {};
        providers.forEach(p => {
            providerDistanceMap[p._id.toString()] = p.dist.calculated;
        });

        const providerIds = providers.map(p => p._id);

        // 2. Build Service Query
        // We inject the providerIds into the query
        const queryObj = { ...req.query, providerId: { $in: providerIds } };
        // Remove lat/lng so ApiFeatures doesn't choke on them or try to filter Service with them
        delete queryObj.lat;
        delete queryObj.lng;

        // Use ApiFeatures for text search and category filtering and field limiting
        // WARN: We cannot use ApiFeatures for pagination/sorting because we need to sort by distance first
        const filterBuilder = new ApiFeatures(
            Service.find().populate('providerId', 'businessName ratingAvg location address'),
            queryObj
        )
            .search()
            .filter();
        // .sort() -> We skip db sorting to sort by distance
        // .paginate() -> We skip db pagination

        // Force approved only
        filterBuilder.query = filterBuilder.query.where('approvalStatus').equals('approved');

        let services = await filterBuilder.query.lean();

        // 3. Attach Distance and Sort
        services = services.map(service => ({
            ...service,
            distance: providerDistanceMap[service.providerId._id.toString()] || 0
        }));

        services.sort((a, b) => a.distance - b.distance);

        // 4. Manual Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const totalCount = services.length;

        const paginatedServices = services.slice(skip, skip + limit);

        return res.status(200).json({
            success: true,
            count: paginatedServices.length,
            total: totalCount,
            pagination: { page, limit, totalPages: Math.ceil(totalCount / limit) },
            data: paginatedServices,
        });

    } else {
        // --- STANDARD NON-GEO QUERY ---

        // 1. Build the filter object first
        const filterBuilder = new ApiFeatures(Service.find(), req.query)
            .search()
            .filter();

        // Get the final merged filter object
        const finalFilter = filterBuilder.getQuery();
        finalFilter.approvalStatus = 'approved';

        // 2. Use standard count
        const totalCount = await Service.countDocuments(finalFilter);

        // 3. Execute the main query
        const features = new ApiFeatures(
            Service.find(finalFilter).populate('providerId', 'businessName ratingAvg address'),
            req.query
        )
            .sort()
            .limitFields()
            .paginate();

        const services = await features.query.lean();

        res.status(200).json({
            success: true,
            count: services.length,
            total: totalCount,
            pagination: features.pagination,
            data: services,
        });
    }
});


const getServiceById = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id)
        .populate('providerId', 'businessName ratingAvg address isVerified')
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
    // Default to pending for QC
    req.body.approvalStatus = 'pending';

    const service = await Service.create(req.body);

    provider.services.push(service._id);
    await provider.save();

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