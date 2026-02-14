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
    // The ID from the screenshot (Dhanushan)
    const customerId = "1TA678QYF0PM7FF9MYAH5W7A64"; 
    
    console.log(`=== CHECKING APPOINTMENTS FOR: ${customerId} ===`);
    console.log(`Token Prefix: ${process.env.SQUARE_ACCESS_TOKEN.substring(0, 10)}...`);

    try {
        let bookings = [];
        let response;
        
        // Use v30+ robust logic
        if (squareClient.bookings.listBookings) {
             console.log("Using listBookings...");
             response = await squareClient.bookings.listBookings(undefined, undefined, customerId);
        } else {
             console.log("Using list...");
             try {
                 response = await squareClient.bookings.list({ customerId });
                 console.log("Successful call with object params.");
             } catch (e) {
                 console.log("Object param failed, retrying positional...", e.message);
                 response = await squareClient.bookings.list(undefined, undefined, customerId);
                 console.log("Successful call with positional params.");
             }
        }
        
        bookings = response.result?.bookings || response.body?.bookings || response.bookings || response.data?.bookings || [];
        
        if ((!bookings || bookings.length === 0) && response.data && Array.isArray(response.data)) {
             console.log("Found bookings in response.data directly.");
             bookings = response.data;
        }

        if (!bookings || bookings.length === 0) {
             console.log("No bookings found via API.");
             console.log("Response Keys:", Object.keys(response));
        } else {
            console.log(`\nFound ${bookings.length} bookings:`);
            const now = new Date();
            bookings.forEach(b => {
                const start = new Date(b.startAt);
                const isFuture = start > now;
                console.log(`- ID: ${b.id}`);
                console.log(`  Start: ${b.startAt} (${isFuture ? 'FUTURE' : 'PAST'})`);
                console.log(`  Status: ${b.status}`);
            });
        }

    } catch (e) {
        console.error("Error checking bookings:", e.message);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

main();
