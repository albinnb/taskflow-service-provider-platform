import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * @desc Rate limiting middleware to prevent brute force attacks and abuse.
 * Limits each IP to 100 requests per 15 minutes.
 *
 * In development, or for lightweight public data like categories,
 * we relax the limiter to avoid spurious 429s in the SPA.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message:
    'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the headers
  legacyHeaders: false, // Disable X-Rate-Limit-* headers
  skip: (req) => {
    // Skip rate limiting entirely in development to improve DX
    if (isDev) return true;

    // Also skip for public, cacheable endpoints like categories in production
    return req.path && req.path.startsWith('/categories');
  },
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