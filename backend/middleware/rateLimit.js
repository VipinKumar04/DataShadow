const rateLimit = require('express-rate-limit');

/**
 * Creates rate limiter middleware for analysis endpoints.
 * Default: 10 requests per minute per IP according to the v1 contract.
 *
 * @param {object} [options] - Custom options for testing or overriding defaults.
 * @returns {Function} Express rate limit middleware.
 */
function createAnalyzeRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000,
    max: options.max !== undefined ? options.max : 10,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    // Skip during general test execution so validation tests do not artificially hit 429
    skip: options.skip !== undefined ? options.skip : () => process.env.NODE_ENV === 'test',
    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfter = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : 60;

      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many analysis requests. Please try again later.'
        }
      });
    },
    ...options
  });
}

const analyzeRateLimiter = createAnalyzeRateLimiter();

module.exports = {
  analyzeRateLimiter,
  createAnalyzeRateLimiter
};
