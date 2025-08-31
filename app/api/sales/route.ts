export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  let from = searchParams.get("from");
  let to = searchParams.get("to");

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

  const shop = process.env.SHOPIFY_SHOP;
  const version = process.env.SHOPIFY_API_VERSION;
  const token = process.env.SHOPIFY_TOKEN;
  if (!shop || !version || !token) {
    return Response.json({ ok: false, error: "Missing Shopify configuration" }, { status: 500 });
  }

  const endpoint = `https://${shop}/admin/api/${version}/graphql.json`;
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
  let count = 0;
  let order_totals = 0;
  let tax = 0;
  let discounts = 0;
  let shipping = 0;

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
        count += 1;
        order_totals += Number(edge.node.totalPriceSet?.shopMoney?.amount || 0);
        tax += Number(edge.node.totalTaxSet?.shopMoney?.amount || 0);
        discounts += Number(edge.node.totalDiscountsSet?.shopMoney?.amount || 0);
        shipping += Number(edge.node.totalShippingPriceSet?.shopMoney?.amount || 0);
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

  return Response.json({
    ok: true,
    from,
    to,
    totals: { count, order_totals, tax, discounts, shipping },
  });
}
