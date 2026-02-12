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
    
    // IDs
    const PLAN_VAR_ID = 'CAL3SGZYVTDQJFR6NY5R72OD'; // Gold Variation
    const ITEM_VAR_ID = 'MN74NI7HDAD56CGSQHATYX75'; // Gold Item Variation (Price $1.00)
    const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

    try {
        console.log("\n--- Generating Valid Checkout Link ---");
        const body = {
            idempotencyKey: randomUUID(),
            order: {
                locationId: LOCATION_ID,
                customerId: 'M7QYWFQ8891PNVMMQ5E1M2ZPQ8', // Testing with INVALID customer
                lineItems: [
                    {
                        catalogObjectId: ITEM_VAR_ID,
                        quantity: "1"
                    }
                ]
            },
            checkoutOptions: {
                subscriptionPlanId: PLAN_VAR_ID,
                redirectUrl: "https://harriesbarbershopv2.vercel.app/dashboard",
                askForShippingAddress: false
            },
            prePopulatedData: {
                buyerEmail: "travelwithmeslk@gmail.com",
                buyerPhoneNumber: "+61480089451",
                buyerAddress: {
                  firstName: "kovinda",
                  lastName: "bandara"
                }
            }
        };
        
        try {
            const response = await client.checkout.paymentLinks.create(body);
             console.log("✅ Success! Raw Response:");
             // Handle BigInt in checking response
             console.log(JSON.stringify(response, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
            , 2));

            const result = response.result || response;
             if (result.paymentLink) {
                 console.log("URL:", result.paymentLink.url);
             }
        } catch (e) {
            console.log("❌ Failed:", e);
             if (e.result) console.log(JSON.stringify(e.result, null, 2));
        }

    } catch (error) {
        console.error("Critical Error", error);
    }
}

testCheckout();
