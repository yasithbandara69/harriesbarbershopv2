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

async function createTestSet() {
    console.log("Creating Test Item & Plan...");
    
    try {
        // 1. Create Item
        const itemRes = await client.catalog.object.upsert({
            idempotencyKey: randomUUID(),
            object: {
                type: "ITEM",
                id: "#TEST_ITEM",
                presentAtAllLocations: true,
                itemData: {
                    name: "Automated Test Item",
                    variations: [
                        {
                            type: "ITEM_VARIATION",
                            id: "#TEST_VAR",
                            presentAtAllLocations: true,
                            itemVariationData: {
                                name: "Regular",
                                pricingType: "FIXED_PRICING",
                                priceMoney: {
                                    amount: 100n, // $1.00
                                    currency: "AUD"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log(`Item Response Keys: ${Object.keys(itemRes)}`);
        if (itemRes.result) console.log(`Item Result Keys: ${Object.keys(itemRes.result)}`);
        if (itemRes.body) console.log(`Item Body: ${itemRes.body}`);

        const item = (itemRes.result || itemRes).catalogObject || (itemRes.result || itemRes).object;
        // console.log(`Created Item Object: ${item ? JSON.stringify(item, (key, value) => typeof value === 'bigint' ? value.toString() : value) : "undefined"}`);
        console.log("Item Created. ID: " + (item ? item.id : "UNKNOWN"));
        
        // Safe access
        let itemVarId;
        if (item && item.itemData && item.itemData.variations) {
            itemVarId = item.itemData.variations[0].id;
        }
        const itemId = item ? item.id : "UNKNOWN";
        console.log(`Created Item: ${itemId} / Var: ${itemVarId}`);

        // 2. Create Plan
        const planRes = await client.catalog.object.upsert({
            idempotencyKey: randomUUID(),
            object: {
                type: "SUBSCRIPTION_PLAN",
                id: "#TEST_PLAN",
                presentAtAllLocations: true,
                subscriptionPlanData: {
                    name: "Automated Test Plan",
                    eligibleItemIds: [itemId], // Link to Item!
                    // phases: [], // Remove top-level phases
                    subscriptionPlanVariations: [
                        {
                            type: "SUBSCRIPTION_PLAN_VARIATION",
                            id: "#TEST_PLAN_VAR", // Required!
                            presentAtAllLocations: true,
                            subscriptionPlanVariationData: {
                                name: "Result Variation",
                                phases: [
                                    {
                                        cadence: "MONTHLY",
                                        periods: 1, // Number
                                        ordinal: 0n, // BigInt
                                        pricing: {
                                            type: "STATIC",
                                            priceMoney: {
                                                amount: 100n, // BigInt
                                                currency: "AUD"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        // Simplified extraction logic
        const createdPlanRaw = (planRes.result || planRes).catalogObject || (planRes.result || planRes).object;
        console.log(`Created Plan ID: ${createdPlanRaw.id}`);
        
        // Fetch
        const fetchedPlanRes = await client.catalog.object.get({ objectId: createdPlanRaw.id });
        const plan = (fetchedPlanRes.result || fetchedPlanRes).object;
        
        let planVarId = null;
        if (plan.subscriptionPlanData?.subscriptionPlanVariations?.length > 0) {
            planVarId = plan.subscriptionPlanData.subscriptionPlanVariations[0].id;
            console.log("Found Variation ID.");
        }
        
        if (!planVarId) throw new Error("No Variation ID found");

        console.log(`Using Plan Var ID: ${planVarId}`);

        // 3. Generate Link
        const body = {
            idempotencyKey: randomUUID(),
            order: {
                locationId: LOCATION_ID,
                lineItems: [
                    {
                        catalogObjectId: itemVarId,
                        quantity: "1"
                    }
                ]
            },
            checkoutOptions: {
                subscriptionPlanId: planVarId,
                redirectUrl: "https://harriesbarbershopv2.vercel.app/dashboard",
                askForShippingAddress: false
            }
        };

        console.log("Generating Checkout...");
        const checkoutRes = await client.checkout.paymentLinks.create(body);
        const result = checkoutRes.result || checkoutRes;
        
        if (result.paymentLink) {
            console.log("\n✅ SUCCESS! URL: " + result.paymentLink.url + "\n");
        }

    } catch (e) {
        // Simple error log
        console.error("SCRIPT ERROR:");
        console.error(e.message || e);
        if (e.result) {
             const json = JSON.stringify(e.result, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
             console.error(json);
        }
    }
}

createTestSet();
