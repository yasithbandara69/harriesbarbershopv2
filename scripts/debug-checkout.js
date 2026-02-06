const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

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

const locationId = process.env.SQUARE_LOCATION_ID;

// Gold Plan ID (Verified)
const PLAN_ID = 'LBZTK3K4MEBVIIWAVSURO2SK';
// Gold Item Variation ID (Verified)
const VARIATION_ID = '476R3Q6R3TFKNNPQ2DYQ47KE';

async function testCheckout() {
    console.log("Testing Checkout Creation...");

    try {
        console.log("Attempt 1: Using order with lineItem (Current Implementation)");
        const response1 = await squareClient.checkout.paymentLinks.create({
            idempotencyKey: randomUUID(),
            order: {
                locationId: locationId,
                lineItems: [
                    {
                        catalogObjectId: VARIATION_ID,
                        quantity: "1"
                    }
                ]
            },
            checkoutOptions: {
                subscriptionPlanId: PLAN_ID,
                redirectUrl: "https://example.com"
            }
        });
        console.log("Success 1:", response1.result.paymentLink.url);
    } catch (e) {
        console.error("Failed 1:", e.errors || e.message);
    }

    try {
        console.log("\nAttempt 2: Using quickPay (No line items)");
        const response2 = await squareClient.checkout.paymentLinks.create({
            idempotencyKey: randomUUID(),
            quickPay: {
                name: "Gold Subscription",
                priceMoney: {
                    amount: BigInt(100), // $1.00 for test or actual price? Gold is $100
                    currency: "AUD"
                },
                locationId: locationId
            },
            checkoutOptions: {
                subscriptionPlanId: PLAN_ID,
                redirectUrl: "https://example.com"
            }
        });
        console.log("Success 2:", response2.result.paymentLink.url);
    } catch (e) {
        console.error("Failed 2:", e.errors || e.message);
    }

    try {
        console.log("\nAttempt 3: Using Variation ID as subscriptionPlanId");
        const response3 = await squareClient.checkout.paymentLinks.create({
            idempotencyKey: randomUUID(),
            order: {
                locationId: locationId,
                lineItems: [
                    {
                        catalogObjectId: VARIATION_ID,
                        quantity: "1"
                    }
                ]
            },
            checkoutOptions: {
                subscriptionPlanId: VARIATION_ID, // TRYING VARIATION ID HERE
                redirectUrl: "https://example.com"
            }
        });
        console.log("Success 3:", response3.result.paymentLink.url);
    } catch (e) {
        console.error("Failed 3:", JSON.stringify(e.errors || e.message, null, 2));
    }

    try {
        console.log("\nAttempt 4: Omitting subscriptionPlanId (Just Line Item)");
        const response4 = await squareClient.checkout.paymentLinks.create({
            idempotencyKey: randomUUID(),
            order: {
                locationId: locationId,
                lineItems: [
                    {
                        catalogObjectId: VARIATION_ID,
                        quantity: "1"
                    }
                ]
            },
            checkoutOptions: {
                redirectUrl: "https://example.com"
            }
        });
        // Console log fully
        // console.log("Response 4:", JSON.stringify(response4, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
        
        if (response4.result && response4.result.paymentLink) {
             console.log("Success 4 URL:", response4.result.paymentLink.url);
        } else {
             console.log("Success 4 but NO Link:", Object.keys(response4.result || response4));
        }

    } catch (e) {
        console.error("Failed 4:", JSON.stringify(e.errors || e.message, null, 2));
    }
}

testCheckout();
