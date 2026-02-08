const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

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

const PLAN_ID = 'BJKQSNDFNBZHBDXMSF43F7I3'; // Gold Membership Haircut + beard

async function inspectPlan() {
    console.log(`Fetching Plan ID via LIST: ${PLAN_ID}...`);
    try {
        // Use list and filter, since direct retrieve was flaky
        const responseWrapper = await squareClient.catalog.list({ types: 'SUBSCRIPTION_PLAN' });
        
        // Handle wrapper structure
        let objects = [];
        if (responseWrapper.response && responseWrapper.response.objects) {
           objects = responseWrapper.response.objects;
        } else if (responseWrapper.data) {
           objects = responseWrapper.data.objects || responseWrapper.data; 
        } else if (responseWrapper.result && responseWrapper.result.objects) {
            objects = responseWrapper.result.objects;
        }

        const plan = objects.find(obj => obj.id === PLAN_ID);

        if (plan) {
            console.log(`Plan Name: ${plan.subscriptionPlanData.name}`);
            const eligibleIds = plan.subscriptionPlanData.eligibleItemIds;
            console.log(`Eligible Item IDs: ${JSON.stringify(eligibleIds)}`);

            if (eligibleIds && eligibleIds.length > 0) {
                console.log("Fetching details for eligible items...");
                
                // Fetch items (using batch retrieve or list with filter if needed, 
                // but let's try object.get one last time or list ITEMs and find)
                
                // We'll list all items (or search) and find the matching ones to be safe
                // Since user might have just created it, it should be in recent items
                
                const itemResponseWrapper = await squareClient.catalog.list({ types: 'ITEM' });
                let allItems = [];
                 if (itemResponseWrapper.response && itemResponseWrapper.response.objects) {
                   allItems = itemResponseWrapper.response.objects;
                } else if (itemResponseWrapper.data) {
                   allItems = itemResponseWrapper.data.objects || itemResponseWrapper.data; 
                } else if (itemResponseWrapper.result && itemResponseWrapper.result.objects) {
                    allItems = itemResponseWrapper.result.objects;
                }

                for (const itemId of eligibleIds) {
                    const item = allItems.find(i => i.id === itemId);
                        
                    if (item) {
                            console.log(`--------------------------------------------------`);
                        console.log(`Name: ${item.itemData.name}`);
                        console.log(`ID: ${item.id}`);
                        console.log(`Updated At: ${item.updatedAt}`);
                        console.log(`Type: ${item.type}`);
                        console.log(`Product Type: ${item.itemData.productType}`);
                            // Check visibility if available in this object structure
                            // e.g. item.itemData.ecom_available or similar?
                            // Usually 'available_online' or 'visibility'
                            console.log(`Is Taxable: ${item.itemData.taxIds ? 'Yes' : 'No'}`);
                        
                        item.itemData.variations?.forEach(v => {
                                console.log(`  - ${v.itemVariationData.name} (${v.id}) - ${v.itemVariationData.priceMoney?.amount} ${v.itemVariationData.priceMoney?.currency}`);
                        });
                    } else {
                        console.log(`Item ${itemId} not found in catalog list.`);
                        // Fallback to searching for it?
                    }
                }

            } else {
                console.log("No eligible items found linked to this plan.");
            }

        } else {
            console.log("Plan not found in list.");
        }

    } catch (e) {
        console.error("Error inspecting plan:", e);
    }
}

inspectPlan();
