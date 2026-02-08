const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// ID of the item I just created successfully
const NEW_ITEM_ID = 'SSBAYFYLFPOGG6WESVR2JPL5'; 
const TARGET_PLAN_NAME = 'Gold Membership Haircut + beard';

async function fixSubscriptionLink() {
    console.log("Starting Linkage Fix...");
    
    try {
        console.log(`Searching for Plan: "${TARGET_PLAN_NAME}"...`);
        
        const listRes = await squareClient.catalog.list({ types: 'SUBSCRIPTION_PLAN' });
        let objects = [];
        if (listRes.result && listRes.result.objects) objects = listRes.result.objects;
        else if (listRes.body && listRes.body.objects) objects = listRes.body.objects;
        else if (listRes.response && listRes.response.objects) objects = listRes.response.objects;

        const planObj = objects.find(o => o.subscriptionPlanData.name === TARGET_PLAN_NAME);

        if (!planObj) {
            console.error("Could not find subscription plan by name.");
            console.log("Available Plans:", objects.map(o => o.subscriptionPlanData.name));
            return;
        }

        console.log(`Found Plan ID: ${planObj.id}`);
        console.log(`Current Plan Version: ${planObj.version}`);
        console.log(`Current Eligible Items: ${planObj.subscriptionPlanData.eligibleItemIds}`);

        // Update Plan to use new Item ID
        const updatedPlan = {
            ...planObj,
            subscriptionPlanData: {
                ...planObj.subscriptionPlanData,
                eligibleItemIds: [NEW_ITEM_ID]
            }
        };

        console.log(`Updating Plan to use Item ID: ${NEW_ITEM_ID}...`);

        const updateRes = await squareClient.catalog.object.upsert({
            idempotencyKey: crypto.randomUUID(),
            object: updatedPlan
        });

        const finalPlan = updateRes.result?.catalogObject || updateRes.body?.catalogObject || updateRes.catalogObject;

        if (finalPlan) {
            console.log("SUCCESS! Plan updated.");
            console.log("New Plan Version:", finalPlan.version);
            console.log("Linked Item IDs:", finalPlan.subscriptionPlanData.eligibleItemIds);
        } else {
            console.error("Failed to update plan.");
             console.log("Result:", JSON.stringify(updateRes.result || updateRes.body));
        }

    } catch (e) {
        console.error("Error executing fix:");
        if (e.body) console.log(JSON.stringify(e.body, null, 2));
        else console.log(e);
    }
}

fixSubscriptionLink();
