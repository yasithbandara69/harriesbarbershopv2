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
    const CUSTOMER_ID = "M7QYWFQ8891PNVMMQ5E1M2ZPQ8";
    console.log(`Inspecting Customer: ${CUSTOMER_ID}...`);
    
    try {
        const response = await client.customers.retrieve(CUSTOMER_ID);
        const customer = (response.result || response).customer;
        
        console.log(JSON.stringify(customer, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
        , 2));

    } catch (e) {
        console.error("Error retrieving customer:", e);
        if (e.result) console.error(JSON.stringify(e.result, null, 2));
    }
}

inspectCustomer();
