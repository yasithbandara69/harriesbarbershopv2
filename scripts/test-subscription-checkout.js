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

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Gold Plan Details
const SUBSCRIPTION_PLAN_VARIATION_ID = 'KBSCWFLBQ4XFOKLB3SI5HNWY'; 
const ITEM_VARIATION_ID = '476R3Q6R3TFKNNPQ2DYQ47KE';

async function testSubscriptionLink() {
    console.log("Creating Subscription Checkout Link...");
    console.log(`Plan Variation: ${SUBSCRIPTION_PLAN_VARIATION_ID}`);
    console.log(`Item Variation: ${ITEM_VARIATION_ID}`);

    try {
        const body = {
          idempotencyKey: randomUUID(),
          order: {
            locationId: LOCATION_ID,
            // NO customerId (Guest)
            lineItems: [
                {
                    catalogObjectId: ITEM_VARIATION_ID, // The correct variation for the eligible item
                    quantity: "1"
                    // NO basePriceMoney override (Let Square calculate from Catalog + Plan)
                }
            ]
          },
          checkoutOptions: {
            redirectUrl: "https://google.com", 
            askForShippingAddress: false,
            subscriptionPlanId: SUBSCRIPTION_PLAN_VARIATION_ID // REQUIRED for subscription
          }
        };

        const { paymentLink } = await squareClient.checkout.paymentLinks.create(body);
        console.log("---------------------------------------------------");
        console.log("SUBSCRIPTION TEST LINK:");
        console.log(paymentLink.url);
        console.log("---------------------------------------------------");
        console.log("Please try to pay $1.00 using this link.");
        
    } catch (error) {
        console.error("Error creating link:");
        if (error.result) {
            console.error(JSON.stringify(error.result, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
        } else {
            console.error(error);
        }
    }
}

testSubscriptionLink();
