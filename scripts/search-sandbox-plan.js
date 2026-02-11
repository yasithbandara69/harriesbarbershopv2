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

const { SquareClient } = require("square");
// Force SANDBOX environment for this check
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN, // Use token from env (assuming it's reusable or user has correct env)
  environment: "https://connect.squareupsandbox.com", // Force sandbox
});

async function searchPlan() {
    const TARGET_NAME = "TESTING $1"; 

    try {
        console.log(`Searching for plan containing: "${TARGET_NAME}" in SANDBOX...`);
        
        // Search Plans
        let response = await client.catalog.search({
             objectTypes: ["SUBSCRIPTION_PLAN"],
             query: {
                 textFilter: TARGET_NAME
             }
        });

        const result = response.result || response;
        if (result.objects && result.objects.length > 0) {
            console.log("\n--- FOUND SANDBOX PLAN OBJECT ---");
            console.log(JSON.stringify(result.objects[0], null, 2));
            return;
        } 
        
        console.log("Not found in Sandbox Plans. Checking Sandbox Items...");
        
        // Search Items
        const itemRes = await client.catalog.searchItems({
             textFilter: TARGET_NAME
        });
        const itemResult = itemRes.result || itemRes;
        if (itemResult.items && itemResult.items.length > 0) {
             console.log("\n--- FOUND AS SANDBOX ITEM ---");
             console.log(JSON.stringify(itemResult.items[0], null, 2));
             return;
        }

        console.log("Not found in Sandbox.");
        
    } catch (error) {
        console.error("Error searching sandbox:", error);
    }
}

searchPlan();
