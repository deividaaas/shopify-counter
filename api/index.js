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
    try {

        // Fetch data from both Shopify counters
        const [data1, data2] = await Promise.all([
            fetch(URL_1).then(res => res.json()),
            fetch(URL_2).then(res => res.json())
        ]);

        // Combine the numbers
        const total = (data1.number || 0) + (data2.number || 0);

        // Return the combined JSON for Smiirl
        res.json({ number: total });
    } catch (error) {
        // If an error occurs, return 0 to avoid breaking the counter
        console.error('Failed to fetch counters', error);
        res.json({ number: 0 });
    }
};
