import { apiVersion, ensureWhitelisted, getTokenForShop } from "../lib/shopify";

export default async function handler(req: any, res: any) {
  try {
    let shop = (req.query?.shop || "").toString().trim();
    if (!shop) {
      shop = String(process.env.SHOPIFY_SHOP || "").trim();
    }
    if (!shop) {
      res.status(400).json({ ok: false, error: "Missing shop" });
      return;
    }

    try {
      ensureWhitelisted(shop);
    } catch {
      res.status(403).json({ ok: false, error: "Shop not allowed" });
      return;
    }

    const TOKEN = getTokenForShop(shop);
    if (!TOKEN) {
      res.status(500).json({ ok: false, error: `Missing token for ${shop}` });
      return;
    }

    const now = new Date();
    const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - 1).toISOString();
    const from = (req.query?.from || defaultFrom).toString();
    const to = (req.query?.to || defaultTo).toString();

    const GQL = `
      query OrdersSales($query: String!, $first: Int!, $cursor: String) {
        orders(first: $first, after: $cursor, query: $query, sortKey:CREATED_AT) {
          edges {
            cursor
            node {
              totalPriceSet { shopMoney { amount } }
              totalTaxSet { shopMoney { amount } }
              totalDiscountsSet { shopMoney { amount } }
              totalShippingPriceSet { shopMoney { amount } }
            }
          }
          pageInfo { hasNextPage }
        }
      }`;

    const query = `created_at:>=${from} created_at:<=${to} status:any`;
    const urlGql = `https://${shop}/admin/api/${apiVersion()}/graphql.json`;

    const totals = { count: 0, order_totals: 0, tax: 0, discounts: 0, shipping: 0 };
    let cursor: string | null = null;

    while (true) {
      console.log("Requesting Shopify", { url: urlGql, cursor });
      const resp = await fetch(urlGql, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
        body: JSON.stringify({ query: GQL, variables: { query, first: 250, cursor } }),
      });
      const ct = resp.headers.get("content-type") || "";
      const raw = await resp.text();
      console.log("Shopify response", { status: resp.status, contentType: ct, preview: raw.slice(0, 300) });

      if (!resp.ok) {
        res.status(502).json({ ok: false, error: `Shopify HTTP ${resp.status}` });
        return;
      }
      if (!ct.includes("application/json")) {
        res.status(502).json({ ok: false, error: "Invalid JSON from Shopify" });
        return;
      }
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        res.status(502).json({ ok: false, error: "Invalid JSON from Shopify" });
        return;
      }
      if (data.errors) {
        res.status(502).json({ ok: false, error: "Shopify GraphQL error" });
        return;
      }

      const edges = data.data.orders.edges as any[];
      for (const e of edges) {
        const n = e.node;
        const num = (p: any) => Number(p?.shopMoney?.amount || 0);
        totals.count += 1;
        totals.order_totals += num(n.totalPriceSet);
        totals.tax += num(n.totalTaxSet);
        totals.discounts += num(n.totalDiscountsSet);
        totals.shipping += num(n.totalShippingPriceSet);
      }
      if (data.data.orders.pageInfo.hasNextPage) {
        cursor = edges[edges.length - 1].cursor;
      } else break;
    }

    res.json({ ok: true, perShop: [{ shop, totals }], total: totals });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}

module.exports = handler;
