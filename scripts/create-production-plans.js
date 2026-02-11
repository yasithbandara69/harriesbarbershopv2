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

const { SquareClient } = require("square");
const { randomUUID } = require("crypto");

console.log("Token present:", !!process.env.SQUARE_ACCESS_TOKEN);
console.log("Env:", process.env.SQUARE_ENVIRONMENT);

const Client = SquareClient;
const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

const client = new Client({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

const PLANS_TO_CREATE = [
  {
    name: "Gold Membership Haircut (TESTING $1)",
    priceCents: 100, // $1.00
    description: "2 Subscription Haircut services per month"
  },
  {
    name: "Platinum Membership Haircut (TESTING $1)",
    priceCents: 100, // $1.00
    description: "4 Subscription Haircut services per month"
  },
  {
    name: "Platinum Membership Haircut + Beard (TESTING $1)",
    priceCents: 100, // $1.00
    description: "4 Subscription Haircut + Beard services per month"
  }
];

async function createPlanAndItem(planData) {
  try {
    console.log(`\nProcessing: ${planData.name}...`);

    // 1. Create Subscription Plan
    const planResponse = await client.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: "#new-plan",
        subscriptionPlanData: {
          name: planData.name,
          phases: [
            {
              cadence: "MONTHLY",
              recurringPriceMoney: {
                amount: BigInt(planData.priceCents),
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
    console.log(`  ✅ Subscription Plan Created: ${plan.id}`);

    // 2. Create Corresponding Item (for Checkout placeholder)
    const itemResponse = await client.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: "ITEM",
        id: "#new-item",
        itemData: {
            name: `${planData.name} (Subscription Item)`,
            description: "Placeholder item for subscription checkout",
            variations: [
                {
                    type: "ITEM_VARIATION",
                    id: "#new-variation",
                    itemVariationData: {
                        pricingType: "FIXED_PRICING",
                        priceMoney: {
                            amount: BigInt(planData.priceCents),
                            currency: "AUD"
                        },
                        name: planData.name
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
    console.log(`  ✅ Item Variation Created: ${itemVariationId}`);

    return {
        name: planData.name,
        squarePlanId: plan.id,
        squarePlanVariationId: plan.id, // Usually same for our usage
        itemVariationId: itemVariationId
    };

  } catch (error) {
    console.error("Error processing plan:");
    if (error.body) {
        console.error(JSON.stringify(error.body, null, 2));
    } else {
        console.error(error);
    }
  }
}

async function main() {
    console.log("🚀 Starting Bulk Plan Creation...");
    
    const results = [];
    for (const p of PLANS_TO_CREATE) {
        const res = await createPlanAndItem(p);
        if (res) results.push(res);
    }

    console.log("\n\n📋 COPY THIS INTO app/components/subscription-data.ts:");
    console.log("---------------------------------------------------------");
    
    results.forEach(r => {
        console.log(`\n// ${r.name}`);
        console.log(`squarePlanId: '${r.squarePlanId}',`);
        console.log(`squarePlanVariationId: '${r.squarePlanId}',`);
        console.log(`itemVariationId: '${r.itemVariationId}',`);
    });
    console.log("---------------------------------------------------------");
}

main();
