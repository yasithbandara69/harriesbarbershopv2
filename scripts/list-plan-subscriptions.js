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

const PLAN_ID = 'LW5ZSQKJQ2TQ6GH3ZDRU'; // Test Plan ID

async function listSubscriptions() {
    console.log(`Listing Subscriptions for Plan: ${PLAN_ID}...`);
    try {
        const response = await squareClient.subscriptions.search({
            query: {
                filter: {
                    planIds: [PLAN_ID]
                }
            }
        });
        
        const result = response.result || response.body || response;
        const subscriptions = result.subscriptions || [];
        
        console.log(`Found ${subscriptions.length} subscriptions.`);
        
        subscriptions.forEach(sub => {
            console.log("------------------------------------------------");
            console.log(`ID: ${sub.id}`);
            console.log(`Customer ID: ${sub.customerId}`);
            console.log(`Status: ${sub.status}`);
            console.log(`Start Date: ${sub.startDate}`);
            console.log(`Charged Through: ${sub.chargedThroughDate}`);
        });

    } catch (e) {
        console.error("Error listing subscriptions:", e);
    }
}

listSubscriptions();
