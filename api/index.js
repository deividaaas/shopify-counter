// Shopify counter endpoints. Environment variables override the defaults
const URL_1 = process.env.URL_1 ||
    'https://smiirl-shopify.herokuapp.com/c/096a519a-f432-48da-beb2-c0ae6438e9e1';
const URL_2 = process.env.URL_2 ||
    'https://smiirl-shopify.herokuapp.com/c/7e429d3d-726a-44c8-9cae-b4dbe8e3f9bd';


module.exports = async (req, res) => {
    const requiredKey = process.env.API_KEY;
    if (requiredKey && req.headers['x-api-key'] !== requiredKey) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // If "url" query params are provided, use them directly.
    // Supports repeated "url" parameters for multiple endpoints.
    let urls = [];
    if (req.query?.url) {
        const provided = Array.isArray(req.query.url)
            ? req.query.url
            : [req.query.url];
        urls = provided.filter(u => /^https?:\/\//.test(u));
    } else {
        // Determine which default sources to include based on query parameter
        const source = req.query?.source;
        const include1 = !source || source === 'both' || source === '1';
        const include2 = !source || source === 'both' || source === '2';

        // Build list of URLs to fetch, using query params when valid
        if (include1) {
            const u = req.query?.url1 && /^https?:\/\//.test(req.query.url1)
                ? req.query.url1
                : URL_1;
            urls.push(u);
        }
        if (include2) {
            const u = req.query?.url2 && /^https?:\/\//.test(req.query.url2)
                ? req.query.url2
                : URL_2;
            urls.push(u);
        }
    }

    if (!urls.length) {
        res.json({ number: 0 });
        return;
    }

    try {
        const timeout = parseInt(process.env.FETCH_TIMEOUT_MS || '3000', 10);
        const fetchWithTimeout = async (url) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);
            try {
                const res = await fetch(url, { signal: controller.signal });
                return await res.json();
            } finally {
                clearTimeout(timer);
            }
        };

        const fetches = urls.map(u => fetchWithTimeout(u));
        const results = await Promise.all(fetches);
        const total = results.reduce((sum, d) => sum + (d.number || 0), 0);

        res.json({ number: total });
    } catch (error) {
        // If an error occurs, return 0 to avoid breaking the counter
        if (error.name === 'AbortError') {
            console.error('Fetch timed out');
        } else {
            console.error('Failed to fetch counters', error);
        }
        res.json({ number: 0 });
    }
};
