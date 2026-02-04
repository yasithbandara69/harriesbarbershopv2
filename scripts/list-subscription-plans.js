
const { SquareClient, SquareEnvironment } = require("square");
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
console.log(`Environment: ${isProduction ? 'Production' : 'Sandbox'}`);

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function listPlans() {
  try {
    console.log("Listing Subscription Plans and Variations...");
    const response = await squareClient.catalog.list({ types: 'SUBSCRIPTION_PLAN,SUBSCRIPTION_PLAN_VARIATION' });
    
    const objects = response.response ? response.response.objects : (response.result ? response.result.objects : []);
    
    if (objects) {
      console.log(`Found ${objects.length} objects.`);
      objects.forEach(obj => {
        const name = obj.subscriptionPlanData?.name || obj.subscriptionPlanVariationData?.name || 'Unknown';
        console.log(`Type: ${obj.type}`);
        console.log(`Name: ${name}`);
        console.log(`ID: ${obj.id}`);
        if (obj.type === 'SUBSCRIPTION_PLAN_VARIATION') {
             console.log(`Parent Plan ID: ${obj.subscriptionPlanVariationData?.subscriptionPlanId}`);
             const phases = obj.subscriptionPlanVariationData?.phases;
             if (phases && phases.length > 0) {
                 const price = phases[0].recurringPriceMoney;
                 if (price) {
                     console.log(`Price: ${price.amount} ${price.currency}`);
                 } else {
                     console.log(`Price: NOT SET`);
                 }
             } else {
                 console.log(`Price: No Phases`);
             }
        }
        console.log('---');
      });
    } else {
       console.log("No objects found.");
    }

  } catch (error) {
    console.error("Error listing catalog:", error.message);
  }
}

listPlans();
