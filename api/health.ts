import { getAllowedShops, getTokenForShop, apiVersion } from "../lib/shopify";

export default function handler(_req: any, res: any) {
  const shops = getAllowedShops();
  const report = shops.map(s => ({ shop: s, tokenExists: !!getTokenForShop(s) }));
  res.status(200).json({ apiVersion: apiVersion(), allowedShops: report });
}
