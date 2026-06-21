require('dotenv').config({ path: '.env.local' });
const { SquareClient } = require('square');

const squareClient = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: "production",
});

async function run() {
    try {
        console.log("Searching for customer...");
        const res = await squareClient.customers.search({
            query: { filter: { emailAddress: { exact: "yasithbandara63@gmail.com" } } }
        });
        const customers = res.result?.customers || res.customers || [];
        console.log("Found:", customers[0]);

        if (customers[0]) {
            console.log("Updating customer with postcode...");
            try {
                const updateRes = await squareClient.customers.update(customers[0].id, {
                    address: { postalCode: "1234", country: "AU" },
                    version: BigInt(customers[0].version)
                });
                console.log("Updated result:", updateRes.result?.customer || updateRes.customer || updateRes);
            } catch(e) {
                console.error("Update failed:", JSON.stringify(e, null, 2));
                console.error("Errors:", e.errors || e.message);
            }
        }
    } catch(e) {
        console.error(e);
    }
}
run();
