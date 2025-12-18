/**
 * @desc Centralized error handler middleware.
 * It catches errors thrown in controllers, sets a proper HTTP status,
 * and sends a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  // Check if a status code was already set, otherwise default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Send the error message, including stack trace only in development
  res.json({
    message: err.message,
    // Provide stack trace in development for debugging
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// Middleware to handle routes that don't exist
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the error handler middleware
};

export { errorHandler, notFound };