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

async function listAllPlans() {
    try {
        console.log("Listing ALL Subscription Plans (via Search)...");
        console.log("Env:", process.env.SQUARE_ENVIRONMENT);
        
        const response = await client.catalog.search({
            objectTypes: ["SUBSCRIPTION_PLAN"]
        });

        const result = response.result || response;
        const plans = result.objects || [];

        console.log(`Found ${plans.length} total plans.`);


        fs.writeFileSync('all_plans.json', JSON.stringify(plans, null, 2));
        console.log(`Wrote ${plans.length} plans to all_plans.json`);

        console.log("--- PLAN LIST ---");
        plans.forEach(p => {
             const phases = p.subscriptionPlanData.phases || [];
             const price = phases.length > 0 ? (Number(phases[0].recurringPriceMoney.amount) / 100).toFixed(2) : "N/A";
             const cadence = phases.length > 0 ? phases[0].cadence : "UNKNOWN";
             
            console.log(`Name: ${p.subscriptionPlanData.name} | Price: $${price} | Freq: ${cadence} | ID: ${p.id} | Deleted: ${p.isDeleted}`);
        });

    } catch (error) {
        console.error(error);
    }
}

listAllPlans();
