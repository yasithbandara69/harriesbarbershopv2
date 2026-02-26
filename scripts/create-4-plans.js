const fs = require('fs');
const path = require('path');

// Load environment variables locally
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
const { randomUUID } = require("crypto");

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

const PLANS = [
    { name: "Essential Haircut Only", amount: 10000 },
    { name: "Essential Haircut + Beard", amount: 13000 },
    { name: "Premium Haircut Only", amount: 18000 },
    { name: "Premium Haircut + Beard", amount: 24000 },
];

async function createPlan(name, amountData) {
  try {
    const response = await client.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: "#new-plan",
        subscriptionPlanData: {
          name: name,
          subscriptionPlanVariations: [
            {
              type: "SUBSCRIPTION_PLAN_VARIATION",
              id: "#new-plan-variation",
              subscriptionPlanVariationData: {
                name: name,
                phases: [
                  {
                    cadence: "MONTHLY",
                    pricing: {
                       type: "STATIC",
                       priceMoney: {
                          amount: BigInt(amountData),
                          currency: "AUD"
                       }
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    });

    const result = response.result || response;
    const plan = result.catalogObject || result.object;

    if (plan) {
      const variation = plan.subscriptionPlanData?.subscriptionPlanVariations?.[0];
      console.log(`✅ Plan Created: ${plan.subscriptionPlanData.name}`);
      console.log(`Plan ID: ${plan.id}`);
      if (variation) {
         console.log(`Variation ID: ${variation.id}`);
      }
      console.log("-----------------------------------");
    } else {
      console.log("Failed to create plan:", result);
    }
  } catch (error) {
    console.error("Error creating plan:", error);
  }
}

async function run() {
    console.log("Creating 4 endless subscription plans...");
    for (const plan of PLANS) {
        await createPlan(plan.name, plan.amount);
    }
}

run();
