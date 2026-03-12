import redisClient from '../utils/redisClient.js';
import logger from '../utils/logger.js';

/**
 * Middleware to cache GET request responses
 * @param {number} ttlInSeconds - Time to live in seconds (default 300 = 5 min)
 */
export const cacheMiddleware = (ttlInSeconds = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // If Redis failed to connect completely, just bypass caching and proceed
        if (redisClient.status !== 'ready') {
            return next();
        }

        // Generate a deterministic cache key based on route path and sorted query params
        const key = `cache:${req.originalUrl || req.url}`; // req.originalUrl contains the full query string

        try {
            const cachedResponse = await redisClient.get(key);

            if (cachedResponse) {
                logger.info(`Cache Hit: ${key}`);
                return res.status(200).json(JSON.parse(cachedResponse));
            }

            // If not cached, we need to intercept the res.json method
            // so we can capture the output before sending it to the client
            const originalJson = res.json.bind(res);

            res.json = (body) => {
                // Determine if response is successful enough to cache (e.g. 200 OK)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        redisClient.setex(key, ttlInSeconds, JSON.stringify(body));
                    } catch (cacheErr) {
                        logger.error(`Failed to write to cache: ${cacheErr.message}`);
                    }
                }
                // Call original and send response to client
                return originalJson(body);
            };

            next();
        } catch (error) {
            logger.error(`Cache Middleware Error: ${error.message}`);
            // Non-critical error, let the request proceed without caching
            next();
        }
    };
};

/**
 * Utility to manually clear cache keys by prefix (Invalidation)
 * @param {string} prefix - e.g., "cache:/api/services"
 */
export const clearCache = async (prefix) => {
    if (redisClient.status !== 'ready') return;
    try {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.info(`Cleared ${keys.length} cache keys with prefix: ${prefix}`);
        }
    } catch (error) {
        logger.error(`Failed to clear cache: ${error.message}`);
    }
};
