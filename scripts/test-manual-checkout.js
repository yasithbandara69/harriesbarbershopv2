const { SquareClient } = require("square");
const { randomUUID } = require("crypto");
const fs = require('fs');
const path = require('path');

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

// MANUAL IDS
const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const PLAN_ID = "EJGEEVYKOZMCQHWCLZI7MA4Z";
const PLAN_VAR_ID = "CAL3SGZYVTDQJFR6NY5R72OD";
const ITEM_VAR_ID = "MN74NI7HDAD56CGSQHATYX75";

async function testManualCheckout() {
    console.log("Testing Manual Checkout...");
    console.log(`Plan ID: ${PLAN_ID}`);
    console.log(`Plan Var ID: ${PLAN_VAR_ID}`);
    console.log(`Item Var ID: ${ITEM_VAR_ID}`);

    try {
        const body = {
            idempotencyKey: randomUUID(),
            order: {
                locationId: LOCATION_ID,
                lineItems: [
                    {
                        catalogObjectId: ITEM_VAR_ID, // The Item Variation
                        quantity: "1"
                    }
                ]
            },
            checkoutOptions: {
                subscriptionPlanId: PLAN_ID, // Try Plan ID first? Or Plan Var ID?
                // The API docs say "subscription_plan_id". 
                // For single-phase plans, it's often the Plan ID. 
                // But typically it's the Variation ID.
                // Let's try PLAN_ID first as it's the parent.
                redirectUrl: "https://harriesbarbershopv2.vercel.app/dashboard",
                askForShippingAddress: false
            }
        };

        console.log("Generating Checkout (Using PLAN ID)...");
        try {
            const checkoutRes = await client.checkout.paymentLinks.create(body);
            const result = checkoutRes.result || checkoutRes;
            if (result.paymentLink) {
                console.log("\n✅ SUCCESS (With Plan ID)! URL: " + result.paymentLink.url + "\n");
                return;
            }
        } catch (e) {
            console.log("Failed with Plan ID, trying Variation ID...");
            // console.error(e.result || e);
        }

        // Retry with Variation ID
        body.checkoutOptions.subscriptionPlanId = PLAN_VAR_ID;
        body.idempotencyKey = randomUUID(); // New key

        console.log("Generating Checkout (Using PLAN VARIATION ID)...");
        const checkoutRes2 = await client.checkout.paymentLinks.create(body);
        const result2 = checkoutRes2.result || checkoutRes2;
        
        if (result2.paymentLink) {
            console.log("\n✅ SUCCESS (With Variation ID)! URL: " + result2.paymentLink.url + "\n");
        }

    } catch (e) {
        console.error("SCRIPT ERROR:");
        console.error(e.message || e);
        if (e.result) {
             const json = JSON.stringify(e.result, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
             console.error(json);
        }
    }
}

testManualCheckout();
