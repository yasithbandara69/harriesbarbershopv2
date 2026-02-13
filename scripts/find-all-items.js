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

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function main() {
    console.log("--- FINDING ALL MEMBERSHIP ITEMS ---");
    
    try {
        console.log("Inspecting Client Proto:", Object.getPrototypeOf(client));
        if (client.catalog) console.log("Catalog Proto:", Object.getPrototypeOf(client.catalog));
        
        // Try accessing the API via direct import to see structure?
        // No, let's just try to fallback to raw REST call if SDK fails.
        // It seems the SDK might be a different version than standard docs.
        
        console.log("\n--- FALLBACK TO REST API ---");
        const fetch = require('node-fetch'); // Ensure node-fetch is available? Or use built-in fetch in newer node
        
        const url = (process.env.SQUARE_ENVIRONMENT === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com") + "/v2/catalog/list?types=ITEM";
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        const json = await response.json();
        
        if (json.objects) {
             const allItems = json.objects;
             logItems(allItems);
        } else {
             console.log("REST Error or Empty:", JSON.stringify(json, null, 2));
        }

    } catch (e) {
        console.error("\n❌ SCRIPT ERROR:", e.message || e);
    }

    function logItems(allItems) {
        if (!allItems || allItems.length === 0) {
            console.log("No items found.");
            return;
        }

        allItems.forEach(item => {
            if (item.type === 'ITEM' && item.itemData.name && item.itemData.name.toLowerCase().includes('membership')) {
                console.log(`\nITEM: ${item.itemData.name}`);
                console.log(`ID: ${item.id}`);
                if (item.itemData.variations) {
                    item.itemData.variations.forEach(v => {
                        console.log(`  - Variation: ${v.itemVariationData.name}`);
                        console.log(`    ID: ${v.id}`);
                        const price = v.itemVariationData.priceMoney;
                        if (price) console.log(`    Price: ${price.amount} ${price.currency}`);
                    });
                }
            }
        });
    }
}

main();
