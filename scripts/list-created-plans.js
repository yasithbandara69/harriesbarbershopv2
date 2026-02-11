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

async function listPlans() {
    try {
        console.log("Listing Subscription Plans (via Search)...");
        console.log("Env:", process.env.SQUARE_ENVIRONMENT);
        
        const response = await client.catalog.search({
            objectTypes: ["SUBSCRIPTION_PLAN"]
        });

        const result = response.result || response;
        const plans = result.objects || [];

        console.log(`Found ${plans.length} plans.`);
        
        // Also list Items to find the variations
        const itemResponse = await client.catalog.searchItems({
             textFilter: "Membership"
        });
        const itemResult = itemResponse.result || itemResponse;
        const items = itemResult.items || [];
        
        console.log(`Found ${items.length} related items.`);

        const targetNames = [
            "Gold Membership Haircut (TESTING $1)", 
            "Platinum Membership Haircut (TESTING $1)", 
            "Platinum Membership Haircut + Beard (TESTING $1)"
        ];

        const results = [];
        
        targetNames.forEach(name => {
            const plan = plans.find(p => p.subscriptionPlanData.name === name && !p.isDeleted);
            // Search items loosely
            const item = items.find(i => i.itemData.name && i.itemData.name.includes(name) && !i.isDeleted);
            
            if (plan) {
                const res = {
                    name: name,
                    squarePlanId: plan.id,
                    itemVariationId: item ? item.itemData.variations[0].id : "NOT FOUND"
                };
                results.push(res);
            }
        });
        
        fs.writeFileSync('created_plans.json', JSON.stringify(results, null, 2));
        console.log("Wrote results to created_plans.json");

    } catch (error) {
        console.error(error);
    }
}

listPlans();
