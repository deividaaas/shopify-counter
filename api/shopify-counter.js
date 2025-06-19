const SHOPIFY_SHOP_1 = process.env.SHOPIFY_SHOP_1;
const SHOPIFY_ADMIN_TOKEN_1 = process.env.SHOPIFY_ADMIN_TOKEN_1;
const SHOPIFY_SHOP_2 = process.env.SHOPIFY_SHOP_2;
const SHOPIFY_ADMIN_TOKEN_2 = process.env.SHOPIFY_ADMIN_TOKEN_2;
const { timingSafeEqual } = require('crypto');

async function fetchCount(shop, token, createdAtMin) {
  if (!shop || !token) return 0;
  const url = new URL(`/admin/api/2024-04/orders/count.json`, `https://${shop}`);
  if (createdAtMin) url.searchParams.set('created_at_min', createdAtMin);
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  if (!res.ok) {
    console.error(`Shopify request failed for ${shop}: ${res.status}`);
    throw new Error(`Unexpected status code ${res.status}`);
  }
  const data = await res.json();
  return data.count || 0;
}

module.exports = async (req, res) => {
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
    res.status(502).json({ error: 'Failed to fetch count from shop 1' });
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
    res.status(502).json({ error: 'Failed to fetch count from shop 2' });
    return;
  }
  const total = results.butikk1 + results.butikk2;
  res.json({ number: total, ...results });
};
