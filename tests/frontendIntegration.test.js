process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../backend/app');
const { setClient } = require('../backend/services/aiAnalysisService');

describe('Unified Application Server - Frontend & Backend Integration', () => {
  let server;
  let baseUrl;

  const mockAnalysis = {
    summary: 'Clear privacy summary',
    dataCollected: [
      {
        category: 'Contact Info',
        purpose: 'Communication',
        evidence: 'We collect your email address.'
      }
    ],
    sharing: [],
    retention: [],
    concerns: [],
    recommendations: ['Review settings.'],
    limitations: ['Based on supplied text.']
  };

  before((_, done) => {
    process.env.GEMINI_API_KEY = 'mock-key';
    process.env.GEMINI_MODEL = 'mock-model';

    setClient({
      models: {
        generateContent: async () => ({
          text: JSON.stringify(mockAnalysis)
        })
      }
    });

    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  after((_, done) => {
    setClient(null);
    server.close(done);
  });

  test('GET / renders the EJS frontend template with HTTP 200', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);

    const html = await res.text();
    assert.ok(html.includes('DataShadow AI'));
    assert.ok(html.includes('id="policyForm"'));
    assert.ok(html.includes('id="policyText"'));
    assert.ok(html.includes('id="analyzeBtn"'));
    assert.ok(html.includes('id="resultsSection"'));
  });

  test('GET /css/style.css serves static CSS stylesheet with HTTP 200', async () => {
    const res = await fetch(`${baseUrl}/css/style.css`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/css/);

    const css = await res.text();
    assert.ok(css.includes('--color-primary'));
  });

  test('GET /js/app.js serves static client JavaScript with HTTP 200', async () => {
    const res = await fetch(`${baseUrl}/js/app.js`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /javascript/);

    const js = await res.text();
    assert.ok(js.includes('handleAnalyzeClick'));
  });

  test('GET /api/health returns HTTP 200 JSON on the unified server', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/json/);

    const json = await res.json();
    assert.deepStrictEqual(json, { success: true, status: 'ok' });
  });

  test('POST /api/analyze processes frontend submission with canonical envelope', async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyText: 'We collect your email address.',
        language: 'en'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.analysis.summary, 'Clear privacy summary');
    assert.strictEqual(json.analysis.dataCollected.length, 1);
  });
});
