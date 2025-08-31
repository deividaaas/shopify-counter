export function getAllowedShops(): string[] {
  const shops: string[] = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    // look for env vars like SHOPIFY_SHOP, SHOPIFY_SHOP_1, SHOPIFY_SHOP_2, etc
    if (key === "SHOPIFY_SHOP" || /^SHOPIFY_SHOP_\d+$/.test(key)) {
      shops.push(value);
    }
  }
  return shops;
}

export function getTokenForShop(shop: string): string | undefined {
  // find matching shop variable and infer corresponding token
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== shop) continue;
    if (key === "SHOPIFY_SHOP") {
      return process.env.SHOPIFY_TOKEN;
    }
    const suffix = key.replace(/^SHOPIFY_SHOP/, "");
    return (
      process.env[`SHOPIFY_ADMIN_TOKEN${suffix}`] ||
      process.env[`SHOPIFY_TOKEN${suffix}`]
    );
  }
  return undefined;
}
