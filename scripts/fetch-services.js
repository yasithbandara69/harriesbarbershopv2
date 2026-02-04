
const { SquareClient, SquareEnvironment } = require("square");
require('dotenv').config({ path: '.env.local' });

// Detailed logging
console.log("Initializing Square Client...");
console.log("Environment:", process.env.SQUARE_ENVIRONMENT);
console.log("Location:", process.env.SQUARE_LOCATION_ID);

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function listServices() {
  try {
    console.log("Fetching services...");
    const response = await client.catalog.searchItems({
      productTypes: ["APPOINTMENTS_SERVICE"],
    });
    
    const items = response.result.items || [];
    console.log(`\n--- FOUND ${items.length} SERVICES ---`);
    
    items.forEach(item => {
        console.log(`\nService Name: ${item.itemData.name}`);
        if (item.itemData.variations) {
            item.itemData.variations.forEach(v => {
                 console.log(`  > Variation: "${v.itemVariationData.name}"`);
                 console.log(`    - Variation ID: ${v.id}`); // This is what we need
                 console.log(`    - Price: ${v.itemVariationData.priceMoney?.amount || 0}`);
            });
        }
    });

  } catch (error) {
    console.error("API Error:", error);
  }
}

listServices();
