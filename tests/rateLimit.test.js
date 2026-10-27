const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const { createAnalyzeRateLimiter } = require('../backend/middleware/rateLimit');

describe('Rate Limiting - POST /api/analyze', () => {
  let server;
  let baseUrl;

  before((_, done) => {
    const testApp = express();
    testApp.use(express.json({ limit: '400kb' }));

    // Deterministic test limiter: max 2 requests per window with skip disabled
    const testLimiter = createAnalyzeRateLimiter({
      max: 2,
      windowMs: 60 * 1000,
      skip: () => false
    });

    testApp.post('/api/analyze', testLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });

    server = testApp.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  test('allows requests within limit, then returns 429 RATE_LIMITED with Retry-After header', async () => {
    // Request 1: Allowed
    const res1 = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    assert.strictEqual(res1.status, 200);

    // Request 2: Allowed
    const res2 = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    assert.strictEqual(res2.status, 200);

    // Request 3: Exceeds limit -> 429
    const res3 = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    assert.strictEqual(res3.status, 429);

    const retryAfter = res3.headers.get('retry-after');
    assert.ok(retryAfter, 'Retry-After header must be set');
    assert.ok(Number(retryAfter) > 0, 'Retry-After must be greater than zero');

    const data = await res3.json();
    assert.deepStrictEqual(data, {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many analysis requests. Please try again later.'
      }
    });
  });
});
