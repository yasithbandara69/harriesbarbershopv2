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

const PLAN_ID = 'BJKQSNDFNBZHBDXMSF43F7I3'; // Gold Membership Haircut + beard

async function fixSubscriptionItem() {
    console.log("Starting Fix for Subscription Item Availability...");
    
    try {
        // Step 1: Create the new "Membership" Item
        console.log("Creating new Regular Item: 'Gold Membership - Billing'...");
        
        const idempotencyKey = crypto.randomUUID();
        const itemBody = {
            idempotencyKey: idempotencyKey,
            object: {
                type: 'ITEM',
                id: '#new_gold_membership_item', 
                itemData: {
                    name: 'Gold Membership Haircut + Beard - Billing',
                    description: 'Monthly subscription billing item. Not for service booking.',
                    productType: 'REGULAR', // Critical
                    availableOnline: true,
                    availableForPickup: false,
                    availableElectronically: true, 
                    variations: [
                        {
                            type: 'ITEM_VARIATION',
                            id: '#new_gold_membership_variation',
                            itemVariationData: {
                                name: 'Regular',
                                pricingType: 'FIXED_PRICING',
                                priceMoney: {
                                    amount: 13000n, // 130.00 AUD
                                    currency: 'AUD'
                                },
                                sellable: true
                                // Removed stockable: false to avoid composition error
                            }
                        }
                    ]
                }
            }
        };

        const createRes = await squareClient.catalog.object.upsert({
             object: itemBody.object,
             idempotencyKey: idempotencyKey
        });
        
        // Handle result wrapper
        const newItem = createRes.result ? createRes.result.catalogObject : (createRes.body ? createRes.body.catalogObject : createRes.catalogObject);
        
        if (!newItem) {
            console.error("Failed to create new item. Response:", JSON.stringify(createRes.result || createRes.body));
            return;
        }

        console.log(`Created Item ID: ${newItem.id}`);
        // Variation ID might be needed?
        const variationId = newItem.itemData.variations[0].id;
        console.log(`Created Variation ID: ${variationId}`);

        // Step 2: Retrieve the Subscription Plan
        console.log(`Retrieving Plan: ${PLAN_ID}...`);
        
        let planObj = null;
        try {
             const planRes = await squareClient.catalog.object.get({ objectId: PLAN_ID });
             planObj = planRes.result?.object || planRes.body?.object;
        } catch (e) {
            console.log("Direct retrieve failed, trying list...");
            const listRes = await squareClient.catalog.list({ types: 'SUBSCRIPTION_PLAN' });
            const objects = listRes.result?.objects || listRes.body?.objects;
            planObj = objects ? objects.find(o => o.id === PLAN_ID) : null;
        }

        if (!planObj) {
            console.error("Could not find subscription plan.");
            return;
        }

        console.log(`Current Plan Version: ${planObj.version}`);

        // Step 3: Update Plan to use new Item ID
        // Note: eligibleItemIds should contain the ITEM ID (parent), not variation ID.
        // We will try with ITEM ID first as per plans.json inspection
        
        const updatedPlan = {
            ...planObj,
            subscriptionPlanData: {
                ...planObj.subscriptionPlanData,
                eligibleItemIds: [newItem.id]
            }
        };

        console.log(`Updating Plan to use Item ID: ${newItem.id}...`);

        const updateRes = await squareClient.catalog.object.upsert({
            idempotencyKey: crypto.randomUUID(),
            object: updatedPlan
        });

        const finalPlan = updateRes.result?.catalogObject || updateRes.body?.catalogObject;

        if (finalPlan) {
            console.log("SUCCESS! Plan updated.");
            console.log("New Plan Details:", finalPlan);
            console.log("New Plan Version:", finalPlan.version);
            console.log("Linked Item IDs:", finalPlan.subscriptionPlanData.eligibleItemIds);
        } else {
            console.error("Failed to update plan.");
        }

    } catch (e) {
        console.error("Error executing fix:");
        if (e.body) console.log(JSON.stringify(e.body, null, 2));
        else console.log(e);
    }
}

fixSubscriptionItem();
