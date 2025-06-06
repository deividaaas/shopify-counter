const test = require('node:test');
const assert = require('node:assert');
const handler = require('../api/index.js');

// ensure API key is required

test('returns 401 when api key is missing', async () => {
  process.env.API_KEY = 'secret';
  const req = { headers: {} };
  let statusCode = 200;
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { this.body = body; }
  };
  await handler(req, res);
  assert.strictEqual(statusCode, 401);
});
