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

async function listVariations() {
    console.log(`Fetching Plan: ${PLAN_ID}`);
    try {
        const response = await squareClient.catalog.object.get({
            objectId: PLAN_ID
        });

        const obj = response.result?.object || response.body?.object || response.object;
        if (obj) {
            console.log(`Plan Name: ${obj.subscriptionPlanData.name}`);
            const variations = obj.subscriptionPlanData.subscriptionPlanVariations;
            if (variations) {
                variations.forEach(v => {
                    console.log(`--------------------------------------------------`);
                    console.log(`Variation ID: ${v.id}`);
                    console.log(`Name: ${v.subscriptionPlanVariationData.name}`);
                    const phases = v.subscriptionPlanVariationData.phases;
                    if (phases && phases[0]) {
                        if (phases[0].recurringPriceMoney) {
                             console.log(`Price: ${phases[0].recurringPriceMoney.amount} ${phases[0].recurringPriceMoney.currency}`);
                        } else {
                            console.log(`Price Type: ${phases[0].pricing?.type} (Likely Varies by Item)`);
                        }
                    }
                });
            } else {
                console.log("No variations found (weird).");
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

listVariations();
