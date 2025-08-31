# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies with `npm install` (Node 18 or newer is required). This includes the Vercel CLI for running the development server.
2. Set the environment variables `SHOPIFY_SHOP` and `SHOPIFY_TOKEN` (and optionally `SHOPIFY_API_VERSION`). `SHOPIFY_SHOP` is your `myshopify.com` domain and `SHOPIFY_TOKEN` is an admin API token with the `read_orders` scope. Copy `.env.example` to `.env` and replace the placeholder values. Define the same variables in your Vercel project to use them in deployed environments.
3. (Optional) You can still use `URL_1` and `URL_2` for the original counter endpoints.
4. Start the development server with `vercel dev`.
5. Open `index.html` in your browser to see the counter.
6. You can also specify custom counter URLs on the **Settings** page. Enter them in the
   fields labelled *Counter URL 1* and *Counter URL 2*. They are stored in
   `localStorage` under `counterUrl1` and `counterUrl2` and will be used on subsequent
   visits.

The page fetches `/api/sales` every five seconds and animates the number toward the latest value.
Below the counter a progress bar shows progress toward today's goal with the current
sales value displayed inside the bar. Adjust the monthly goal using the slider or by
editing the number next to it. The progress bar changes color along with the counter to reflect progress.

The page now includes a small hamburger menu in the top-right corner for quick navigation links.
Use the **Settings** link in that menu to open a page with a table for recording monthly goals for the year.
Each month's goal is stored separately in `localStorage`. When the month changes the counter page reads the goal for that month so the values persist without a backend.

A new date-range selector lets you pick custom start and end dates. When used, the counter page adds `from` and `to` query parameters to requests so only orders within that range are counted.

## API Access

Set the `API_KEY` environment variable to restrict access to the `/api` route handled by `api/index.js`. When a key is set, requests must include the same value in the `x-api-key` header or the API responds with `401 Unauthorized`. Leave `API_KEY` unset to allow unrestricted access.

## API Usage

The `/api/sales` endpoint accepts `from`, `to` and an optional `shop` query parameter. `from` and `to` are ISO 8601 timestamps limiting the order range.

Example request:

```bash
curl 'https://example.com/api/sales?from=2024-04-01T00:00:00Z&to=2024-04-30T23:59:59Z'
```

The API returns sales totals per shop and overall:

```json
{
  "ok": true,
  "total": {
    "count": 42,
    "order_totals": 123.45,
    "tax": 1.23,
    "discounts": 0,
    "shipping": 4.56
  }
}
```

## Running tests

Run the test suite with:

```bash
npm test
```

This command executes `node --test` under the hood.

## Troubleshooting production

Follow these steps if the API does not return the expected totals after deployment:

1. In Vercel, ensure `SHOPIFY_SHOP`, `SHOPIFY_TOKEN` and optionally `SHOPIFY_API_VERSION` are defined for both *Production* and *Preview* environments. Redeploy after updating variables.
2. Check the Vercel **Runtime Logs** for messages such as `Shopify HTTP error` or `Invalid JSON from Shopify`.
3. Test the production endpoint directly:

   ```bash
   curl 'https://<your-domain>/api/sales?from=2024-04-01T00:00:00Z&to=2024-04-30T23:59:59Z'
   ```

   The response should contain real totals from Shopify, not placeholder numbers.

## Slik feilsøker du API-integrasjon

1. Test Shopify-API direkte for butikken:

   ```bash
   curl -H "X-Shopify-Access-Token: <TOKEN>" \
     https://<SHOP>.myshopify.com/admin/api/2025-07/orders/count.json
   ```

   Svaret bør være på formen `{ "count": n }`. Hvis du ikke får et gyldig tall,
   må tokenet kontrolleres eller regenereres.
2. Når `/api/sales` henter data logges responsen fra Shopify i Vercel Runtime Logs
   sammen med statuskode, content-type og et kort utsnitt av bodyen.
3. Hvis API-kallet mislykkes eller returnerer urealistisk store tall, sender
   backend en feilmelding med `ok: false`.
4. Sjekk antall ordre i Shopify Admin for valgt periode og sammenlign med
   verdien fra `/api/sales`. Tallene skal matche.
