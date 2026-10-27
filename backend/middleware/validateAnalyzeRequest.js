/**
 * Middleware to validate POST /api/analyze requests according to API Contract v1.
 *
 * Rules:
 * - Content-Type must be application/json (415 UNSUPPORTED_MEDIA_TYPE)
 * - Body must be a JSON object (400 INVALID_INPUT)
 * - Exactly policyText and language are allowed (400 INVALID_INPUT)
 * - policyText must be non-empty string after trim (400 INVALID_INPUT)
 * - policyText length <= 50,000 (413 POLICY_TOO_LONG)
 * - language must be 'en' or 'hi' (422 UNSUPPORTED_LANGUAGE)
 * - Original policyText is preserved untouched
 */
function validateAnalyzeRequest(req, res, next) {
  // Check Content-Type header
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return res.status(415).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json.'
      }
    });
  }

  // Check request body is a non-null, non-array object
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Please provide valid privacy-policy text and a supported language.'
      }
    });
  }

  const keys = Object.keys(req.body);
  const allowedKeys = ['policyText', 'language'];

  // Check for unknown properties (the object must contain ONLY policyText and language)
  const hasUnknownKeys = keys.some((key) => !allowedKeys.includes(key));
  if (hasUnknownKeys) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Please provide valid privacy-policy text and a supported language.'
      }
    });
  }

  const { policyText, language } = req.body;

  // Validate presence and types
  if (typeof policyText !== 'string' || typeof language !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Please provide valid privacy-policy text and a supported language.'
      }
    });
  }

  // Validate non-empty / non-whitespace-only policyText
  if (policyText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Please provide valid privacy-policy text and a supported language.'
      }
    });
  }

  // Validate policyText length (max 50,000 JavaScript string code units)
  if (policyText.length > 50000) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'POLICY_TOO_LONG',
        message: 'The policy text must not exceed 50000 characters.'
      }
    });
  }

  // Validate language code
  if (language !== 'en' && language !== 'hi') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_LANGUAGE',
        message: "Language must be either 'en' or 'hi'."
      }
    });
  }

  // Proceed without mutating policyText
  next();
}

module.exports = validateAnalyzeRequest;
