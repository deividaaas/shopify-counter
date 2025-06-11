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

test('combines values from both counters', async () => {
  const originalFetch = global.fetch;
  let call = 0;
  global.fetch = async () => ({ json: async () => ({ number: ++call }) });
  process.env.API_KEY = '';
  const req = { headers: {} };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.deepStrictEqual(res.body, { number: 3 });
  assert.strictEqual(call, 2);
  global.fetch = originalFetch;
});
