import { apiVersion, ensureWhitelisted, getTokenForShop } from "@/lib/shopify";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    let shop = (url.searchParams.get("shop") || "").trim();
    if (!shop) {
      // single-shop fallback
      shop = String(process.env.SHOPIFY_SHOP || "").trim();
    }
    if (!shop) {
      return new Response(JSON.stringify({ ok:false, error:"Missing shop" }), { status: 400 });
    }

    ensureWhitelisted(shop);
    const TOKEN = getTokenForShop(shop);
    if (!TOKEN) {
      return new Response(JSON.stringify({ ok:false, error:`Missing token for ${shop}` }), { status: 500 });
    }

    const from = url.searchParams.get("from") || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
    const to   = url.searchParams.get("to")   || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1) - 1).toISOString();

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
      const resp = await fetch(urlGql, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
        body: JSON.stringify({ query: GQL, variables: { query, first: 250, cursor } }),
      });
      const ct = resp.headers.get("content-type") || "";
      const raw = await resp.text();

      if (!resp.ok) {
        console.error("Shopify HTTP error", {
          status: resp.status,
          url: urlGql,
          contentType: ct,
          preview: raw.slice(0, 300),
        });
        return new Response(
          JSON.stringify({ ok: false, error: `Shopify HTTP ${resp.status}` }),
          { status: 502 }
        );
      }

      if (!ct.includes("application/json")) {
        console.error("Invalid content-type from Shopify", {
          contentType: ct,
          preview: raw.slice(0, 300),
        });
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid JSON from Shopify" }),
          { status: 502 }
        );
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("JSON parse error", { preview: raw.slice(0, 300) });
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid JSON from Shopify" }),
          { status: 502 }
        );
      }
      if (data.errors) {
        console.error("GraphQL error for Shopify", { errors: data.errors });
        return new Response(
          JSON.stringify({ ok: false, error: "Shopify GraphQL error" }),
          { status: 502 }
        );
      }

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

    return Response.json({ ok: true, from, to, perShop: [{ shop, totals }], total: totals });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ ok:false, error: e.message || "Server error" }), { status: 500 });
  }
}
