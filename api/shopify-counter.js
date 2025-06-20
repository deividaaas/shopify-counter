const SHOPIFY_SHOP_1 = process.env.SHOPIFY_SHOP_1;
const SHOPIFY_ADMIN_TOKEN_1 = process.env.SHOPIFY_ADMIN_TOKEN_1;
const SHOPIFY_SHOP_2 = process.env.SHOPIFY_SHOP_2;
const SHOPIFY_ADMIN_TOKEN_2 = process.env.SHOPIFY_ADMIN_TOKEN_2;
const { timingSafeEqual } = require('crypto');

function validateEnv() {
  const errors = [];
  const shopRegex = /^[a-z0-9-]+\.myshopify\.com$/i;
  if (!SHOPIFY_SHOP_1 || !shopRegex.test(SHOPIFY_SHOP_1)) {
    errors.push('SHOPIFY_SHOP_1');
  }
  if (!SHOPIFY_ADMIN_TOKEN_1 || SHOPIFY_ADMIN_TOKEN_1 === 'token1') {
    errors.push('SHOPIFY_ADMIN_TOKEN_1');
  }
  if (!SHOPIFY_SHOP_2 || !shopRegex.test(SHOPIFY_SHOP_2)) {
    errors.push('SHOPIFY_SHOP_2');
  }
  if (!SHOPIFY_ADMIN_TOKEN_2 || SHOPIFY_ADMIN_TOKEN_2 === 'token2') {
    errors.push('SHOPIFY_ADMIN_TOKEN_2');
  }
  return errors;
}

async function fetchCount(shop, token, createdAtMin) {
  if (!shop || !token) {
    throw new Error('Missing shop or token');
  }
  const url = new URL(`/admin/api/2024-04/orders/count.json`, `https://${shop}`);
  if (createdAtMin) url.searchParams.set('created_at_min', createdAtMin);
  // count all orders including closed/archived ones
  url.searchParams.set('status', 'any');
  const tokenId = token.slice(0, 6);
  console.log(`Fetching ${url} with token ${tokenId}...`);
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  let text = '';
  let data;
  if (typeof res.text === 'function') {
    text = await res.text();
  } else if (typeof res.json === 'function') {
    data = await res.json();
    text = JSON.stringify(data);
  }
  console.log(`Response ${res.status} from ${shop}: ${text}`);
  if (!res.ok) {
    console.error(`Shopify request failed for ${shop}: ${res.status} ${text}`);
    if (res.status === 401) {
      console.error('Unauthorized access to Shopify');
    }
    throw new Error(`Status ${res.status}: ${text}`);
  }
  if (!data) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error(`Failed to parse response for ${shop}:`, text);
      throw new Error('Invalid JSON');
    }
  }
  if (typeof data.count !== 'number') {
    console.error(`Invalid response for ${shop}:`, data);
    throw new Error('Missing count');
  }
  if (data.count === 0) {
    console.error(`Shopify returned 0 orders for ${shop}`);
  }
  return data.count;
}

module.exports = async (req, res) => {
  const envErrors = validateEnv();
  if (envErrors.length) {
    console.error('Invalid Shopify configuration:', envErrors.join(', '));
    res.status(500).json({ error: 'Invalid Shopify configuration' });
    return;
  }
  const period = req.query?.period || 'month';
  let createdAtMin;
  const now = new Date();
  if (period === 'year') {
    createdAtMin = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  } else if (period === 'all') {
    createdAtMin = undefined;
  } else {
    createdAtMin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  }
  const requiredKey = process.env.API_KEY;
  if (requiredKey) {
    const provided = req.headers['x-api-key'] || '';
    const valid = provided.length === requiredKey.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(requiredKey));
    if (!valid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }
  const results = { butikk1: 0, butikk2: 0 };
  try {
    results.butikk1 = await fetchCount(
      SHOPIFY_SHOP_1,
      SHOPIFY_ADMIN_TOKEN_1,
      createdAtMin
    );
  } catch (err) {
    console.error('Failed to fetch shop 1 count', err);
    res.status(502).json({ number: 0, error: err.message });
    return;
  }
  try {
    results.butikk2 = await fetchCount(
      SHOPIFY_SHOP_2,
      SHOPIFY_ADMIN_TOKEN_2,
      createdAtMin
    );
  } catch (err) {
    console.error('Failed to fetch shop 2 count', err);
    res.status(502).json({ number: 0, error: err.message });
    return;
  }
  const total = results.butikk1 + results.butikk2;
  res.json({ number: total, ...results });
};
