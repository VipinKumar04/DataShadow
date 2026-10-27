const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../backend/app');

describe('GET /api/health', () => {
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

  test('should return HTTP 200 and exact health status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/json/);
    const data = await res.json();
    assert.deepStrictEqual(data, {
      success: true,
      status: 'ok'
    });
  });
});
