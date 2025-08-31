export const runtime = "nodejs";

export function GET() {
  return Response.json({
    shop: process.env.SHOPIFY_SHOP,
    tokenExists: !!process.env.SHOPIFY_TOKEN,
    apiVersion: process.env.SHOPIFY_API_VERSION,
  });
}
