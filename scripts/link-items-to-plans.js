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

async function linkItems() {
    // These are the plans I created recently (from created_plans.json / dashboard)
    // Structure: { planId, itemVariationId, name }
    const PLANS_TO_UPDATE = [
      {
        name: "Gold Membership Haircut (TESTING $1)",
        planId: "V7BNXTEEKLE6NX3T3A6DWT2N",
        itemVariationId: "VWXT7YBWGTU3ZS55UPOWF3BZ"
      },
      {
        name: "Platinum Membership Haircut (TESTING $1)",
        planId: "SFPSWC624HXPLC74XTMTTKAE",
        itemVariationId: "K2N5M24UCFRN2TWJJCCPYUWU"
      },
      {
        name: "Platinum Membership Haircut + Beard (TESTING $1)",
        planId: "DWOHUIGPOJHQZQNG3ZJKL7U5",
        itemVariationId: "VSZFN5PWDHPQDYNPKRDYYZMC"
      }
    ];

    try {
        console.log("Linking Items to Plans (setting eligibleItemIds)...");

        for (const p of PLANS_TO_UPDATE) {
            console.log(`Processing ${p.name}...`);
            
            try {
                // 1. Get the Item ID from the Variation ID
                const varRes = await client.catalog.object.get({
                    objectId: p.itemVariationId
                });
                
                const variation = (varRes.result || varRes).object;
                if (!variation) {
                     console.error(`Error: Variation object not found for ${p.itemVariationId}`);
                     if (varRes.errors) console.error(varRes.errors);
                     continue;
                }
                
                const itemId = variation.itemVariationData.itemId;
                console.log(`  > Found Item ID: ${itemId}`);

                // 2. Get the Plan to get current version
                const planRes = await client.catalog.object.get({
                    objectId: p.planId
                });
                const plan = (planRes.result || planRes).object;
                
                 if (!plan) {
                     console.error(`Error: Plan object not found for ${p.planId}`);
                     continue;
                }

                // 3. Update the Plan with eligibleItemIds
                const updateRes = await client.catalog.object.upsert({
                    idempotencyKey: new Date().toISOString() + p.planId, 
                    object: {
                        type: "SUBSCRIPTION_PLAN",
                        id: p.planId,
                        version: plan.version,
                        subscriptionPlanData: {
                            ...plan.subscriptionPlanData,
                            eligibleItemIds: [itemId]
                        }
                    }
                });

                const updatedPlan = (updateRes.result || updateRes).catalogObject || (updateRes.result || updateRes).object;
                console.log(`  > Updated Plan: ${updatedPlan.id} | Ver: ${updatedPlan.version}`);
                console.log(`  > eligibleItemIds: ${JSON.stringify(updatedPlan.subscriptionPlanData.eligibleItemIds)}`);
            
            } catch (innerError) {
                console.error(`Failed to process ${p.name}:`, innerError);
                 if (innerError.body) console.error(JSON.stringify(innerError.body, null, 2));
            }
        }

    } catch (error) {
        console.error("Error linking items:", error);
         if (error.body) console.error(JSON.stringify(error.body, null, 2));
    }
}

linkItems();
