# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies with `npm install` (Node 18 or newer is required). This includes the Vercel CLI for running the development server.
2. Set the environment variables `ALLOWED_SHOPS`, `SHOPIFY_API_VERSION` and one `SHOPIFY_TOKEN__<SHOP>` for each store. `ALLOWED_SHOPS` is a comma-separated list of `myshopify.com` domains. Tokens follow the naming rule `SHOPIFY_TOKEN__` + uppercased shop domain with punctuation replaced by underscores (e.g. `SHOPIFY_TOKEN__SHOP1_MYSHOPIFY_COM`). Copy `.env.example` to `.env` and replace the placeholder values. Define the same variables in your Vercel project to use them in deployed environments.
3. (Optional) You can still use `URL_1` and `URL_2` for the original counter endpoints.
4. Start the development server with `vercel dev`.
5. Open `index.html` in your browser to see the counter.
6. You can also specify custom counter URLs on the **Settings** page. Enter them in the
   fields labelled *Counter URL 1* and *Counter URL 2*. They are stored in
   `localStorage` under `counterUrl1` and `counterUrl2` and will be used on subsequent
   visits.

The page fetches `/api/shopify-counter` every five seconds and animates the number toward the latest value.
Below the counter a progress bar shows progress toward today's goal with the current
sales value displayed inside the bar. Adjust the monthly goal using the slider or by
editing the number next to it. The progress bar changes color along with the counter to reflect progress.

The page now includes a small hamburger menu in the top-right corner for quick navigation links.
Use the **Settings** link in that menu to open a page with a table for recording monthly goals for the year.
Each month's goal is stored separately in `localStorage`. When the month changes the counter page reads the goal for that month so the values persist without a backend.

A new date-range selector lets you pick custom start and end dates. When used, the counter page adds `created_at_min` and `created_at_max` query parameters to requests so only orders within that range are counted.

## API Access

Set the `API_KEY` environment variable to restrict access to the `/api/shopify-counter` route. When a key is set, requests must include the same value in the `x-api-key` header or the API responds with `401 Unauthorized`. Leave `API_KEY` unset to allow unrestricted access.

## API Usage

The `/api/shopify-counter` endpoint supports several optional query parameters.
Use `period` to choose a built‑in date range:

- `month` (default) &ndash; count orders from the first of the current month.
- `year` &ndash; count orders from the start of the current year.
- `all` &ndash; include all orders.

The calculated start date can be overridden with `created_at_min`, which accepts
an ISO 8601 timestamp. Provide `created_at_max` as well to limit the range
to orders created before that time. Both parameters use ISO 8601.

Example requests:

```bash
curl 'https://example.com/api/shopify-counter?period=year'
curl 'https://example.com/api/shopify-counter?created_at_min=2024-04-01T00:00:00Z'
curl 'https://example.com/api/shopify-counter?created_at_min=2024-04-01T00:00:00Z&created_at_max=2024-04-30T23:59:59Z'
```

The API returns the combined order count along with counts for each shop:

```json
{
  "number": 42,
  "shop1.myshopify.com": 21,
  "shop2.myshopify.com": 21
}
```

## Running tests

Run the test suite with:

```bash
npm test
```

This command executes `node --test` under the hood.

## Troubleshooting production

Follow these steps if the API does not return the expected counts after deployment:

1. In Vercel, ensure `ALLOWED_SHOPS`, `SHOPIFY_API_VERSION` and one `SHOPIFY_TOKEN__<SHOP>` variable per shop are defined for both *Production* and *Preview* environments. The shop values must be your `myshopify.com` domains without `https://`, and the tokens must be valid admin tokens.
2. Confirm that the tokens include the `read_orders` scope and that the app is
   installed and active in each store.
3. After updating any variables, trigger a redeploy so the new values are
   available to the serverless function.
4. Check the Vercel **Runtime Logs** for messages such as `Unauthorized`,
   `Missing env variable`, `Failed to fetch` or `count: 0` when calling
   `/api/shopify-counter`.
5. Test the production endpoint directly:

   ```bash
   curl 'https://<your-domain>/api/shopify-counter?period=month'
   ```

   The response should contain real counts from Shopify, not placeholder
   numbers.
6. If something fails, log the problem clearly and return a meaningful error
   response instead of dummy values.

When counting orders the API now sends the query parameter `status=any` so that
archived and closed orders are included. Make sure your admin tokens have the
`read_orders` scope.

## Slik feilsøker du API-integrasjon

1. Test Shopify-API direkte for hver butikk:

   ```bash
   curl -H "X-Shopify-Access-Token: <TOKEN>" \
     https://<SHOP>.myshopify.com/admin/api/2025-07/orders/count.json
   ```

   Svaret bør være på formen `{ "count": n }`. Hvis du ikke får et gyldig tall,
   må tokenet kontrolleres eller regenereres.
2. Når `fetchCount` kjøres logges responsen fra Shopify til Vercel Runtime Logs
   sammen med hvilken URL og de første tegnene i tokenet som brukes. Se loggene
   for statuskode og JSON som returneres.
3. Hvis API-kallet mislykkes eller returnerer urealistisk store tall, sender
   backend en feilmelding og `number: 0`. Frontend oppdaterer telleren til 0 når
   dette skjer.
4. Sjekk antall ordre i Shopify Admin for valgt periode og sammenlign med
   verdien fra `/api/shopify-counter`. Tallene skal matche.
5. På enkelte butikker kan det være nødvendig å installere appen på nytt eller opprette en ny token for API-brukeren dersom eksisterende token er utdatert.
