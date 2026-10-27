/**
 * Centralized error-handling middleware.
 * Formats all errors to conform to the API Contract v1 schema.
 * Never exposes stack traces, API keys, or raw provider errors to clients.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Handle JSON syntax parsing errors from express.json()
  if (
    err instanceof SyntaxError &&
    (err.status === 400 || err.statusCode === 400) &&
    'body' in err
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body cannot be parsed as JSON.'
      }
    });
  }

  // Handle request payload exceeding body parser limit (400 KB)
  if (
    err.status === 413 ||
    err.statusCode === 413 ||
    err.type === 'entity.too.large'
  ) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'REQUEST_TOO_LARGE',
        message: 'Request body exceeds the 400 KB limit.'
      }
    });
  }

  // Handle custom API errors with specific status and code
  if (err.statusCode && err.code) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message || 'An error occurred processing the request.'
      }
    });
  }

  // Fallback: unexpected server errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    }
  });
}

module.exports = errorHandler;
