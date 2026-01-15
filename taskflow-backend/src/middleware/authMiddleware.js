import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';


/**
 * @desc Middleware to protect routes by verifying JWT in the cookie.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // PRIORITY 1: Check the Authorization header FIRST (for frontend sending tokens via headers)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];


  }

  // PRIORITY 2: Fallback to cookies if no header token
  if (!token) {
    token = req.cookies.token;
    if (token) {

    }
  }

  if (!token) {

  }

  if (token) {
    try {



      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);



      // 3. Attach user data to the request object (excluding password)
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {


        res.status(401);
        throw new Error('Not authorized, user not found');
      }


      next(); // User authenticated, proceed to the route handler
    } catch (error) {
      console.error('Token verification error:', error.message);
      console.error('Full error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {


    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * @desc Middleware to authorize users based on their role(s).
 * @param {string[]} roles - Array of roles allowed to access the route (e.g., ['admin', 'provider']).
 */
const authorize = (roles = []) => {
  // Roles can be a single string or an array; normalize to array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Check if req.user exists (must be used after 'protect' middleware)
    if (!req.user) {
      res.status(401);
      throw new Error('User not authenticated for authorization check');
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      res.status(403); // Forbidden
      throw new Error(
        `User role (${req.user.role}) is not authorized to access this route`
      );
    }
    next();
  };
};

export { protect, authorize };