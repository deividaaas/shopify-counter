// Node.js 18+ provides a global `fetch` implementation, so we no longer
// need the `node-fetch` dependency. Using the global version avoids
// install failures in environments without network access.

const URL_1 = "https://smiirl-shopify.herokuapp.com/c/096a519a-f432-48da-beb2-c0ae6438e9e1";
const URL_2 = "https://smiirl-shopify.herokuapp.com/c/7e429d3d-726a-44c8-9cae-b4dbe8e3f9bd";

module.exports = async (req, res) => {
    try {
        // Fetch data from both Shopify counters
        const [data1, data2] = await Promise.all([
            fetch(URL_1).then(res => res.json()),
            fetch(URL_2).then(res => res.json())
        ]);

        // Combine the numbers, ensuring numeric addition
        const count1 = parseInt(data1.number, 10) || 0;
        const count2 = parseInt(data2.number, 10) || 0;
        const total = count1 + count2;

        // Return the combined JSON for Smiirl
        res.json({ number: total });
    } catch (error) {
        // If an error occurs, return 0 to avoid breaking the counter
        res.json({ number: 0 });
    }
};
