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

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
// Use the Test Item Variation ID created earlier: CGAVD6BAD4EDRL67CHOHG4RW
const ITEM_VAR_ID = "CGAVD6BAD4EDRL67CHOHG4RW"; 

async function createSimpleCheckout() {
    console.log("Creating Simple Checkout (No Subscription)...");
    
    try {
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
                redirectUrl: "https://harriesbarbershopv2.vercel.app/dashboard",
                askForShippingAddress: false
            }
        };

        console.log("Generating Checkout...");
        const checkoutRes = await client.checkout.paymentLinks.create(body);
        const result = checkoutRes.result || checkoutRes;
        
        if (result.paymentLink) {
            console.log("\n✅ SUCCESS! Simple Checkout Link:");
            console.log(result.paymentLink.url);
        }

    } catch (e) {
        console.error("Error:", e);
        if (e.result) {
            try {
                console.error(JSON.stringify(e.result, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
            } catch (jsonError) {
                console.error("Failed to stringify error result:", jsonError);
            }
        }
    }
}

createSimpleCheckout();
