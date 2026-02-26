const fs = require('fs');
const path = require('path');

// Load environment variables locally
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

const { SquareClient } = require("square");
const { randomUUID } = require("crypto");

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

const VARIATION_IDS = [
  { id: 'MN74NI7HDAD56CGSQHATYX75', newName: 'Essential Haircut (Subscription Item)' },
  { id: 'L3M7G47Q63K2X5Q55K4I75U7', newName: 'Premium Haircut (Subscription Item)' },
  { id: 'MNIB2VOXZDWE27IUDYNU6OXC', newName: 'Essential Haircut + Beard (Subscription Item)' },
  { id: 'J5K3M67Q43K2X5Q55K4I75U7', newName: 'Premium Haircut + Beard (Subscription Item)' }
];

async function renameVariations() {
  for (const item of VARIATION_IDS) {
    try {
      // Get the variation
      const response = await client.catalog.object.get({ objectId: item.id });
      const variation = response.result?.object || response.object;
      
      if (!variation || variation.type !== 'ITEM_VARIATION') {
        console.log(`Variation ${item.id} not found or invalid type.`);
        continue;
      }

      // We actually need the parent item to rename it, or we can just rename the variation
      const parentId = variation.itemVariationData.itemId;
      
      // Get the parent item
      const parentResponse = await client.catalog.object.get({ objectId: parentId });
      const parentItem = parentResponse.result?.object || parentResponse.object;

      if (parentItem && parentItem.type === 'ITEM') {
        // Update both Parent Item and Variation for consistency
        parentItem.itemData.name = item.newName;
        
        // Find the variation in the parent item
        const matchingVariation = parentItem.itemData.variations.find(v => v.id === item.id);
        if (matchingVariation) {
            matchingVariation.itemVariationData.name = "Regular"; // Usually variations are named Regular if item is named correctly
        }

        // Upsert
        console.log(`Updating ${parentId} to name: ${item.newName}`);
        await client.catalog.object.upsert({
          idempotencyKey: randomUUID(),
          object: parentItem
        });
        console.log(`✅ Success!`);
      }

    } catch (e) {
      console.error(`Error renaming ${item.id}:`, e);
    }
  }
}

renameVariations();
