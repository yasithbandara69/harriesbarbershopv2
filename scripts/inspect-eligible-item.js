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

const ITEM_ID = 'UPWV6SLJEPID5SUZ4LIFXV6E'; // From check-plan output

async function checkItem() {
    console.log(`Fetching Item Details for ID: ${ITEM_ID}`);
    try {
        const response = await squareClient.catalog.object.get({
            objectId: ITEM_ID
        });

        const objectData = response.result?.object || response.body?.object || response.object;

        if (objectData) {
            console.log(`Item Name: ${objectData.itemData.name}`);
            console.log(`Present at all locations: ${objectData.presentAtAllLocations}`);
            console.log(`Present at Location IDs: ${objectData.presentAtLocationIds}`);
            
            const variations = objectData.itemData.variations;
            if (variations) {
                variations.forEach(v => {
                    console.log(`Variation ID: ${v.id}`);
                    console.log(`Name: ${v.itemVariationData.name}`);
                    const price = v.itemVariationData.priceMoney;
                    console.log(`Price: ${price?.amount} ${price?.currency}`);
                    console.log(`Var present at all locations: ${v.presentAtAllLocations}`);
                    console.log(`Var present at Location IDs: ${v.presentAtLocationIds}`);
                });
            }
        } else {
            console.log("Object not found.");
        }

    } catch (e) {
        console.error("Error fetching item:", e);
    }
}

checkItem();
