import pkg from 'square';
const { Client, Environment } = pkg;
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production,
});

async function run() {
    try {
        console.log("Searching...");
        const res = await squareClient.customers.search({
            query: { filter: { emailAddress: { exact: "yasithbandara63@gmail.com" } } }
        });
        const customers = res.result?.customers || res.customers || [];
        console.log("Found:", customers[0]);

        if (customers[0]) {
            console.log("Updating...");
            try {
                const updateRes = await squareClient.customers.update(customers[0].id, {
                    address: { postalCode: "1234" },
                    version: customers[0].version
                });
                console.log("Updated result:", updateRes.result?.customer || updateRes.customer);
            } catch(e) {
                console.error("Update failed:", e.errors || e.message);
            }
        }
    } catch(e) {
        console.error(e);
    }
}
run();
