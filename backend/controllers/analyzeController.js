/**
 * Controller for POST /api/analyze.
 * In Phase 2, this controller provides a temporary response confirming that request
 * validation succeeded, without fabricating an analysis or invoking external AI services.
 */
function analyzePolicy(req, res) {
  return res.status(503).json({
    success: false,
    error: {
      code: 'AI_PROVIDER_UNAVAILABLE',
      message: 'AI analysis service is temporarily unavailable. Request validation succeeded; AI integration will be completed in Phase 3.'
    }
  });
}

module.exports = {
  analyzePolicy
};
