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

const SUB_ID = '83278187-2e78-40e3-86b8-7bfb5628198d';

async function debugSubscription() {
    console.log(`Fetching Subscription: ${SUB_ID}...`);
    try {
        const response = await squareClient.subscriptions.retrieve({ subscriptionId: SUB_ID });
        const sub = response.result?.subscription || response.body?.subscription;

        if (!sub) {
            console.log("Subscription NOT FOUND.");
            return;
        }

        console.log("--- RAW SUBSCRIPTION DATA ---");
        // Safe stringify with BigInt support
        console.log(JSON.stringify(sub, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
        , 2));

    } catch (e) {
        console.error("Error found:", e);
    }
}

debugSubscription();
