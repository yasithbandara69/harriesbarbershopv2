const { SquareClient } = require("square");
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function findGoldItems() {
    console.log("Searching for items with 'Gold' in name...");
    try {
        const response = await client.catalog.search({
            objectTypes: ["ITEM"],
            query: {
                textQuery: {
                    keywords: ["Gold"]
                }
            }
        });
        
        const result = response.result || response;
        if (result.objects) {
            result.objects.forEach(item => {
                console.log(`\n--- Found Item ---`);
                console.log(`Name: ${item.itemData.name}`);
                console.log(`ID: ${item.id}`);
                console.log(`Variations:`);
                if (item.itemData.variations) {
                    item.itemData.variations.forEach(v => {
                        console.log(`  - Name: ${v.itemVariationData.name}`);
                        console.log(`    ID: ${v.id}`);
                        console.log(`    Price: ${v.itemVariationData.priceMoney ? v.itemVariationData.priceMoney.amount + ' ' + v.itemVariationData.priceMoney.currency : 'N/A'}`);
                    });
                }
            });
        } else {
            console.log("No items found.");
        }
    } catch (e) {
        console.error(e);
    }
}

findGoldItems();
