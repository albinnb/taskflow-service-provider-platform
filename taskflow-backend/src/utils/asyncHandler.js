/**
 * @desc Simple wrapper utility to handle async errors in controllers without repetitive try/catch blocks.
 * Wraps the async function (fn) and passes any error to the Express error handler (next).
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;