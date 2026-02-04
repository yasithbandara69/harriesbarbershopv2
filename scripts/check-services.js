
const { SquareClient, SquareEnvironment } = require("square");
require('dotenv').config({ path: '.env.local' });

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function listServices() {
  try {
    const response = await client.catalog.searchItems({
      productTypes: ["APPOINTMENTS_SERVICE"],
    });
    
    const items = response.result.items || [];
    console.log(`Found ${items.length} items.`);
    
    items.forEach(item => {
        console.log(`\nItem: ${item.itemData.name}`);
        if (item.itemData.variations) {
            item.itemData.variations.forEach(v => {
                 console.log(`  - Variation: ${v.itemVariationData.name} | ID: ${v.id}`);
            });
        }
    });

  } catch (error) {
    console.error(error);
  }
}

listServices();
