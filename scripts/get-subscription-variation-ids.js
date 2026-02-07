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

const PLAN_IDS = [
    'LBZTK3K4MEBVIIWAVSURO2SK',
    'TSHE4PYA5732HHUE3YG3FQJR',
    'BJKQSNDFNBZHBDXMSF43F7I3',
    'QALKFCB6FL5TSTCCKWE6VU57'
];

async function getVariationIds() {
    console.log("Fetching Plan Variation IDs Sequentially...");
    
    for (const id of PLAN_IDS) {
        try {
            const response = await squareClient.catalog.object.get({ objectId: id });
            const result = response.result || response.body || response;
            const obj = result.object;
            
            if (obj) {
                const planName = obj.subscriptionPlanData?.name;
                const variationId = obj.subscriptionPlanData?.subscriptionPlanVariations?.[0]?.id;
                console.log(`Plan: ${planName}`);
                console.log(`Plan ID: ${obj.id}`);
                console.log(`Variation ID: ${variationId}`);
                console.log('---');
            }
        } catch (e) {
            console.error(`Error fetching ${id}:`, e);
        }
    }
}

getVariationIds();
