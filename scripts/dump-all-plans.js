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
const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function dumpAllPlans() {
    try {
        console.log("Dumping ALL Subscription Plans...");
        
        let allPlans = [];
        let cursor = undefined;
        
        do {
             const response = await client.catalog.search({
                objectTypes: ["SUBSCRIPTION_PLAN"],
                cursor: cursor
            });
            
            const result = response.result || response;
            const plans = result.objects || [];
            allPlans = allPlans.concat(plans);
            cursor = result.cursor;
            
        } while (cursor);

        console.log(`Found ${allPlans.length} total plans.`);
        
        const replacer = (key, value) => 
            typeof value === 'bigint' ? value.toString() : value;

        fs.writeFileSync('all_plans_dump.json', JSON.stringify(allPlans, replacer, 2));
        console.log("Wrote to all_plans_dump.json");

    } catch (error) {
        console.error(error);
    }
}

dumpAllPlans();
