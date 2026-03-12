import Joi from 'joi';
import logger from '../utils/logger.js';

/**
 * Generic validation middleware using Joi
 * @param {Object} schema - Joi schema object (e.g., { body: Joi.object(), query: Joi.object() })
 */
const validate = (schema) => (req, res, next) => {
    const validSchema = {};
    const requestPayload = {};

    // Only pick 'body', 'query', or 'params' from the provided schema mapping
    ['body', 'query', 'params'].forEach((key) => {
        if (schema[key]) {
            validSchema[key] = schema[key];
            requestPayload[key] = req[key];
        }
    });

    const joiSchema = Joi.object(validSchema);
    
    // Validate the request payload against the schema
    const { value, error } = joiSchema.validate(requestPayload, {
        abortEarly: false, // Return all errors, not just the first one
        allowUnknown: true, // Allow unknown headers/props gracefully by default
        stripUnknown: true // Remove unknown props from the validated object
    });

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        
        // Log validation failures as warnings (client error)
        logger.warn(`Validation Error on ${req.method} ${req.originalUrl}: ${errorMessage}`);
        
        res.status(400);
        return next(new Error(`Validation Error: ${errorMessage}`));
    }

    // Replace request payload with the validated (and potentially typed/stripped) object
    Object.assign(req, value);
    return next();
};

export default validate;
