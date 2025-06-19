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

test('uses start of current month by default', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => { urls.push(url); return { json: async () => ({ count: 1 }) }; };
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

test('returns 401 when api key missing', async () => {
  process.env.API_KEY = 'secret';
  const req = { headers: {} };
  const res = createRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 401);
});

test('uses explicit created_at_min when provided', async () => {
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => { urls.push(url.toString()); return { json: async () => ({ count: 1 }) }; };
  process.env.API_KEY = '';
  const dateStr = '2024-05-20T00:00:00Z';
  const req = { headers: {}, query: { created_at_min: dateStr } };
  const res = createRes();
  await handler(req, res);
  urls.forEach(u => {
    assert.strictEqual(new URL(u).searchParams.get('created_at_min'), dateStr);
  });
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

test('uses start of current month when period=month', async () => {
  const RealDate = Date;
  const fixed = new Date('2024-06-15T12:00:00Z');
  global.Date = class extends RealDate {
    constructor(...args) { return args.length ? new RealDate(...args) : fixed; }
    static now() { return fixed.getTime(); }
  };
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => { urls.push(url.toString()); return { json: async () => ({ count: 1 }) }; };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { period: 'month' } };
  const res = createRes();
  await handler(req, res);
  const expected = '2024-06-01T00:00:00.000Z';
  urls.forEach(u => {
    assert.strictEqual(new URL(u).searchParams.get('created_at_min'), expected);
  });
  global.fetch = originalFetch;
  global.Date = RealDate;
});

test('uses start of current year when period=year', async () => {
  const RealDate = Date;
  const fixed = new Date('2024-06-15T12:00:00Z');
  global.Date = class extends RealDate {
    constructor(...args) { return args.length ? new RealDate(...args) : fixed; }
    static now() { return fixed.getTime(); }
  };
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => { urls.push(url.toString()); return { json: async () => ({ count: 1 }) }; };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { period: 'year' } };
  const res = createRes();
  await handler(req, res);
  const expected = '2024-01-01T00:00:00.000Z';
  urls.forEach(u => {
    assert.strictEqual(new URL(u).searchParams.get('created_at_min'), expected);
  });
  global.fetch = originalFetch;
  global.Date = RealDate;
});

test('omits created_at_min when period=all', async () => {
  const RealDate = Date;
  const fixed = new Date('2024-06-15T12:00:00Z');
  global.Date = class extends RealDate {
    constructor(...args) { return args.length ? new RealDate(...args) : fixed; }
    static now() { return fixed.getTime(); }
  };
  const originalFetch = global.fetch;
  const urls = [];
  global.fetch = async (url) => { urls.push(url.toString()); return { json: async () => ({ count: 1 }) }; };
  process.env.API_KEY = '';
  const req = { headers: {}, query: { period: 'all' } };
  const res = createRes();
  await handler(req, res);
  urls.forEach(u => {
    assert.strictEqual(new URL(u).searchParams.get('created_at_min'), null);
  });
  global.fetch = originalFetch;
  global.Date = RealDate;
});
