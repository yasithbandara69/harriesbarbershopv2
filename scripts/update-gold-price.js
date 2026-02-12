const { SquareClient } = require("square");
const fs = require('fs');
const path = require('path');
const { randomUUID } = require("crypto");

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

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function updateGoldPrice() {
    // 1. Parse arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Usage: node scripts/update-gold-price.js <PRICE_IN_DOLLARS>");
        process.exit(1);
    }
    
    const newPriceDollars = parseFloat(args[0]);
    if (isNaN(newPriceDollars)) {
        console.error("Invalid price.");
        process.exit(1);
    }
    
    const newPriceCents = BigInt(Math.round(newPriceDollars * 100));
    console.log(`Updating Gold Membership to $${newPriceDollars} (${newPriceCents} cents)...`);

    // Hardcoded IDs for Gold Membership
    const PLAN_ID = 'EJGEEVYKOZMCQHWCLZI7MA4Z';
    const PLAN_VAR_ID = 'CAL3SGZYVTDQJFR6NY5R72OD'; 
    const ITEM_VAR_ID = 'MN74NI7HDAD56CGSQHATYX75';

    try {
        console.log("1. Updating Item Variation Price...");
        // Fetch current version first? Catalog upsert needs version for updates usually, 
        // OR we can just use upsert with the ID and it might overwrite? 
        // Safer to get it first.
        
        const itemVarRes = await client.catalog.object.get({ objectId: ITEM_VAR_ID });
        const itemVar = (itemVarRes.result || itemVarRes).object;
        
        if (itemVar) {
            const response = await client.catalog.object.upsert({
                idempotencyKey: randomUUID(),
                object: {
                    type: "ITEM_VARIATION",
                    id: ITEM_VAR_ID,
                    version: itemVar.version,
                    itemVariationData: {
                        ...itemVar.itemVariationData,
                        pricingType: "FIXED_PRICING",
                        priceMoney: {
                            amount: newPriceCents,
                            currency: "AUD"
                        }
                    }
                }
            });
            console.log("   > Item Price Updated.");
        }

        console.log("2. Updating Subscription Plan Variation Price...");
        const planVarRes = await client.catalog.object.get({ objectId: PLAN_VAR_ID });
        const planVar = (planVarRes.result || planVarRes).object;
        
        if (planVar) {
            // Check pricing model
            const pricingType = planVar.subscriptionPlanVariationData.phases?.[0]?.pricing?.type;

            if (pricingType === "RELATIVE") {
                 console.log("   > Plan is RELATIVE pricing (inherits from Item). Skipping Plan update.");
            } else {
                // Update phases for STATIC pricing
                const phases = planVar.subscriptionPlanVariationData.phases || [];
                const newPhases = phases.map(p => ({
                    ...p,
                    recurringPriceMoney: null, 
                    pricing: {
                        type: "STATIC",
                        priceMoney: {
                            amount: newPriceCents,
                            currency: "AUD"
                        }
                    }
                }));
                
                const response = await client.catalog.object.upsert({
                    idempotencyKey: randomUUID(),
                    object: {
                        type: "SUBSCRIPTION_PLAN_VARIATION",
                        id: PLAN_VAR_ID,
                        version: planVar.version,
                        subscriptionPlanVariationData: {
                            ...planVar.subscriptionPlanVariationData,
                            phases: newPhases
                        }
                    }
                });
                 console.log("   > Plan Variation Price Updated.");
            }
        }

        console.log("✅ Update Complete. Please also update your local 'subscription-data.ts' file!");

    } catch (error) {
        console.error("Error updating price:", error);
         if (error.body) console.error(JSON.stringify(error.body, null, 2));
    }
}

updateGoldPrice();
