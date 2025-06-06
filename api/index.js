const URL_1 = process.env.URL_1;
const URL_2 = process.env.URL_2;

module.exports = async (req, res) => {
    try {
        if (!URL_1 || !URL_2) {
            throw new Error('Missing URL_1 or URL_2 environment variables');
        }

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
