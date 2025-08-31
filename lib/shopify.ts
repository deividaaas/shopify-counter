export const apiVersion = "2024-04";

const shopTokenMap: Record<string, string> = {};
for (let i = 1; i <= 10; i++) {
  const shop = process.env[`SHOPIFY_SHOP_${i}`];
  const token = process.env[`SHOPIFY_ADMIN_TOKEN_${i}`];
  if (shop && token) {
    shopTokenMap[shop] = token;
  }
}

export function ensureWhitelisted(shop: string): void {
  if (!shopTokenMap[shop]) {
    throw new Error("Shop not allowed");
  }
}

export function getTokenForShop(shop: string): string | undefined {
  return shopTokenMap[shop];
}
