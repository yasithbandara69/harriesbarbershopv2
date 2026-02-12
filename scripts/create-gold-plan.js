const { SquareClient } = require("square");
const { randomUUID } = require("crypto");
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
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn("Could not load .env.local", e);
}

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function createGoldPlan() {
  const PLAN_NAME = "Gold Membership Haircut";
  const PRICE_CENTS = 10000; // $100.00 AUD

  console.log(`Creating plan: ${PLAN_NAME} for $${PRICE_CENTS / 100} AUD...`);

  try {
    // 1. Create Subscription Plan
    const planResponse = await client.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: "#gold-plan",
        subscriptionPlanData: {
          name: PLAN_NAME,
          phases: [
            {
              cadence: "MONTHLY",
              recurringPriceMoney: {
                amount: BigInt(PRICE_CENTS),
                currency: "AUD"
              }
            }
          ]
        }
      }
    });

    const planResult = planResponse.result || planResponse;
    const plan = planResult.catalogObject || planResult.object;

    if (!plan) {
      console.error("❌ Failed to create Subscription Plan.");
      return;
    }
    console.log(`✅ Subscription Plan Created: ${plan.id}`);

    // 2. Create Corresponding Item (for Checkout placeholder)
    const itemResponse = await client.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: "ITEM",
        id: "#gold-item",
        itemData: {
            name: `${PLAN_NAME} (Subscription Item)`,
            description: "Placeholder item for subscription checkout",
            variations: [
                {
                    type: "ITEM_VARIATION",
                    id: "#gold-variation",
                    itemVariationData: {
                        pricingType: "FIXED_PRICING",
                        priceMoney: {
                            amount: BigInt(PRICE_CENTS),
                            currency: "AUD"
                        },
                        name: PLAN_NAME
                    }
                }
            ]
        }
      }
    });

    const itemResult = itemResponse.result || itemResponse;
    const item = itemResult.catalogObject || itemResult.object;
    const itemVariationId = item?.itemData?.variations?.[0]?.id;

    if (!itemVariationId) {
        console.error("❌ Failed to create Item Variation.");
        return;
    }
    
    console.log(`✅ Item Variation Created: ${itemVariationId}`);
    console.log("-----------------------------------");
    console.log("👇 UPDATE THIS IN app/components/subscription-data.ts 👇");
    console.log(`squarePlanId: '${plan.id}',`);
    console.log(`squarePlanVariationId: '${plan.id}',`); // Usually Plan ID is enough or same
    console.log(`itemVariationId: '${itemVariationId}',`);
    console.log("-----------------------------------");

  } catch (error) {
    console.error("Error creating plan:", error);
    if (error.body) {
        console.error(JSON.stringify(error.body, null, 2));
    }
  }
}

createGoldPlan();
