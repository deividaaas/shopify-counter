# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies (Node 18 or newer is required but no extra packages are needed).
2. Configure the environment variables. See the **Configuration** section below for details.
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

## Configuration

Copy `.env.example` to `.env` and provide values for the variables. The required fields specify the Shopify stores and their admin API tokens. Optional settings let you change the legacy counter URLs, whitelist additional hosts or supply an `API_KEY` to secure the endpoints. Refer to `.env.example` for the complete list of names.

## API Access

Set the `API_KEY` environment variable to restrict access to the `/api/shopify-counter` route. When a key is set, requests must include the same value in the `x-api-key` header or the API responds with `401 Unauthorized`. Leave `API_KEY` unset to allow unrestricted access.

### Usage

Filter the count by time period using the `period` query parameter:

- `/api/shopify-counter?period=month` – orders placed since the start of the current month
- `/api/shopify-counter?period=year` – orders placed since the start of the current year
- `/api/shopify-counter?period=all` – all orders regardless of date

If the `created_at_min` parameter is supplied it takes precedence over `period` and should contain an ISO timestamp.

## Running tests

Run the test suite with:

```bash
npm test
```

This command executes `node --test` under the hood.
