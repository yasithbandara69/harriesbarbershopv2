
const fs = require('fs');
const path = require('path');
const { SquareClient, SquareEnvironment } = require("square");

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function fixVariation() {
    const variationId = "IG3KC7ZQIDZFPETUY3UWRPTU";
    
    console.log(`Fetching Variation: ${variationId}...`);
    try {
        // 1. Fetch current object to get version
        const res = await client.catalog.object.get({ 
            objectId: variationId
        });
        
        const retrievedObj = res.result ? res.result.object : (res.body ? res.body.object : res.object);
        
        if (!retrievedObj) {
            console.error("Could not retrieve object.");
            return;
        }
        
        console.log("Current Version:", retrievedObj.version);
        console.log("Current AvailableForBooking:", retrievedObj.itemVariationData.availableForBooking);
        
        // 2. Prepare Update
        // We must update the whole object wrapper or specific fields? Catalog Upsert replaces the object usually, so we need full data.
        // Actually, retrieveCatalogObject returns the whole object. We modify it and send it back.
        
        const updatedObject = {
            ...retrievedObj,
            itemVariationData: {
                ...retrievedObj.itemVariationData,
                availableForBooking: true 
            }
        };
        
        console.log("Updating to availableForBooking: true...");
        
        const upsertRes = await client.catalog.object.upsert({
            idempotencyKey: new Date().toISOString(),
            object: updatedObject
        });
        
        const finalObj = upsertRes.result ? upsertRes.result.catalogObject : (upsertRes.body ? upsertRes.body.catalogObject : upsertRes.catalogObject);
        console.log("Update Success!");
        console.log("New Version:", finalObj.version);
        console.log("New AvailableForBooking:", finalObj.itemVariationData.availableForBooking);

    } catch(e) { 
        console.log("FAILED:", e.message);
        if (e.body) console.log(JSON.stringify(e.body, null, 2));
    }
}

fixVariation();
