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

const PLAN_ID = 'BJKQSNDFNBZHBDXMSF43F7I3'; // Gold Membership Haircut + beard

async function inspectPlanPricing() {
    console.log(`Checking Pricing for Plan ID: ${PLAN_ID}...`);
    try {
        const response = await squareClient.catalog.object.get({ objectId: PLAN_ID });
        const plan = response.result?.object || response.body?.object || response.object;

        if (plan) {
            console.log(`Plan Name: ${plan.subscriptionPlanData.name}`);
            console.log("Variations:");
            
            const variations = plan.subscriptionPlanData.subscriptionPlanVariations;
            if (variations) {
                variations.forEach(v => {
                    console.log(`  Variation Name: ${v.subscriptionPlanVariationData.name}`);
                    console.log(`  Variation ID: ${v.id}`);
                    const phases = v.subscriptionPlanVariationData.phases;
                    if (phases) {
                        phases.forEach((p, idx) => {
                            console.log(`    Phase ${idx}: Cadence=${p.cadence}, RecurringPrice=${p.recurringPriceMoney ? p.recurringPriceMoney.amount + ' ' + p.recurringPriceMoney.currency : 'Not Set'}`);
                             // Check for ordinal or other pricing models
                             if (p.pricing) {
                                  console.log(`    Pricing Type: ${p.pricing.type}`);
                                  if (p.pricing.priceMoney) {
                                      console.log(`    Fixed Price: ${p.pricing.priceMoney.amount}`);
                                  }
                                  if (p.pricing.discountIds) {
                                      console.log(`    Discounts: ${p.pricing.discountIds}`);
                                  }
                             }
                        });
                    }
                });
            }

        } else {
            console.log("Plan not found (direct get failed). Trying List...");
             const listRes = await squareClient.catalog.list({ types: 'SUBSCRIPTION_PLAN' });
             const objects = listRes.result?.objects || listRes.body?.objects;
             const found = objects?.find(o => o.id === PLAN_ID);
             if(found) {
                 console.log(`Found via List: ${found.subscriptionPlanData.name}`);
                  // dump phases
                  found.subscriptionPlanData.subscriptionPlanVariations?.forEach(v => {
                      console.log(`  Variation: ${v.subscriptionPlanVariationData.name} (${v.id})`);
                      v.subscriptionPlanVariationData.phases?.forEach(p => {
                          console.log(`    Phase: ${JSON.stringify(p.pricing)}`);
                      });
                  });
             } else {
                 console.log("Plan REALLY not found.");
             }
        }

    } catch (e) {
        console.error("Error inspecting plan:", e);
    }
}

inspectPlanPricing();
