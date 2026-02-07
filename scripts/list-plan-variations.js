const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Load Env
try {
  const envConfig = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.warn("Could not load .env.local", e);
}

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production, 
});

async function listPlanVariations() {
    console.log("Fetching Subscription Plans...");
    try {
        const response = await squareClient.catalog.searchCatalogObjects({
            objectTypes: ["SUBSCRIPTION_PLAN"],
            includeDeletedObjects: false
        });

        const result = response.result || response.body || response;
        if (result.objects) {
            result.objects.forEach(obj => {
                const planData = obj.subscriptionPlanData;
                console.log(`Plan: ${planData.name} | ID: ${obj.id}`);
                
                if (planData.subscriptionPlanVariations) {
                    planData.subscriptionPlanVariations.forEach(v => {
                        console.log(`   Variation ID: ${v.id} | Name: ${v.subscriptionPlanVariationData?.name}`);
                        // Check phases for price
                        const price = v.subscriptionPlanVariationData?.phases?.[0]?.recurringPriceMoney?.amount;
                        console.log(`   Price: ${price}`);
                    });
                }
                console.log('---');
            });
        }

    } catch (e) {
        console.error("Error fetching plans:", e);
    }
}

listPlanVariations();
