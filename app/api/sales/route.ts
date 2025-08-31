import { apiVersion, ensureWhitelisted, getTokenForShop } from "@/lib/shopify";

export const runtime = "nodejs";

type Totals = {
  count: number;
  order_totals: number;
  tax: number;
  discounts: number;
  shipping: number;
};

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  let from = searchParams.get("from");
  let to = searchParams.get("to");

  const shopParams = searchParams
    .getAll("shop")
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean);

  if (shopParams.length === 0) {
    return Response.json({ ok: false, error: "Missing shop parameter" }, { status: 400 });
  }

  const shops = [...new Set(shopParams)];
  const perShop: Record<string, Totals> = {};
  const total: Totals = { count: 0, order_totals: 0, tax: 0, discounts: 0, shipping: 0 };

  if (!from || !to) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1) - 1);
    from = start.toISOString();
    to = end.toISOString();
  } else {
    from = new Date(from).toISOString();
    to = new Date(to).toISOString();
  }

  for (const shop of shops) {
    try {
      ensureWhitelisted(shop);
    } catch (err: any) {
      return Response.json({ ok: false, error: err.message }, { status: 400 });
    }
    const token = getTokenForShop(shop);
    if (!token) {
      return Response.json({ ok: false, error: `Missing token for ${shop}` }, { status: 400 });
    }

    const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`;
    const query = `query ($query: String!, $after: String) {
      orders(first: 100, after: $after, query: $query) {
        edges {
          node {
            totalPriceSet { shopMoney { amount } }
            totalTaxSet { shopMoney { amount } }
            totalDiscountsSet { shopMoney { amount } }
            totalShippingPriceSet { shopMoney { amount } }
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }`;

    const search = `created_at:>=${from} created_at:<=${to} status:any`;
    let cursor: string | null = null;
    const totals: Totals = { count: 0, order_totals: 0, tax: 0, discounts: 0, shipping: 0 };

    try {
      while (true) {
        const body = JSON.stringify({ query, variables: { query: search, after: cursor } });
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
          },
          body,
        });

        if (!res.ok) {
          const text = await res.text();
          if ([401, 403, 502].includes(res.status)) {
            console.error(text);
          }
          return Response.json({ ok: false, error: text || `Status ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        const orders = data?.data?.orders;
        if (!orders) {
          return Response.json({ ok: false, error: "Invalid response from Shopify" }, { status: 502 });
        }

        for (const edge of orders.edges) {
          totals.count += 1;
          totals.order_totals += Number(edge.node.totalPriceSet?.shopMoney?.amount || 0);
          totals.tax += Number(edge.node.totalTaxSet?.shopMoney?.amount || 0);
          totals.discounts += Number(edge.node.totalDiscountsSet?.shopMoney?.amount || 0);
          totals.shipping += Number(edge.node.totalShippingPriceSet?.shopMoney?.amount || 0);
        }

        if (!orders.pageInfo.hasNextPage) {
          break;
        }
        cursor = orders.pageInfo.endCursor;
      }
    } catch (err: any) {
      console.error(err);
      return Response.json({ ok: false, error: err.message }, { status: 502 });
    }

    perShop[shop] = totals;
    total.count += totals.count;
    total.order_totals += totals.order_totals;
    total.tax += totals.tax;
    total.discounts += totals.discounts;
    total.shipping += totals.shipping;
  }

  return Response.json({ ok: true, from, to, perShop, total });
}
