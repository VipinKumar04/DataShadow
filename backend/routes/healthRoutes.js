const express = require('express');

const router = express.Router();

/**
 * GET /api/health
 * Basic health-check endpoint to confirm that the backend server is running.
 * Note: Confirms server status only; does not check external AI services.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok'
  });
});

module.exports = router;
