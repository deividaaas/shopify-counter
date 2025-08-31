export function normalizeShopKey(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\.myshopify\.com$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

export function getAllowedShops(): Set<string> {
  const shops = new Set<string>();
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (key === 'SHOPIFY_SHOP') {
      shops.add(value.toLowerCase());
    } else if (key.startsWith('SHOPIFY_SHOP_')) {
      shops.add((value as string).toLowerCase());
    }
  }
  return shops;
}

export function getTokenForShop(shop: string): string | undefined {
  const target = shop.toLowerCase();
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('SHOPIFY_SHOP_') && value && (value as string).toLowerCase() === target) {
      const suffix = normalizeShopKey(key.slice('SHOPIFY_SHOP_'.length));
      const tokenKey1 = `SHOPIFY_ADMIN_TOKEN_${suffix}`;
      const tokenKey2 = `SHOPIFY_TOKEN_${suffix}`;
      if (process.env[tokenKey1]) return process.env[tokenKey1];
      if (process.env[tokenKey2]) return process.env[tokenKey2];
    }
  }
  if (process.env.SHOPIFY_SHOP && process.env.SHOPIFY_SHOP.toLowerCase() === target) {
    return process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_TOKEN;
  }
  const key = normalizeShopKey(shop);
  return process.env[`SHOPIFY_ADMIN_TOKEN_${key}`] || process.env[`SHOPIFY_TOKEN_${key}`];
}

export function ensureWhitelisted(shop: string): void {
  const allowed = getAllowedShops();
  if (!allowed.has(shop.toLowerCase())) {
    throw new Error('Shop not allowed');
  }
}

export function apiVersion(): string {
  const v = process.env.SHOPIFY_API_VERSION;
  return v && v.trim() ? v.trim() : '2025-04';
}

export default {
  normalizeShopKey,
  getAllowedShops,
  getTokenForShop,
  ensureWhitelisted,
  apiVersion,
};
