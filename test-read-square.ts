import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { squareClient } from './lib/square';

async function run() {
    try {
        console.log("Searching...");
        const res = await squareClient.customers.search({
            query: { filter: { emailAddress: { exact: "yasithbandara63@gmail.com" } } }
        });
        const customers = res.result?.customers || (res as any).customers || [];
        console.log("Found customer ID:", customers[0]?.id);
        console.log("Customer Address:", customers[0]?.address);
    } catch(e) {
        console.error(e);
    }
}
run();
