const express = require('express');
const { analyzeRateLimiter } = require('../middleware/rateLimit');
const validateAnalyzeRequest = require('../middleware/validateAnalyzeRequest');
const { analyzePolicy } = require('../controllers/analyzeController');

const router = express.Router();

/**
 * POST /api/analyze
 * Rate limited to 10 requests per minute per IP.
 * Validates request payload and forwards to analyze controller.
 */
router.post(
  '/analyze',
  analyzeRateLimiter,
  validateAnalyzeRequest,
  analyzePolicy
);

module.exports = router;
