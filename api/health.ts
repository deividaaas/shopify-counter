import { apiVersion, getAllowedShops, getTokenForShop } from "../lib/shopify";

export default async function handler(req: any, res: any) {
  try {
    const shops = getAllowedShops();
    const allowedShops = shops.map((s) => ({
      shop: s,
      tokenExists: !!getTokenForShop(s),
    }));
    res.json({ apiVersion: apiVersion(), allowedShops });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}
