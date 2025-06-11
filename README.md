# Shopify Counter

This simple project displays a counter on a web page and updates it from a serverless API.

## Setup

1. Install dependencies (none required besides Node 18+).
2. (Optional) Set the environment variables `URL_1` and `URL_2` with your Shopify counter endpoints.
   Defaults are included for testing.
3. Start the development server with `vercel dev`.
4. Open `index.html` in your browser to see the counter.
5. The **Settings** page lets you define any number of custom counter endpoints.
   Each entry has a name and a URL and the list is saved in `localStorage` under
   `counterApis`. The names appear on the home page where you can toggle each API
   on or off.

The page fetches `/api` every five seconds and animates the number toward the latest value.
Below the counter a progress bar shows progress toward today's goal with the current
sales value displayed inside the bar. Adjust the monthly goal using the slider or by
editing the number next to it. The progress bar changes color along with the counter to reflect progress.

The page now includes a small hamburger menu in the top-right corner for quick navigation links.
Use the **Settings** link in that menu to open a page with a table for recording monthly goals for the year.
Each month's goal is stored separately in `localStorage`. When the month changes the counter page reads the goal for that month so the values persist without a backend.
