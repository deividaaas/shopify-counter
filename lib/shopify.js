function normalizeShopKey(shop) {
  return shop.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function readAllowedShops() {
  const raw = process.env.ALLOWED_SHOPS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function getAllowedShops() {
  const allowed = readAllowedShops();
  if (allowed.length === 0 && process.env.SHOPIFY_SHOP) {
    return [String(process.env.SHOPIFY_SHOP).trim()];
  }
  return allowed;
}

function getTokenForShop(shop) {
  const key = normalizeShopKey(shop);
  const envName = `SHOPIFY_TOKEN__${key}`;
  if (process.env[envName]) return process.env[envName];

  if (
    process.env.SHOPIFY_SHOP &&
    shop.trim().toLowerCase() === String(process.env.SHOPIFY_SHOP).trim().toLowerCase()
  ) {
    return process.env.SHOPIFY_TOKEN;
  }
  return undefined;
}

function ensureWhitelisted(shop) {
  const allowed = getAllowedShops();
  if (!allowed.includes(shop)) throw new Error(`Shop not allowed: ${shop}`);
}

function apiVersion() {
  return (process.env.SHOPIFY_API_VERSION || "2025-07").trim();
}

module.exports = { normalizeShopKey, getAllowedShops, getTokenForShop, ensureWhitelisted, apiVersion };
