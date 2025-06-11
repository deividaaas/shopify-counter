# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies (Node 18 or newer is required but no extra packages are needed).
2. (Optional) Set the environment variables `URL_1` and `URL_2` with your Shopify counter endpoints.
   Defaults are included for testing.
3. Start the development server with `vercel dev`.
4. Open `index.html` in your browser to see the counter.
5. You can also specify custom counter URLs on the **Settings** page. Enter them in the
   fields labelled *Counter URL 1* and *Counter URL 2*. They are stored in
   `localStorage` under `counterUrl1` and `counterUrl2` and will be used on subsequent
   visits.

The page fetches `/api` every five seconds and animates the number toward the latest value.
Below the counter a progress bar shows progress toward today's goal with the current
sales value displayed inside the bar. Adjust the monthly goal using the slider or by
editing the number next to it. The progress bar changes color along with the counter to reflect progress.

The page now includes a small hamburger menu in the top-right corner for quick navigation links.
Use the **Settings** link in that menu to open a page with a table for recording monthly goals for the year.
Each month's goal is stored separately in `localStorage`. When the month changes the counter page reads the goal for that month so the values persist without a backend.
