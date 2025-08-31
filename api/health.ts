import { getAllowedShops, getTokenForShop, apiVersion } from "../lib/shopify";

export default function handler(req: any, res: any) {
  const allowedShops = getAllowedShops().map((shop) => ({
    shop,
    tokenExists: Boolean(getTokenForShop(shop)),
  }));
  res.status(200).json({ apiVersion: apiVersion(), allowedShops });
}
