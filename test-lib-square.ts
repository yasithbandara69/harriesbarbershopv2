import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// @ts-ignore
import { SquareClient, Environment } from 'square';

const squareClient = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production,
});

async function run() {
    try {
        console.log("Searching...");
        const res = await squareClient.customers.search({
            query: { filter: { emailAddress: { exact: "yasithbandara63@gmail.com" } } }
        });
        const customers = res.result?.customers || (res as any).customers || [];
        console.log("Found customer ID:", customers[0]?.id);
        console.log("Customer Address:", customers[0]?.address);

        if (customers[0]) {
            console.log("Updating customer with postcode...");
            try {
                const updateRes = await squareClient.customers.update(customers[0].id, {
                    address: { postalCode: "5000", country: "AU" },
                    version: BigInt(customers[0].version)
                });
                const updatedCustomer = updateRes.result?.customer || (updateRes as any).customer || updateRes;
                console.log("Updated result Address:", updatedCustomer?.address);
            } catch(e: any) {
                console.error("Update failed:", JSON.stringify(e, null, 2));
                console.error("Errors:", e.errors || e.message);
            }
        }
    } catch(e) {
        console.error(e);
    }
}
run();
