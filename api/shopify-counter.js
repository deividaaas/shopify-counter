const { timingSafeEqual } = require('crypto');

function getShops() {
  const list = (process.env.ALLOWED_SHOPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.map((shop) => {
    const envName = `SHOPIFY_TOKEN__${shop.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    return { shop, token: process.env[envName], envName };
  });
}

function validateEnv(shops) {
  const errors = [];
  const shopRegex = /^[a-z0-9-]+\.myshopify\.com$/i;
  if (!process.env.ALLOWED_SHOPS) {
    errors.push('ALLOWED_SHOPS');
  }
  for (const { shop, token, envName } of shops) {
    if (!shopRegex.test(shop)) {
      errors.push(`ALLOWED_SHOPS:${shop}`);
    }
    if (!token) {
      errors.push(envName);
    }
  }
  const versionRegex = /^\d{4}-\d{2}$/;
  if (!process.env.SHOPIFY_API_VERSION || !versionRegex.test(process.env.SHOPIFY_API_VERSION)) {
    errors.push('SHOPIFY_API_VERSION');
  }
  return errors;
}

async function fetchCount(shop, token, apiVersion, createdAtMin, createdAtMax) {
  if (!shop || !token) {
    throw new Error('Missing shop or token');
  }
  const url = new URL(`/admin/api/${apiVersion}/orders/count.json`, `https://${shop}`);
  if (createdAtMin) url.searchParams.set('created_at_min', createdAtMin);
  if (createdAtMax) url.searchParams.set('created_at_max', createdAtMax);
  // count all orders including closed/archived ones
  url.searchParams.set('status', 'any');
  const tokenId = token.slice(0, 4) + '...' + token.slice(-4);
  console.log(`Fetching ${url} for ${shop} with token ${tokenId}...`);
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const raw = await res.text();
  console.log(`Response ${res.status} from ${shop}: ${raw}`);
  if (!res.ok) {
    console.error(`Shopify request failed for ${shop}: ${res.status}`);
    throw new Error('Invalid JSON from Shopify');
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse Shopify response as JSON:', err);
    throw new Error('Invalid JSON from Shopify');
  }
  if (typeof data.count !== 'number') {
    console.error(`Invalid response for ${shop}:`, data);
    throw new Error('Invalid JSON from Shopify');
  }
  if (data.count === 0) {
    console.error(`Shopify returned 0 orders for ${shop}`);
  }
  return data.count;
}

module.exports = async (req, res) => {
  const shops = getShops();
  const envErrors = validateEnv(shops);
  if (envErrors.length) {
    console.error('Invalid Shopify configuration:', envErrors.join(', '));
    res.status(500).json({ error: 'Invalid Shopify configuration' });
    return;
  }
  const apiVersion = process.env.SHOPIFY_API_VERSION;
  const period = req.query?.period || 'month';
  let createdAtMin;
  let createdAtMax = req.query?.created_at_max;
  const now = new Date();
  if (period === 'year') {
    createdAtMin = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  } else if (period === 'all') {
    createdAtMin = undefined;
  } else {
    createdAtMin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  }
  if (req.query?.created_at_min) {
    const provided = req.query.created_at_min;
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (isoRegex.test(provided) && !isNaN(new Date(provided).getTime())) {
      createdAtMin = provided;
    }
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
  const results = {};
  let total = 0;
  for (const { shop, token } of shops) {
    try {
      const count = await fetchCount(shop, token, apiVersion, createdAtMin, createdAtMax);
      results[shop] = count;
      total += count;
    } catch (err) {
      console.error(`Failed to fetch count for ${shop}`, err);
      if (err.message === 'Invalid JSON from Shopify') {
        res.status(500).json({ error: 'Shopify API returned invalid JSON' });
      } else {
        res.status(502).json({ number: 0, error: err.message });
      }
      return;
    }
  }
  res.json({ number: total, ...results });
};

