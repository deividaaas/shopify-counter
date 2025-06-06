
const URL_1 = "https://smiirl-shopify.herokuapp.com/c/096a519a-f432-48da-beb2-c0ae6438e9e1";
const URL_2 = "https://smiirl-shopify.herokuapp.com/c/7e429d3d-726a-44c8-9cae-b4dbe8e3f9bd";

module.exports = async (req, res) => {
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
        res.json({ number: 0 });
    }
};
