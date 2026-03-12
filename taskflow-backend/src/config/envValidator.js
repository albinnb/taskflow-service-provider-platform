import logger from '../utils/logger.js';

/**
 * Validates that all critical environment variables are present before booting up.
 * If any are missing, logs a fatal error and terminates the Node process.
 */
export const validateEnv = () => {
    const requiredVars = [
        'NODE_ENV',
        'PORT',
        'MONGO_URI',
        'JWT_SECRET',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'RAZORPAY_WEBHOOK_SECRET'
    ];

    const missingVars = requiredVars.filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
        logger.error(`FATAL ERROR: Server cannot start. Missing required environment variables: ${missingVars.join(', ')}`);
        logger.error(`Check your .env file. See .env.example for required keys.`);
        process.exit(1); // Exit boldly. Failing fast is secure.
    }

    logger.info('Environment variables validated successfully.');
};
