const { SquareClient } = require("square");
const { randomUUID } = require("crypto");

const Client = SquareClient;

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

const client = new Client({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function createPlan(name, amountData) {
  try {
    const response = await client.catalog.upsertCatalogObject({
      idempotencyKey: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN",
        id: "#new-plan",
        subscriptionPlanData: {
          name: name,
          phases: [
            {
              cadence: "MONTHLY",
              recurringPriceMoney: {
                amount: BigInt(amountData), // Price in cents
                currency: "AUD"
              }
            }
          ]
        }
      }
    });

    // Handle Fern SDK response structure
    const result = response.result || response;
    const plan = result.catalogObject || result.object;

    if (plan) {
      console.log("✅ New Plan Created Successfully!");
      console.log("-----------------------------------");
      console.log(`Name: ${plan.subscriptionPlanData.name}`);
      console.log(`Plan ID: ${plan.id}`);
      
      // Find the Variation ID (needed for checkout)
      // Usually the plan itself is the Variation for simple plans, or it has variations.
      // Wait, SUBSCRIPTION_PLAN objects *contain* variations? No.
      // Actually, for Subscriptions, the Plan ID is usually sufficient for metadata, 
      // but checkout needs a Catalog Object ID.
      
      console.log("\n👇 UPDATE THIS IN app/components/subscription-data.ts 👇");
      console.log(`squarePlanId: '${plan.id}',`);
      console.log("-----------------------------------");
    } else {
      console.log("Failed to create plan:", result);
    }

  } catch (error) {
    console.error("Error creating plan:", error);
  }
}

// Usage: node scripts/create-new-plan.js "New Gold Plan" 15000 (for $150.00)
// You can edit these values below before running.

const NEW_PLAN_NAME = "Gold Membership 2026 (Updated)";
const NEW_PRICE_CENTS = 15000; // $150.00

console.log(`Creating new plan: ${NEW_PLAN_NAME} for $${NEW_PRICE_CENTS/100}...`);
createPlan(NEW_PLAN_NAME, NEW_PRICE_CENTS);
