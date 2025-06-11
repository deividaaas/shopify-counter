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

    const urls = [];
    if (req.query?.url) {
        if (Array.isArray(req.query.url)) urls.push(...req.query.url);
        else urls.push(req.query.url);
    } else {
        if (req.query?.url1) urls.push(req.query.url1);
        if (req.query?.url2) urls.push(req.query.url2);
    }

    const valid = urls.filter(u => /^https?:\/\//.test(u));

    const source = req.query?.source;
    const include1 = !valid.length && (!source || source === 'both' || source === '1');
    const include2 = !valid.length && (!source || source === 'both' || source === '2');
    if (include1) valid.push(URL_1);
    if (include2) valid.push(URL_2);

    try {
        const fetches = valid.map(u => fetch(u).then(res => res.json()));
        const results = await Promise.all(fetches);
        const total = results.reduce((sum, d) => sum + (d.number || 0), 0);

        res.json({ number: total });
    } catch (error) {
        // If an error occurs, return 0 to avoid breaking the counter
        console.error('Failed to fetch counters', error);
        res.json({ number: 0 });
    }
};
