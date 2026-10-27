process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../backend/app');

describe('POST /api/analyze - Validation and Error Handling', () => {
  let server;
  let baseUrl;

  before((_, done) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  // Helper to verify standard error shape
  function assertErrorResponse(data, expectedCode, expectedStatus, actualStatus) {
    assert.strictEqual(actualStatus, expectedStatus);
    assert.strictEqual(data.success, false);
    assert.ok(data.error, 'Response must have an error property');
    assert.strictEqual(data.error.code, expectedCode);
    assert.strictEqual(typeof data.error.message, 'string');
    assert.ok(data.error.message.length > 0);
    // Ensure no stack traces or secrets are exposed
    assert.strictEqual(data.stack, undefined);
    assert.strictEqual(data.error.stack, undefined);
  }

  test('valid English request passes validation and reaches temporary 503 response', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'We collect your email address to provide customer support.',
        language: 'en'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'AI_PROVIDER_UNAVAILABLE', 503, res.status);
    assert.match(data.error.message, /temporarily unavailable/i);
  });

  test('valid Hindi request passes validation and reaches temporary 503 response', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'हम आपकी गोपनीयता का सम्मान करते हैं।',
        language: 'hi'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'AI_PROVIDER_UNAVAILABLE', 503, res.status);
  });

  test('missing policyText returns 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'en'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('incorrectly typed policyText (number) returns 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 12345,
        language: 'en'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('empty policyText returns 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: '',
        language: 'en'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('whitespace-only policyText returns 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: '    \n\t   ',
        language: 'en'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('missing language returns 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'Valid policy text.'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('incorrectly typed language returns 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'Valid policy text.',
        language: 100
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('unsupported language code (e.g. "fr") returns 422 UNSUPPORTED_LANGUAGE', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'Valid policy text.',
        language: 'fr'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'UNSUPPORTED_LANGUAGE', 422, res.status);
    assert.strictEqual(data.error.message, "Language must be either 'en' or 'hi'.");
  });

  test('uppercase language code (e.g. "EN") returns 422 UNSUPPORTED_LANGUAGE', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'Valid policy text.',
        language: 'EN'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'UNSUPPORTED_LANGUAGE', 422, res.status);
  });

  test('unknown request properties return 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'Valid policy text.',
        language: 'en',
        extraField: 'unexpected'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('non-object body (array) returns 400 INVALID_INPUT', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['policyText', 'language'])
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_INPUT', 400, res.status);
  });

  test('policy text at exactly 50,000 characters passes length validation', async () => {
    const exactLimitText = 'A'.repeat(50000);
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: exactLimitText,
        language: 'en'
      })
    });
    const data = await res.json();
    // Passes length validation, reaches controller 503
    assertErrorResponse(data, 'AI_PROVIDER_UNAVAILABLE', 503, res.status);
  });

  test('policy text exceeding 50,000 characters returns 413 POLICY_TOO_LONG', async () => {
    const overLimitText = 'A'.repeat(50001);
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: overLimitText,
        language: 'en'
      })
    });
    const data = await res.json();
    assertErrorResponse(data, 'POLICY_TOO_LONG', 413, res.status);
    assert.strictEqual(
      data.error.message,
      'The policy text must not exceed 50000 characters.'
    );
  });

  test('malformed JSON returns 400 INVALID_JSON', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"policyText": "test", language: invalid-json}'
    });
    const data = await res.json();
    assertErrorResponse(data, 'INVALID_JSON', 400, res.status);
    assert.strictEqual(
      data.error.message,
      'Request body cannot be parsed as JSON.'
    );
  });

  test('unsupported content type returns 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'policyText=test&language=en'
    });
    const data = await res.json();
    assertErrorResponse(data, 'UNSUPPORTED_MEDIA_TYPE', 415, res.status);
    assert.strictEqual(
      data.error.message,
      'Content-Type must be application/json.'
    );
  });

  test('request body exceeding 400 KB limit returns 413 REQUEST_TOO_LARGE', async () => {
    // Generate a payload larger than 400 KB (e.g. 450 KB)
    const largePayload = JSON.stringify({
      policyText: 'B'.repeat(30000),
      language: 'en',
      padding: 'x'.repeat(420 * 1024)
    });

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: largePayload
    });
    const data = await res.json();
    assertErrorResponse(data, 'REQUEST_TOO_LARGE', 413, res.status);
    assert.strictEqual(
      data.error.message,
      'Request body exceeds the 400 KB limit.'
    );
  });
});
