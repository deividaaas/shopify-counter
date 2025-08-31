import { getAllowedShops, getTokenForShop, apiVersion } from "../lib/shopify";

export default async function handler(_req: any, res: any) {
  try {
    const shops = getAllowedShops();
    const report = shops.map((s) => ({ shop: s, tokenExists: !!getTokenForShop(s) }));
    res.status(200).json({ apiVersion: apiVersion(), allowedShops: report });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}
