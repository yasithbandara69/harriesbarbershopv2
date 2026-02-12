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

async function linkGoldItem() {
    const PLAN_ID = 'EJGEEVYKOZMCQHWCLZI7MA4Z';
    const ITEM_VARIATION_ID = 'MN74NI7HDAD56CGSQHATYX75';

    console.log(`Linking Item Variation ${ITEM_VARIATION_ID} to Plan ${PLAN_ID}...`);

    try {
        // 1. Get the Item ID from the Variation ID
        const varRes = await client.catalog.object.get({
            objectId: ITEM_VARIATION_ID
        });
        
        const variation = (varRes.result || varRes).object;
        if (!variation) {
             console.error(`Error: Variation object not found for ${ITEM_VARIATION_ID}`);
             return;
        }
        
        const itemId = variation.itemVariationData.itemId;
        console.log(`  > Found Item ID: ${itemId}`);

        // 2. Get the Plan to get current version
        const planRes = await client.catalog.object.get({
            objectId: PLAN_ID
        });
        const plan = (planRes.result || planRes).object;
        
         if (!plan) {
             console.error(`Error: Plan object not found for ${PLAN_ID}`);
             return;
        }

        // 3. Update the Plan with eligibleItemIds
        const updateRes = await client.catalog.object.upsert({
            idempotencyKey: new Date().toISOString(), 
            object: {
                type: "SUBSCRIPTION_PLAN",
                id: PLAN_ID,
                version: plan.version,
                subscriptionPlanData: {
                    ...plan.subscriptionPlanData,
                    eligibleItemIds: [itemId]
                }
            }
        });

        const updatedPlan = (updateRes.result || updateRes).catalogObject || (updateRes.result || updateRes).object;
        
        if (updatedPlan) {
            console.log(`✅ Successfully Linked!`);
            console.log(`Plan ID: ${updatedPlan.id}`);
            console.log(`Linked Item IDs: ${JSON.stringify(updatedPlan.subscriptionPlanData.eligibleItemIds)}`);
        } else {
            console.error("Failed to update plan.");
        }

    } catch (error) {
        console.error("Error linking item:", error);
         if (error.body) console.error(JSON.stringify(error.body, null, 2));
    }
}

linkGoldItem();
