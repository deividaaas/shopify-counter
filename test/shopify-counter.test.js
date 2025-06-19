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
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ count: ++call }) });
  process.env.API_KEY = '';
  const req = { headers: {}, query: {} };
  const res = createRes();
  await handler(req, res);
  assert.deepStrictEqual(res.body, { number: 3, butikk1: 1, butikk2: 2 });
  global.fetch = originalFetch;
});

test('uses start of current month by default', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { ok: true, status: 200, json: async () => ({ count: 1 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: {} };
  const res = createRes();
  await handler(req, res);
  const now = new Date();
  const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  assert.strictEqual(urls[0].searchParams.get('created_at_min'), expected);
  assert.strictEqual(urls[1].searchParams.get('created_at_min'), expected);
  global.fetch = originalFetch;
});

test('uses start of current year when period=year', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { ok: true, status: 200, json: async () => ({ count: 1 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { period: 'year' } };
  const res = createRes();
  await handler(req, res);
  const now = new Date();
  const expected = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  assert.strictEqual(urls[0].searchParams.get('created_at_min'), expected);
  assert.strictEqual(urls[1].searchParams.get('created_at_min'), expected);
  global.fetch = originalFetch;
});

test('omits created_at_min when period=all', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return { ok: true, status: 200, json: async () => ({ count: 1 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { period: 'all' } };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(urls[0].searchParams.has('created_at_min'), false);
  assert.strictEqual(urls[1].searchParams.has('created_at_min'), false);
  global.fetch = originalFetch;
});

test('returns error when a shop fetch fails', async () => {
  const originalFetch = global.fetch;
  let call = 0;
  global.fetch = async () => {
    call++;
    if (call === 1) throw new Error('boom');
    return { json: async () => ({ count: 1 }) };
  };
  process.env.API_KEY = '';
  const req = { headers: {}, query: {} };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 502);
  assert.deepStrictEqual(res.body, { error: 'Failed to fetch count from shop 1' });
  global.fetch = originalFetch;
});

test('returns 401 when api key missing', async () => {
  process.env.API_KEY = 'secret';
  const req = { headers: {} };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 401);
});
