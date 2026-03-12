import { Redis } from 'ioredis';
import logger from './logger.js';
import dotenv from 'dotenv';
dotenv.config();

// Default to local redis if REDIS_URL not provided
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3) {
            logger.warn('Failed to connect to Redis after 3 retries. Disabling cache.');
            return null; // Stop retrying, fail silently to not block API
        }
        return Math.min(times * 100, 3000); // Backoff
    }
});

redisClient.on('connect', () => {
    logger.info('Connected to Redis');
});

redisClient.on('error', (err) => {
    logger.error(`Redis Error: ${err.message}`);
});

export default redisClient;
