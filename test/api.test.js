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

test('accepts request when api key matches', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ json: async () => ({ number: 1 }) });
  process.env.API_KEY = 'secret';
  const req = { headers: { 'x-api-key': 'secret' } };
  let statusCode = 200;
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { this.body = body; }
  };
  await handler(req, res);
  assert.strictEqual(statusCode, 200);
  assert.deepStrictEqual(res.body, { number: 2 });
  global.fetch = originalFetch;
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

test('uses url query parameters when provided', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { json: async () => ({ number: 2 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { url1: 'https://a.com', url2: 'https://b.com' } };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.deepStrictEqual(urls, ['https://a.com', 'https://b.com']);
  assert.deepStrictEqual(res.body, { number: 4 });
  global.fetch = originalFetch;
});

test('combines numbers from multiple url params', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { json: async () => ({ number: 1 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { url: ['https://a.com', 'https://b.com', 'https://c.com'] } };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.deepStrictEqual(urls, ['https://a.com', 'https://b.com', 'https://c.com']);
  assert.deepStrictEqual(res.body, { number: 3 });
  global.fetch = originalFetch;
});

test('returns 0 when source=none', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; return { json: async () => ({ number: 1 }) }; };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { source: 'none' } };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.deepStrictEqual(res.body, { number: 0 });
  assert.strictEqual(calls, 0);
  global.fetch = originalFetch;
});

test('falls back to default url when url1 is invalid', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => { urls.push(url); return { json: async () => ({ number: 1 }) }; };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { source: '1', url1: 'ftp://bad' } };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.strictEqual(urls.length, 1);
  assert.strictEqual(urls[0], 'https://smiirl-shopify.herokuapp.com/c/096a519a-f432-48da-beb2-c0ae6438e9e1');
  assert.deepStrictEqual(res.body, { number: 1 });
  global.fetch = originalFetch;
});

test('uses custom url1 when source=1', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { json: async () => ({ number: 9 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { source: '1', url1: 'https://custom.com' } };
  const res = { json(body) { this.body = body; } };
  await handler(req, res);
  assert.deepStrictEqual(urls, ['https://custom.com']);
  assert.deepStrictEqual(res.body, { number: 9 });
  global.fetch = originalFetch;
});
