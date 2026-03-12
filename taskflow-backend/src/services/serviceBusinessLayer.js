import mongoose from 'mongoose';
import Service from '../models/Service.js';
import Provider from '../models/Provider.js';
import Category from '../models/Category.js';
import ApiFeatures from '../utils/ApiFeatures.js';
import GeoSearchService from './geoSearchService.js';

class ServiceBusinessLayer {
    /**
     * Get all services based on complex query parameters including GeoSearch
     * @param {Object} queryParams - req.query object
     * @returns {Promise<Object>} Object containing count, total, pagination, and data
     */
    static async getAllServices(queryParams) {
        // Create a deep copy to avoid mutating the original request query object
        const queryOpts = { ...queryParams };

        if (queryOpts.category) {
            if (!mongoose.Types.ObjectId.isValid(queryOpts.category)) {
                const categoryDoc = await Category.findOne({ slug: queryOpts.category });
                queryOpts.category = categoryDoc ? categoryDoc._id.toString() : new mongoose.Types.ObjectId().toString();
            }
        }

        // 1. EXTRACT PROVIDER FILTERS
        let baseProviderFilter = {};
        let hasProviderFilter = false;

        if (queryOpts.isVerified === 'true') {
            baseProviderFilter.isVerified = true;
            delete queryOpts.isVerified;
            hasProviderFilter = true;
        }
        if (queryOpts.ratingAvg && queryOpts.ratingAvg.gte) {
            baseProviderFilter.ratingAvg = { $gte: Number(queryOpts.ratingAvg.gte) };
            delete queryOpts.ratingAvg;
            hasProviderFilter = true;
        }

        let validProviderIds = null;
        if (hasProviderFilter) {
            const validProviders = await Provider.find(baseProviderFilter).select('_id');
            validProviderIds = validProviders.map(p => p._id.toString());
        }

        // Extract sort parameter early to process in-memory sorting if required
        const sortParam = queryOpts.sort;
        if (sortParam && sortParam.includes('ratingAvg')) {
            delete queryOpts.sort;
        }

        const { lat, lng } = queryOpts;

        // --- GEO-SEARCH BRANCH ---
        if (lat && lng) {
            const providers = await GeoSearchService.findProvidersNearLocation(lat, lng);

            if (providers.length === 0) {
                return { count: 0, total: 0, data: [], pagination: { page: 1, limit: 20, totalPages: 0 } };
            }

            const providerDistanceMap = {};
            providers.forEach(p => {
                providerDistanceMap[p._id.toString()] = p.dist.calculated;
            });

            const providerIds = providers.map(p => p._id);
            let finalProviderIds = providerIds;
            if (validProviderIds !== null) {
                finalProviderIds = providerIds.filter(id => validProviderIds.includes(id.toString()));
            }

            const queryObj = { ...queryOpts, providerId: { $in: finalProviderIds } };
            delete queryObj.lat;
            delete queryObj.lng;

            let searchFilter = { ...queryObj };
            const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
            excludedFields.forEach(el => delete searchFilter[el]);

            let projection = {};

            if (queryObj.keyword) {
                const keyword = queryObj.keyword;
                let keywordProviderQuery = { businessName: { $regex: keyword, $options: 'i' } };
                if (hasProviderFilter) { keywordProviderQuery = { ...keywordProviderQuery, ...baseProviderFilter }; }

                const providersByName = await Provider.find(keywordProviderQuery).select('_id');
                const matchedProviderIdsByKeyword = providersByName.map(p => p._id);

                searchFilter.$or = [
                    { $text: { $search: keyword }, providerId: { $in: finalProviderIds } },
                    { providerId: { $in: matchedProviderIdsByKeyword } }
                ];

                delete queryObj.keyword;
                delete searchFilter.keyword;
                projection = { score: { $meta: "textScore" } };
            }

            const filterBuilder = new ApiFeatures(
                Service.find(searchFilter, projection).populate('providerId', 'businessName ratingAvg location address userId'),
                queryObj
            ).filter();

            filterBuilder.query = filterBuilder.query.where('approvalStatus').equals('approved');
            let services = await filterBuilder.query.lean();

            services = services.map(service => ({
                ...service,
                distance: providerDistanceMap[service.providerId._id.toString()] || 0
            }));

            services.sort((a, b) => a.distance - b.distance);

            const page = parseInt(queryOpts.page, 10) || 1;
            const limit = parseInt(queryOpts.limit, 10) || 20;
            const skip = (page - 1) * limit;
            const totalCount = services.length;
            const paginatedServices = services.slice(skip, skip + limit);

            return {
                count: paginatedServices.length,
                total: totalCount,
                pagination: { page, limit, totalPages: Math.ceil(totalCount / limit) },
                data: paginatedServices,
            };

        } else {
            // --- STANDARD QUERY BRANCH ---
            let searchFilter = {};
            let projection = {};
            let isTextSearch = false;

            if (validProviderIds !== null) {
                searchFilter.providerId = { $in: validProviderIds };
            }

            if (queryOpts.keyword) {
                isTextSearch = true;
                const keyword = queryOpts.keyword;
                let keywordProviderQuery = { businessName: { $regex: keyword, $options: 'i' } };
                if (hasProviderFilter) { keywordProviderQuery = { ...keywordProviderQuery, ...baseProviderFilter }; }

                const providersByName = await Provider.find(keywordProviderQuery).select('_id');
                const matchedProviderIds = providersByName.map(p => p._id);

                const textMatch = { $text: { $search: keyword } };
                if (validProviderIds !== null) {
                    textMatch.providerId = { $in: validProviderIds };
                }

                searchFilter.$or = [
                    textMatch,
                    { providerId: { $in: matchedProviderIds } }
                ];

                projection = { score: { $meta: "textScore" } };
                delete queryOpts.keyword;
            }

            const filterBuilder = new ApiFeatures(Service.find(searchFilter, projection), queryOpts).filter();

            const finalFilter = { ...searchFilter, ...filterBuilder.getQuery() };
            finalFilter.approvalStatus = 'approved';

            const totalCount = await Service.countDocuments(finalFilter);

            let query = Service.find(finalFilter, projection)
                .populate('providerId', 'businessName ratingAvg address location userId');

            if (queryOpts.sort) {
                const sortBy = queryOpts.sort.split(',').join(' ');
                query = query.sort(sortBy);
            } else if (isTextSearch) {
                query = query.sort({ score: { $meta: "textScore" } });
            } else {
                query = query.sort('-createdAt');
            }

            const features = new ApiFeatures(query, queryOpts)
                .limitFields()
                .paginate();

            let services = await features.query.lean();

            if (sortParam && sortParam.includes('ratingAvg')) {
                const isDesc = sortParam.startsWith('-');
                services.sort((a, b) => {
                    const ratingA = a.providerId?.ratingAvg || 0;
                    const ratingB = b.providerId?.ratingAvg || 0;
                    return isDesc ? ratingB - ratingA : ratingA - ratingB;
                });
            }

            return {
                count: services.length,
                total: totalCount,
                pagination: features.pagination,
                data: services,
            };
        }
    }
}

export default ServiceBusinessLayer;
