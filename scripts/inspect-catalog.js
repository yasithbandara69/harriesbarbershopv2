const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

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

if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error("ERROR: SQUARE_ACCESS_TOKEN is missing!");
} else {
    console.log("SQUARE_ACCESS_TOKEN loaded: " + process.env.SQUARE_ACCESS_TOKEN.substring(0, 10) + "...");
}

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production, 
});

console.log("Square Client Keys:", Object.keys(squareClient));
async function listCatalogItems() {
  try {
    console.log("Listing Platinum Catalog Objects...");
    
    // searchItems(params)
    const response = await squareClient.catalog.searchItems({
       textFilter: "Platinum",
       productTypes: ["REGULAR", "APPOINTMENTS_SERVICE"]
    });

    const items = response.result ? response.result.items : (response.items || []);
    
    if (items) {
      items.forEach(item => {
        if (item.type === 'ITEM' && item.itemData) {
            const name = item.itemData.name;
            const vars = item.itemData.variations || [];
             vars.forEach(v => {
                  console.log(`${name} | VarID: ${v.id}`);
             });
        }
      });
    } else {
      console.log("No items found.");
    }
    
    if (objects) {
      objects.forEach(item => {
        if (item.type === 'ITEM' && item.itemData) {
            console.log(`Item Name: ${item.itemData.name}`);
            console.log(`Item ID: ${item.id}`);
            if (item.itemData.variations) {
                item.itemData.variations.forEach(variation => {
                    console.log(`  Variation Name: ${variation.itemVariationData?.name}`);
                    console.log(`  Variation ID: ${variation.id}`);
                    console.log(`  Price: ${variation.itemVariationData?.priceMoney?.amount}`);
                });
            }
            console.log('---');
        }
      });
    } else {
      console.log("No items found.");
    }
  } catch (error) {
    console.error("Error listing catalog:", error);
  }
}

listCatalogItems();
