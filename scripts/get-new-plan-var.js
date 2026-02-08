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

const PLAN_ID = '24DN6C7TY4LKNL4KZITSM2GW';

async function getPlanVariation() {
    console.log(`Fetching Plan: ${PLAN_ID}...`);
    try {
        const res = await squareClient.catalog.object.get({ objectId: PLAN_ID });
        const plan = res.result?.object || res.body?.object || res.object;

        if (plan) {
            const varId = plan.subscriptionPlanData.subscriptionPlanVariations[0].id;
            console.log("Variation ID:", varId);
            console.log("Plan Name:", plan.subscriptionPlanData.name);
            console.log("Price:", plan.subscriptionPlanData.subscriptionPlanVariations[0].subscriptionPlanVariationData.phases[0].pricing.priceMoney.amount);
        } else {
            console.log("Plan not found.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

getPlanVariation();
