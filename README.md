# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies (Node 18 or newer is required but no extra packages are needed).
2. Set the environment variables `SHOPIFY_SHOP_1`, `SHOPIFY_ADMIN_TOKEN_1`, `SHOPIFY_SHOP_2` and `SHOPIFY_ADMIN_TOKEN_2` with your Shopify store domains and tokens. Copy `.env.example` to `.env` and replace the placeholder values.
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

## API Access

Set the `API_KEY` environment variable to restrict access to the `/api/shopify-counter` route. When a key is set, requests must include the same value in the `x-api-key` header or the API responds with `401 Unauthorized`. Leave `API_KEY` unset to allow unrestricted access.

## API Usage

The `/api/shopify-counter` endpoint accepts two optional query parameters. Use
`period` to choose a built‑in date range:

- `month` (default) &ndash; count orders from the first of the current month.
- `year` &ndash; count orders from the start of the current year.
- `all` &ndash; include all orders.

The calculated start date can be overridden with `created_at_min`, which accepts
an ISO 8601 timestamp.

Example requests:

```bash
curl 'https://example.com/api/shopify-counter?period=year'
curl 'https://example.com/api/shopify-counter?created_at_min=2024-04-01T00:00:00Z'
```

## Running tests

Run the test suite with:

```bash
npm test
```

This command executes `node --test` under the hood.
