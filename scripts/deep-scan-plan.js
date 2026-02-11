const fs = require('fs');
const path = require('path');

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

const { SquareClient } = require("square");
const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function deepScan() {
    const TARGET_NAME = "Gold Membership Haircut + beard (TESTING $1)"; // Exact name from user screenshot

    try {
        console.log(`Deep Scanning for: "${TARGET_NAME}"...`);
        console.log("Env:", process.env.SQUARE_ENVIRONMENT);
        
        // Search Plans
        const planResponse = await client.catalog.search({
             objectTypes: ["SUBSCRIPTION_PLAN"],
             query: {
                 textFilter: TARGET_NAME
             }
        });
        
        const plans = (planResponse.result || planResponse).objects || [];
        console.log(`Found ${plans.length} PLANS.`);
        plans.forEach(p => {
            console.log("--- PLAN FOUND ---");
            console.log(JSON.stringify(p, null, 2));
        });

        // Search Items
        const itemResponse = await client.catalog.searchItems({
             textFilter: TARGET_NAME
        });
        const items = (itemResponse.result || itemResponse).items || [];
        console.log(`Found ${items.length} ITEMS.`);
         items.forEach(i => {
            console.log("--- ITEM FOUND ---");
            console.log(JSON.stringify(i, null, 2));
        });
        
    } catch (error) {
        console.error("Error scanning:", error);
    }
}

deepScan();
