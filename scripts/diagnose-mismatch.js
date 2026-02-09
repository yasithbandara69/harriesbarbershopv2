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

const SUB_ID = '83278187-2e78-40e3-86b8-7bfb5628198d';

async function diagnose() {
    console.log(`--- Inspecting Subscription: ${SUB_ID} ---`);
    try {
        const response = await squareClient.subscriptions.retrieve({ subscriptionId: SUB_ID });
        const sub = response.result?.subscription || response.body?.subscription;
        
        if (sub) {
            console.log("Subscription Plan ID:", sub.planId);
            console.log("Subscription Order Template ID:", sub.orderTemplateId);
            
            console.log("\n--- Listing ALL Catalog Plans to find match ---");
            const catalog = await squareClient.catalog.list({ types: 'SUBSCRIPTION_PLAN' });
            
            const plans = catalog.result?.objects || [];
            console.log(`Found ${plans.length} plans.`);
            
            plans.forEach(p => {
                const planData = p.subscriptionPlanData;
                const variations = planData.phases?.[0]?.ordinal; // Just checking structure
                
                // Check if this plan matches our subscription's planID
                const isMatch = p.id === sub.planId;
                
                console.log(`Plan: ${planData.name} (ID: ${p.id})`);
                if (isMatch) console.log("   *** MATCHES SUBSCRIPTION PLAN ID ***");
            });

        } else {
            console.log("Subscription not found.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

diagnose();
