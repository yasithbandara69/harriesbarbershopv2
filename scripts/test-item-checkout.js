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
const ITEM_VARIATION_ID = '476R3Q6R3TFKNNPQ2DYQ47KE'; // Regular Item for Gold Plan

async function testItemCheckout() {
    console.log(`Creating One-Time Checkout for Item: ${ITEM_VARIATION_ID}`);
    
    try {
        const body = {
          idempotencyKey: randomUUID(),
          order: {
            locationId: LOCATION_ID,
            lineItems: [
                {
                    catalogObjectId: ITEM_VARIATION_ID,
                    quantity: "1"
                    // No price override - use catalog price ($100)
                }
            ]
          },
          checkoutOptions: {
            redirectUrl: "https://google.com", 
            askForShippingAddress: false
            // NO subscriptionPlanId
          }
        };

        const { paymentLink } = await squareClient.checkout.paymentLinks.create(body);
        console.log("---------------------------------------------------");
        console.log("ITEM ONLY TEST LINK:");
        console.log(paymentLink.url);
        console.log("---------------------------------------------------");
        console.log("Please try to pay using this link.");
        
    } catch (error) {
        console.error("Error creating link:");
        if (error.result) {
            console.error(JSON.stringify(error.result, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
        } else {
            console.error(error);
        }
    }
}

testItemCheckout();
