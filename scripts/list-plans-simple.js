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

async function listPlans() {
    console.log(`--- Listing All Catalog Items (Plans & Variations) ---`);
    try {
        // Try listing both PLAN and VARIATION types
        const response = await squareClient.catalog.list({ types: 'SUBSCRIPTION_PLAN,SUBSCRIPTION_PLAN_VARIATION' });
        const objects = response.result?.objects || [];
        
        console.log(`Found ${objects.length} catalog objects.`);
        
        objects.forEach(obj => {
            console.log(`\nTYPE: ${obj.type}`);
            console.log(`ID: ${obj.id}`);
            
            if (obj.subscriptionPlanData) {
                console.log(`NAME: ${obj.subscriptionPlanData.name}`);
            }
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

listPlans();
