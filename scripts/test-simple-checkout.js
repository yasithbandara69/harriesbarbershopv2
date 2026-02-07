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

async function createSimpleLink() {
    console.log("Creating a simple $1.00 One-Time Payment Link...");
    
    try {
        const body = {
          idempotencyKey: randomUUID(),
          order: {
            locationId: LOCATION_ID,
            lineItems: [
                {
                    name: "Test Payment (One Time)",
                    quantity: "1",
                    basePriceMoney: {
                        amount: BigInt(100), // $1.00
                        currency: "AUD"
                    }
                }
            ]
          },
          checkoutOptions: {
            redirectUrl: "https://google.com", 
            askForShippingAddress: false
          }
        };

        const { paymentLink } = await squareClient.checkout.paymentLinks.create(body);
        console.log("---------------------------------------------------");
        console.log("TEST LINK CREATED:");
        console.log(paymentLink.url);
        console.log("---------------------------------------------------");
        console.log("Please copy the above URL and try to pay $1.00.");
        
    } catch (error) {
        console.error("Error creating link:");
        if (error.result) {
            console.error(JSON.stringify(error.result, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
        } else {
            console.error(error);
        }
    }
}

createSimpleLink();
