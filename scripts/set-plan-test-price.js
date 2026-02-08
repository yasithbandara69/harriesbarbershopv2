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

const PLAN_ID = '24DN6C7TY4LKNL4KZITSM2GW'; // The new FIXED plan
const TEST_PRICE_AMOUNT = 100n; // $1.00 AUD

async function setTestPrice() {
    console.log(`Setting Test Price ($1.00) for Plan: ${PLAN_ID}...`);
    
    try {
        // 1. Retrieve Plan
        const res = await squareClient.catalog.object.get({ objectId: PLAN_ID });
        const plan = res.result?.object || res.body?.object || res.object;

        if (!plan) {
            console.error("Plan not found.");
            return;
        }

        console.log(`Current Version: ${plan.version}`);
        
        // 2. Modify to $1.00
        // NOTE: If updating price is forbidden on existing plans (as seen before),
        // we might fail here too. If so, we must create ANOTHER plan.
        
        const variations = plan.subscriptionPlanData.subscriptionPlanVariations;
        
        const updatedVariations = variations.map(v => {
            const phases = v.subscriptionPlanVariationData.phases.map(p => {
                return {
                    ...p,
                    pricing: {
                        type: 'STATIC',
                        priceMoney: {
                            amount: TEST_PRICE_AMOUNT,
                            currency: 'AUD'
                        }
                    }
                };
            });

            return {
                ...v,
                subscriptionPlanVariationData: {
                    ...v.subscriptionPlanVariationData,
                    phases: phases
                }
            };
        });

        const updatedPlan = {
            ...plan,
            subscriptionPlanData: {
                ...plan.subscriptionPlanData,
                subscriptionPlanVariations: updatedVariations
            }
        };

        const updateRes = await squareClient.catalog.object.upsert({
            idempotencyKey: crypto.randomUUID(),
            object: updatedPlan
        });
        
        const finalPlan = updateRes.result?.catalogObject || updateRes.body?.catalogObject || updateRes.catalogObject;

        if (finalPlan) {
            console.log("SUCCESS! Plan updated to $1.00.");
            console.log("New Version:", finalPlan.version);
        } else {
            console.error("Failed to update plan.");
        }

    } catch (e) {
        console.error("Error executing fix:", e);
        if (e.body) console.log(JSON.stringify(e.body, null, 2));
    }
}

setTestPrice();
