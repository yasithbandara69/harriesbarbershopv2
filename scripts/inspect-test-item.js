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

async function inspectItem() {
    // The Item ID from previous run
    const ITEM_ID = "H34DBIXU3LWJRRVR6EBU3OUM"; 
    
    console.log(`Inspecting Item: ${ITEM_ID}`);
    try {
        const response = await client.catalog.object.get({ objectId: ITEM_ID });
        const item = (response.result || response).object;
        
        if (item && item.itemData && item.itemData.variations) {
            console.log("Variations found:");
            item.itemData.variations.forEach(v => {
                console.log(`- Variation ID: ${v.id}`);
                console.log(`  Name: ${v.itemVariationData.name}`);
            });
        } else {
            console.log("Item found but no variations?");
            console.log(JSON.stringify(item, null, 2));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

inspectItem();
