const { analyzePolicy } = require('../services/aiAnalysisService');

/**
 * Controller for POST /api/analyze.
 * Invokes the AI analysis service and maps results or errors to the canonical API contract.
 */
async function analyzePolicyController(req, res) {
  const { policyText, language } = req.body;

  try {
    const analysis = await analyzePolicy({ policyText, language });
    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (err) {
    const code = err && err.code;

    if (code === 'AI_TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: {
          code: 'AI_TIMEOUT',
          message: 'Analysis took too long. Please try again.'
        }
      });
    }

    if (code === 'AI_INVALID_RESPONSE') {
      return res.status(502).json({
        success: false,
        error: {
          code: 'AI_INVALID_RESPONSE',
          message: 'The model response could not be validated. Please try again.'
        }
      });
    }

    if (code === 'AI_PROVIDER_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_PROVIDER_UNAVAILABLE',
          message: 'Analysis is temporarily unavailable. Please try again.'
        }
      });
    }

    if (code === 'AI_INVALID_REQUEST') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Please provide valid privacy-policy text and a supported language.'
        }
      });
    }

    // AI_UNEXPECTED_ERROR or any unexpected failure maps to 500 INTERNAL_SERVER_ERROR
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  }
}

module.exports = {
  analyzePolicy: analyzePolicyController
};
