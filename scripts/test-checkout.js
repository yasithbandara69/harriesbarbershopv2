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

async function testCheckout() {
    console.log("Testing Checkout Link Generation...");
    
    // IDs from my previous steps
    const PLAN_ID = 'EJGEEVYKOZMCQHWCLZI7MA4Z';
    const ITEM_VAR_ID = 'MN74NI7HDAD56CGSQHATYX75';
    const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

    try {
        // ATTEMPT 1: purely subscription_plan_id (No line items?)
        // Square docs say we might need at least one line item or none if subscription_plan_id is present? 
        // Let's try sending subscription_plan_id WITHOUT the explicit item first (or maybe with it?)
        
        console.log("\n--- Attempt 1: subscription_plan_id ONLY (No manual line items) ---");
        try {
            const body = {
                idempotencyKey: randomUUID(),
                order: {
                    locationId: LOCATION_ID,
                    // If I omit lineItems, will it work?
                    // "Line items are required for an order." - typically.
                    // But maybe passing subscription_plan_id auto-generates them?
                },
                checkoutOptions: {
                    subscriptionPlanId: PLAN_ID,
                    redirectUrl: "https://example.com/success"
                }
            };
            const { result } = await client.checkout.paymentLinks.create(body);
             console.log("✅ Success!", result.paymentLink.url);
        } catch (e) {
            console.log("❌ Failed:", e.errors || e.body || e);
        }

        console.log("\n--- Attempt 2: subscription_plan_id + Line Item ---");
        try {
             // This corresponds to what we likely did when we got the "Incorrect Object Type" error?
             // actually, previously we sent `itemBased` order but with `subscriptionPlanId` set? 
             
            const body = {
                idempotencyKey: randomUUID(),
                order: {
                    locationId: LOCATION_ID,
                    lineItems: [
                        {
                            catalogObjectId: ITEM_VAR_ID,
                            quantity: "1"
                        }
                    ]
                },
                checkoutOptions: {
                    subscriptionPlanId: PLAN_ID,
                    redirectUrl: "https://example.com/success"
                }
            };
            const { result } = await client.checkout.paymentLinks.create(body);
             console.log("✅ Success!", result.paymentLink.url);
        } catch (e) {
            console.log("❌ Failed:", JSON.stringify(e.errors || e.body || e, null, 2));
        }

    } catch (error) {
        console.error("Critical Error", error);
    }
}

testCheckout();
