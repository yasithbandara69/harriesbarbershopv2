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

const ITEM_VARIATION_ID = '476R3Q6R3TFKNNPQ2DYQ47KE'; // Gold Cut Item Var ID from subscription-data

async function checkItemPrice() {
    console.log(`Checking price for Variation ID: ${ITEM_VARIATION_ID}`);
    try {
        const response = await squareClient.catalog.object.get({
            objectId: ITEM_VARIATION_ID
        });

        const result = response.result || response.body || response;
        if (result.object) {
            const varData = result.object.itemVariationData;
            console.log(`Name: ${varData.name}`);
            console.log(`Price: ${varData.priceMoney?.amount} ${varData.priceMoney?.currency}`);
            console.log(`Pricing Type: ${varData.pricingType}`);
        } else {
            console.log("Object not found");
        }

    } catch (e) {
        console.error("Error fetching item:", e);
    }
}

checkItemPrice();
