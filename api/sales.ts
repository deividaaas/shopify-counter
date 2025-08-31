import { apiVersion, ensureWhitelisted, getTokenForShop } from "../lib/shopify";

export default async function handler(req: any, res: any) {
  try {
    let shop = (req.query?.shop || "").trim();
    if (!shop) {
      shop = String(process.env.SHOPIFY_SHOP || "").trim();
    }
    if (!shop) {
      res.status(400).json({ ok: false, error: "Missing shop" });
      return;
    }

    ensureWhitelisted(shop);
    const TOKEN = getTokenForShop(shop);
    if (!TOKEN) {
      res.status(500).json({ ok: false, error: `Missing token for ${shop}` });
      return;
    }

    const from = req.query?.from || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
    const to = req.query?.to || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1) - 1).toISOString();

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
    const url = `https://${shop}/admin/api/${apiVersion()}/graphql.json`;

    const totals = { count: 0, order_totals: 0, tax: 0, discounts: 0, shipping: 0 };
    let cursor: string | null = null;

    while (true) {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
        body: JSON.stringify({ query: GQL, variables: { query, first: 250, cursor } }),
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Shopify HTTP ${r.status} for ${shop}: ${text}`);
      }
      const data = await r.json();
      if (data.errors) throw new Error(`GraphQL error for ${shop}: ${JSON.stringify(data.errors)}`);

      const edges = data.data.orders.edges as any[];
      for (const e of edges) {
        const n = e.node;
        const num = (p: any) => Number(p?.shopMoney?.amount || 0);
        totals.count += 1;
        totals.order_totals += num(n.totalPriceSet);
        totals.tax       += num(n.totalTaxSet);
        totals.discounts += num(n.totalDiscountsSet);
        totals.shipping  += num(n.totalShippingPriceSet);
      }
      if (data.data.orders.pageInfo.hasNextPage) {
        cursor = edges[edges.length - 1].cursor;
      } else break;
    }

    res.status(200).json({ ok: true, from, to, perShop: [{ shop, totals }], total: totals });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}
