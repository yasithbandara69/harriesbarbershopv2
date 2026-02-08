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

const ITEM_ID = 'SSBAYFYLFPOGG6WESVR2JPL5'; // The Billing Item I created
const VARIATION_ID = 'UTYAA22JQROPKLS4KZ4TSQZI'; // The Billing Item Variation
const OLD_PLAN_NAME = 'Gold Membership Haircut + beard';
const PRICE_AMOUNT = 13000n; // $130.00 AUD

async function createNewPlan() {
    console.log(`Creating New Plan for: ${OLD_PLAN_NAME}...`);
    
    try {
        const idempotencyKey = crypto.randomUUID();
        
        const planBody = {
            idempotencyKey: idempotencyKey,
            object: {
                type: 'SUBSCRIPTION_PLAN',
                id: '#new_gold_plan',
                subscriptionPlanData: {
                    name: OLD_PLAN_NAME + ' (Fixed)', // Unique name to distinguish
                    eligibleItemIds: [ITEM_ID], // Link to our billing item
                    subscriptionPlanVariations: [
                        {
                            type: 'SUBSCRIPTION_PLAN_VARIATION',
                            id: '#new_gold_plan_variation',
                            subscriptionPlanVariationData: {
                                name: OLD_PLAN_NAME + ' (Fixed)',
                                phases: [
                                    {
                                        cadence: 'MONTHLY',
                                        pricing: {
                                            type: 'STATIC',
                                            priceMoney: {
                                                amount: PRICE_AMOUNT,
                                                currency: 'AUD'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        };

        const createRes = await squareClient.catalog.object.upsert({
            idempotencyKey: idempotencyKey,
            object: planBody.object
        });
        
        const newPlan = createRes.result?.catalogObject || createRes.body?.catalogObject || createRes.catalogObject;

        if (newPlan) {
            console.log("SUCCESS! New Plan Created.");
            console.log("New Plan ID:", newPlan.id);
            const varId = newPlan.subscriptionPlanData.subscriptionPlanVariations[0].id;
            console.log("New Plan Variation ID (for code):", varId);
            
            console.log(`Verify Price: ${newPlan.subscriptionPlanData.subscriptionPlanVariations[0].subscriptionPlanVariationData.phases[0].pricing.priceMoney.amount}`);
        } else {
            console.error("Failed to create plan.");
        }

    } catch (e) {
        console.error("Error creating plan:", e);
        if (e.body) console.log(JSON.stringify(e.body, null, 2));
    }
}

createNewPlan();
