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

const SUBSCRIPTION_PLAN_VARIATION_ID = 'KBSCWFLBQ4XFOKLB3SI5HNWY'; // Gold

async function checkPrice() {
    console.log(`Fetching price for Variation ID: ${SUBSCRIPTION_PLAN_VARIATION_ID}`);
    try {
        const response = await squareClient.catalog.object.get({
            objectId: SUBSCRIPTION_PLAN_VARIATION_ID
        });

        // Mimic route.ts logic
        const objectData = response.result?.object || response.body?.object || response.object;

        if (objectData) {
            console.log("Object found.");
            console.log(JSON.stringify(objectData, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
            , 2));

            const phases = objectData.subscriptionPlanVariationData?.phases;
            if (phases && phases[0]) {
                const money = phases[0].recurringPriceMoney;
                console.log(`Price Money: ${money?.amount} ${money?.currency}`);
            } else {
                console.log("No phases found.");
            }
        } else {
            console.log("Object not found.");
        }

    } catch (e) {
        console.error("Error fetching item:", e);
    }
}

checkPrice();
