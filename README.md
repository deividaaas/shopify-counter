# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies (none required besides Node 18+).
2. (Optional) Set the environment variables `URL_1` and `URL_2` with your Shopify counter endpoints.
   Defaults are included for testing.
3. Start the development server with `vercel dev`.
4. Open `index.html` in your browser to see the counter.

The page fetches `/api` every five seconds and animates the number toward the latest value.
Below the counter a progress bar shows progress toward today's goal with the current
sales value displayed inside the bar. Adjust the monthly goal using the slider or by
editing the number next to it. The progress bar changes color along with the counter to reflect progress.

The page now includes a small hamburger menu in the top-right corner for quick navigation links.
