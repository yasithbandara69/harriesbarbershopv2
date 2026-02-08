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
const PRICE_AMOUNT = 13000n; // $130.00 AUD

async function fixPlanPricing() {
    console.log(`Fixing Pricing for Plan: ${PLAN_ID}...`);
    
    try {
        // 1. Retrieve Plan
        const res = await squareClient.catalog.object.get({ objectId: PLAN_ID });
        const plan = res.result?.object || res.body?.object || res.object;

        if (!plan) {
            console.error("Plan not found.");
            return;
        }

        console.log(`Current Version: ${plan.version}`);
        
        // 2. Modify to STATIC pricing
        const variations = plan.subscriptionPlanData.subscriptionPlanVariations;
        
        if (!variations || variations.length === 0) {
            console.error("No variations found in plan.");
            return;
        }

        const updatedVariations = variations.map(v => {
            const phases = v.subscriptionPlanVariationData.phases.map(p => {
                // Change ONLY the first phase or all phases? Usually subscription has 1 phase
                // We want to force it to be $130.00 Fixed Price
                return {
                    ...p,
                    pricing: {
                        type: 'STATIC',
                        priceMoney: {
                            amount: PRICE_AMOUNT,
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

        console.log("Updating Plan to STATIC Pricing ($130.00)...");
        
        const updateRes = await squareClient.catalog.object.upsert({
            idempotencyKey: crypto.randomUUID(),
            object: updatedPlan
        });
        
        const finalPlan = updateRes.result?.catalogObject || updateRes.body?.catalogObject || updateRes.catalogObject;

        if (finalPlan) {
            console.log("SUCCESS! Plan updated.");
            console.log("New Version:", finalPlan.version);
            // Verify phases
            const phase = finalPlan.subscriptionPlanData.subscriptionPlanVariations[0].subscriptionPlanVariationData.phases[0];
            console.log("New Pricing Type:", phase.pricing.type);
            console.log("New Price:", phase.pricing.priceMoney.amount, phase.pricing.priceMoney.currency);
        } else {
            console.error("Failed to update plan.");
        }

    } catch (e) {
        console.error("Error executing fix:", e);
        if (e.body) console.log(JSON.stringify(e.body, null, 2));
    }
}

fixPlanPricing();
