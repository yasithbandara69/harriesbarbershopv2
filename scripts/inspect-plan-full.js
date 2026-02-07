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

const PLAN_ID = 'LBZTK3K4MEBVIIWAVSURO2SK'; // Gold Plan ID

async function checkPlan() {
    console.log(`Fetching Plan Details for ID: ${PLAN_ID}`);
    try {
        const response = await squareClient.catalog.object.get({
            objectId: PLAN_ID
        });

        const objectData = response.result?.object || response.body?.object || response.object;

        if (objectData) {
            console.log("Full Object Dump:");
            console.log(JSON.stringify(objectData, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
            , 2));

            const planData = objectData.subscriptionPlanData;
            console.log("\n--- Eligibility Rules ---");
            console.log(`Eligible Item Ids: ${JSON.stringify(planData.eligibleItemIds)}`);
            console.log(`Eligible Category Ids: ${JSON.stringify(planData.eligibleCategoryIds)}`);
            console.log(`All Items: ${planData.allItems ? "Yes" : "No"}`);
        } else {
            console.log("Object not found.");
        }

    } catch (e) {
        console.error("Error fetching plan:", e);
    }
}

checkPlan();
