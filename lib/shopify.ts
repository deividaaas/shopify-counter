export function normalizeShopKey(shop: string): string {
  return shop.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function readAllowedShops(): string[] {
  const raw = process.env.ALLOWED_SHOPS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export function getAllowedShops(): string[] {
  const allowed = readAllowedShops();
  // Single-shop fallback (nåværende oppsett)
  if (allowed.length === 0 && process.env.SHOPIFY_SHOP) {
    return [String(process.env.SHOPIFY_SHOP).trim()];
  }
  return allowed;
}

export function getTokenForShop(shop: string): string | undefined {
  // Nytt schema (for senere multi-shop)
  const key = normalizeShopKey(shop);
  const envName = `SHOPIFY_TOKEN__${key}`;
  if (process.env[envName]) return process.env[envName];

  // Single-shop fallback (nå)
  if (
    process.env.SHOPIFY_SHOP &&
    shop.trim().toLowerCase() === String(process.env.SHOPIFY_SHOP).trim().toLowerCase()
  ) {
    return process.env.SHOPIFY_TOKEN;
  }
  return undefined;
}

export function ensureWhitelisted(shop: string): void {
  const allowed = getAllowedShops();
  if (!allowed.includes(shop)) throw new Error(`Shop not allowed: ${shop}`);
}

export function apiVersion(): string {
  return (process.env.SHOPIFY_API_VERSION || "2025-07").trim();
}

export default { normalizeShopKey, getAllowedShops, getTokenForShop, ensureWhitelisted, apiVersion };
