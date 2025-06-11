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

test('fetches only first counter when source=1', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { json: async () => ({ number: 5 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { source: '1' } };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.deepStrictEqual(res.body, { number: 5 });
  assert.strictEqual(urls.length, 1);
  global.fetch = originalFetch;
});

test('fetches only second counter when source=2', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { json: async () => ({ number: 7 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { source: '2' } };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.deepStrictEqual(res.body, { number: 7 });
  assert.strictEqual(urls.length, 1);
  global.fetch = originalFetch;
});
