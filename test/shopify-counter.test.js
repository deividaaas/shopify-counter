const test = require('node:test');
const assert = require('node:assert');
process.env.SHOPIFY_SHOP_1 = 'shop1';
process.env.SHOPIFY_ADMIN_TOKEN_1 = 't1';
process.env.SHOPIFY_SHOP_2 = 'shop2';
process.env.SHOPIFY_ADMIN_TOKEN_2 = 't2';
const handler = require('../api/shopify-counter.js');

// helper to create mock response object
function createRes() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; }
  };
}

test('sums counts from both shops', async () => {
  const originalFetch = global.fetch;
  let call = 0;
  global.fetch = async () => ({ json: async () => ({ count: ++call }) });
  process.env.API_KEY = '';
  const req = { headers: {}, query: {} };
  const res = createRes();
  await handler(req, res);
  assert.deepStrictEqual(res.body, { number: 3, butikk1: 1, butikk2: 2 });
  global.fetch = originalFetch;
});

test('returns 401 when api key missing', async () => {
  process.env.API_KEY = 'secret';
  const req = { headers: {} };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 401);
});

test('period=all omits created_at_min', async () => {
  const urls = [];
  const originalFetch = global.fetch;
  global.fetch = async url => { urls.push(url.toString()); return { json: async () => ({ count: 1 }) }; };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { period: 'all' } };
  const res = createRes();
  await handler(req, res);
  const parsed = new URL(urls[0]);
  assert.ok(!parsed.searchParams.has('created_at_min'));
  global.fetch = originalFetch;
});

test('invalid period returns 400', async () => {
  process.env.API_KEY = '';
  const req = { headers: {}, query: { period: 'week' } };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 400);
});
