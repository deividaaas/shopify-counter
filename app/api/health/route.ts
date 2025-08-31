import { getAllowedShops, getTokenForShop, apiVersion } from "@/lib/shopify";

export const runtime = "nodejs";

export async function GET() {
  const shops = getAllowedShops();
  const report = shops.map((s) => ({ shop: s, tokenExists: !!getTokenForShop(s) }));
  return Response.json({
    apiVersion: apiVersion(),
    allowedShops: report,
  });
}
