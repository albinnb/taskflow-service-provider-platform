import rateLimit from 'express-rate-limit';

/**
 * @desc Rate limiting middleware to prevent brute force attacks and abuse.
 * Limits each IP to 100 requests per 15 minutes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message:
    'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the headers
  legacyHeaders: false, // Disable X-Rate-Limit-* headers
});

/**
 * @desc Stricter rate limiting for authentication routes (login/register).
 * Limits each IP to 5 requests per 10 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 login/register requests per windowMs
  message:
    'Too many authentication attempts from this IP, please try again after 10 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

export { apiLimiter, authLimiter };