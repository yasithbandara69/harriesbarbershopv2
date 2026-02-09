const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Load Env
try {
  const envConfig = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  envConfig.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
} catch (e) {
  console.warn("Could not load .env.local", e);
}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
});

const TARGET_ID = "SMVJNPINNCCMWRLDQTDICE25";

async function inspectItem() {
  console.log(`Inspecting ID: ${TARGET_ID}...`);
  try {
    const response = await client.catalog.object.get({ objectId: TARGET_ID });
    console.log("Full Response:", JSON.stringify(response, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    const obj = response.result.object;
    
    console.log("------------------------------------------------");
    console.log(`ID: ${obj.id}`);
    console.log(`TYPE: ${obj.type}`);
    console.log(`IS DELETED: ${obj.isDeleted}`);
    console.log(`PRESENT AT LOCATIONS: ${obj.presentAtAllLocations ? 'ALL' : obj.presentAtLocationIds?.join(', ')}`);
    
    if (obj.itemData) {
        console.log(`NAME: ${obj.itemData.name}`);
        console.log(`PRODUCT TYPE: ${obj.itemData.productType}`);
        console.log("VARIATIONS:");
        obj.itemData.variations.forEach(v => {
            console.log(` - [${v.id}] ${v.itemVariationData.name}`);
            console.log(`   Pricing: ${JSON.stringify(v.itemVariationData.priceMoney)}`);
            console.log(`   Service Duration: ${v.itemVariationData.serviceDuration}`);
            console.log(`   Available for Booking: ${v.itemVariationData.availableForBooking}`); // Hypothetical field
        });
    } else if (obj.itemVariationData) {
         console.log(`VARIATION NAME: ${obj.itemVariationData.name}`);
         console.log(`PARENT ID: ${obj.itemVariationData.itemId}`);
    }

  } catch (error) {
    console.error("Error retrieving object:", error);
  }
}

inspectItem();
