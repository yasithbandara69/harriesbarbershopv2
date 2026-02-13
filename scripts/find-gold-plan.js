const { SquareClient } = require("square");
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

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function findGoldPlan() {
    console.log("Searching for plans with 'Gold' in name...");
    try {
        const response = await client.catalog.search({
            objectTypes: ["SUBSCRIPTION_PLAN"],
            query: {
                textQuery: {
                    keywords: ["Gold"]
                }
            }
        });
        
        const result = response.result || response;
        if (result.objects) {
            result.objects.forEach(plan => {
                console.log(`\n--- Found Plan ---`);
                console.log(`Name: ${plan.subscriptionPlanData.name}`);
                console.log(`Plan ID: ${plan.id}`);
                console.log(`Items: ${JSON.stringify(plan.subscriptionPlanData.eligibleItemIds)}`);
                if (plan.subscriptionPlanData.subscriptionPlanVariations) {
                     plan.subscriptionPlanData.subscriptionPlanVariations.forEach(v => {
                         console.log(`  - Variation Name: ${v.subscriptionPlanVariationData.name}`);
                         console.log(`    Variation ID: ${v.id}`);
                     });
                }
            });
        } else {
            console.log("No plans found.");
        }
    } catch (e) {
        console.error(e);
    }
}

findGoldPlan();
