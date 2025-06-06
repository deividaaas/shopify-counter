# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies (none required besides Node 18+).
2. Set the environment variables `URL_1` and `URL_2` with your Shopify counter endpoints.
3. Start the development server with a tool like `vercel dev` or `node api/index.js`.
4. Open `index.html` in your browser to see the counter.

The page fetches `/api` every five seconds and animates the number toward the latest value.
