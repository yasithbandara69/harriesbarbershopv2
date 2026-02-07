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
// Using Gold details
const SUBSCRIPTION_PLAN_VARIATION_ID = 'KBSCWFLBQ4XFOKLB3SI5HNWY'; 
const ITEM_VARIATION_ID = '476R3Q6R3TFKNNPQ2DYQ47KE';

async function testCreateLink() {
    console.log("Attempting to create checkout link...");

    const body = {
      idempotencyKey: randomUUID(),
      order: {
        locationId: LOCATION_ID,
        // customerId: "REAL_CUSTOMER_ID_IF_KNOWN", // Optional: Uncomment if we have a real ID
        lineItems: [
            {
                catalogObjectId: ITEM_VARIATION_ID,
                quantity: "1",
                basePriceMoney: {
                    amount: BigInt(100), // $1.00
                    currency: "AUD"
                }
            }
        ]
      },
      checkoutOptions: {
        redirectUrl: "https://example.com",
        askForShippingAddress: false,
        subscriptionPlanId: SUBSCRIPTION_PLAN_VARIATION_ID
      },
      prePopulatedData: {
        buyerEmail: "test@example.com"
      }
    };

    try {
        const { paymentLink } = await squareClient.checkout.paymentLinks.create(body);
        console.log("Success! Link:", paymentLink.url);
    } catch (error) {
        console.error("Error creating link:");
        if (error.result) {
            console.error(JSON.stringify(error.result, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
        } else {
            console.error(error);
        }
    }
}

testCreateLink();
