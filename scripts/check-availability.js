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

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const ITEM_VAR_ID = "MN74NI7HDAD56CGSQHATYX75";
const PLAN_VAR_ID = "CAL3SGZYVTDQJFR6NY5R72OD";

async function checkAvailability() {
    console.log(`Checking Availability for Location: ${LOCATION_ID}`);

    try {
        // Check Item Variation
        const itemRes = await client.catalog.object.get({ objectId: ITEM_VAR_ID });
        const itemVar = (itemRes.result || itemRes).object;
        
        console.log("\n--- Item Variation ---");
        console.log(`ID: ${itemVar.id}`);
        console.log(`Present at all locations: ${itemVar.presentAtAllLocations}`);
        console.log(`Present at location IDs: ${JSON.stringify(itemVar.presentAtLocationIds)}`);

        // Check Plan Variation
        const planRes = await client.catalog.object.get({ objectId: PLAN_VAR_ID });
        const planVar = (planRes.result || planRes).object;

        console.log("\n--- Plan Variation ---");
        console.log(`ID: ${planVar.id}`);
        console.log(`Present at all locations: ${planVar.presentAtAllLocations}`);
        console.log(`Present at location IDs: ${JSON.stringify(planVar.presentAtLocationIds)}`);
        
    } catch (e) {
        console.error("Error:", e);
    }
}

checkAvailability();
