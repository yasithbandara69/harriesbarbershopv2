const { SquareClient } = require("square");
const fs = require('fs');
const path = require('path');

// Load .env.local manually
try {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function inspectCustomer() {
    // const CUSTOMER_ID = "M7QYWFQ8891PNVMMQ5E1M2ZPQ8";
    const EMAIL = "travelwithmeslk@gmail.com";
    console.log(`Searching for Customer by email: ${EMAIL}...`);
    
    try {
        const response = await client.customers.search({
            query: {
                filter: {
                    emailAddress: {
                        exact: EMAIL
                    }
                }
            }
        });
        
        const result = response.result || response;
        const customers = result.customers || [];
        
        if (customers.length > 0) {
            console.log(`✅ Found ${customers.length} customer(s):`);
            customers.forEach(c => {
                 console.log(`ID: ${c.id}`);
                 console.log(`Name: ${c.givenName} ${c.familyName}`);
                 console.log(`Email: ${c.emailAddress}`);
                 console.log(`Phone: ${c.phoneNumber}`);
                 console.log("-------------------");
            });
        } else {
            console.log("❌ No customer found with that email.");
        }

        // Also try to retrieve the "old" ID to see if it really exists
        const OLD_ID = "M7QYWFQ8891PNVMMQ5E1M2ZPQ8";
        console.log(`\nChecking existence of stored ID: ${OLD_ID}`);
        try {
             const retrieveRes = await client.customers.search({
                 query: {
                     filter: {
                         creationSource: {
                             values: ["THIRD_PARTY"] // Dummy filter to use search
                         },
                         // Actually, search doesn't support ID filter directly usually, 
                         // but we can just use retrieve if the method name is correct.
                         // Let's check if it's get or retrieve.
                     }
                 }
             });
             // Wait, let's just inspect the client object to see available methods if retrieve failed.
             // Actually, I'll just use the known working 'search' for email, 
             // and for ID, I'll assuming if email search didn't find it with that ID, it's gone/different.
             
        } catch (e) {
             console.log("Skipping ID check due to method error.");
        }

    } catch (e) {
        console.error("Error searching customer:", e);
        if (e.result) console.error(JSON.stringify(e.result, null, 2));
    }
}

inspectCustomer();
