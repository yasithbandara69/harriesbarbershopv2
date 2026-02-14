const { SquareClient } = require('square');
const fs = require('fs');
const path = require('path');

// 1. Load Env
try {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
} catch (e) {}

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function main() {
    const targetEmail = "jonathanweerasekara@gmail.com";
    
    console.log(`=== DEBUGGING ACTIVITY FOR: ${targetEmail} ===`);
    console.log(`Token Prefix: ${process.env.SQUARE_ACCESS_TOKEN.substring(0, 10)}...`);
    console.log(`Location ID: ${process.env.SQUARE_LOCATION_ID}`);

    try {
        // 1. Search Customers
        console.log("\nSearching for customers...");
        const response = await squareClient.customers.search({
            query: {
                filter: {
                    emailAddress: {
                        exact: targetEmail
                    }
                }
            }
        });
        
        let customers = response.result?.customers || response.body?.customers || response.customers || response.data?.customers || [];
        if ((!customers || customers.length === 0) && response.data && Array.isArray(response.data)) {
            customers = response.data;
        }
        
        if (!customers || customers.length === 0) {
            console.log("No customers found with this email.");
            console.log("Response Keys:", Object.keys(response));
        } else {
            console.log(`Found ${customers.length} customer profiles:`);
            customers.forEach(c => {
                console.log(`- ID: ${c.id} | Name: ${c.givenName} ${c.familyName} | Created: ${c.createdAt}`);
            });
        }

        // 2. List Recent Bookings
        console.log("\nListing 5 most recent bookings for location...");
        try {
            // Using list query logic from previous scripts for robustness
             let response;
             if (squareClient.bookings.listBookings) {
                 response = await squareClient.bookings.listBookings(undefined, undefined, undefined, undefined, process.env.SQUARE_LOCATION_ID);
             } else {
                 response = await squareClient.bookings.list({ 
                     locationId: process.env.SQUARE_LOCATION_ID 
                 });
             }
             
             let bookings = response.result?.bookings || response.body?.bookings || response.bookings || response.data?.bookings || [];
             if ((!bookings || bookings.length === 0) && response.data && Array.isArray(response.data)) {
                 bookings = response.data;
             }
             
             // Sort by Created At descending if possible, or just take first 5
             // list() usually returns by startAt ascending? No, usually unordered or by ID.
             // We can't easily sort without fetching all. Just logging what we get.
             // Better: Search bookings? No, list is safer.
             
             console.log(`Found ${bookings.length} total bookings returned.`);
             const recent = bookings.slice(0, 5);
             recent.forEach(b => {
                 console.log(`- ID: ${b.id} | Cust: ${b.customerId} | Start: ${b.startAt} | Status: ${b.status}`);
             });

        } catch (e) {
            console.log("Error listing bookings:", e.message);
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

main();
