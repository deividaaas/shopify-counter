export const runtime = "nodejs";

import { getAllowedShops, getTokenForShop } from "@/lib/shopify";

export function GET() {
  const apiVersion = process.env.SHOPIFY_API_VERSION;
  const shops = getAllowedShops();
  const allowedShops = shops.map((shop) => ({
    shop,
    tokenExists: !!getTokenForShop(shop),
  }));
  return Response.json({ apiVersion, allowedShops });
}
