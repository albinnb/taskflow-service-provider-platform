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
const getServices = asyncHandler(async (req, res) => {

    // FIX: Resolve category slug to ID if present
    if (req.query.category) {
        const categoryDoc = await Category.findOne({ slug: req.query.category });
        if (categoryDoc) {
            req.query.category = categoryDoc._id; // Use ID for querying
        } else {
            // If category slug not found, we should probably return empty results or ignore
            // Let's force a non-matching query since the user asked for a specific non-existent category
            req.query.category = new mongoose.Types.ObjectId();
        }
    }

    // 1. Build the filter object first (only search and filter remain)
    const filterBuilder = new ApiFeatures(Service.find(), req.query)
        .search()
        .filter();
    // GEO-SEARCH REMOVAL: Removed .geoSearch()

    // Get the final merged filter object
    const finalFilter = filterBuilder.getQuery();

    // 2. Use standard count for non-geo queries (Geo-Search counting logic removed)
    const totalCount = await Service.countDocuments(finalFilter);

    // 3. Execute the main query using the final filter and remaining methods
    const features = new ApiFeatures(
        Service.find(finalFilter).populate('providerId', 'businessName ratingAvg'),
        // GEO-SEARCH REMOVAL: Removed 'location' from providerId populate fields
        req.query
    )
        .sort()
        .limitFields()
        .paginate();

    // Execute the query
    const services = await features.query.lean();

    res.status(200).json({
        success: true,
        count: services.length,
        total: totalCount,
        pagination: features.pagination,
        data: services,
    });
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
    // GEO-SEARCH REMOVAL: Removed injection of location from provider profile
    // req.body.location = provider.location;

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

export { getServices, getServiceById, createService, updateService, deleteService };