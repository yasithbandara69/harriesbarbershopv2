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

async function inspectVariation() {
    const VARIATION_ID = "CAL3SGZYVTDQJFR6NY5R72OD";
    console.log(`Inspecting Variation: ${VARIATION_ID}...`);
    
    try {
        const response = await client.catalog.object.get({
            objectId: VARIATION_ID
        });
        
        const object = (response.result || response).object;
        
        const data = object.subscriptionPlanVariationData;
        
        console.log("--- Variation Data ---");
        console.log("Name:", data.name);
        console.log("Phases:", JSON.stringify(data.phases, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
        , 2));

        console.log("\n--- Full Object ---");
        console.log(JSON.stringify(object, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
        , 2));

    } catch (e) {
        console.error(e);
    }
}

inspectVariation();
