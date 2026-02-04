
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

async function checkVariation() {
    const itemId = "5NSMYVMEE3XCXQ6TB5AYN2RM";
    
    console.log(`Fetching Item: ${itemId}...`);
    try {
        const res = await client.catalog.object.get({ 
            objectId: itemId,
            includeRelatedObjects: true
        });
        
        const item = res.result ? res.result.object : (res.body ? res.body.object : res.object);
        
        if (item && item.type === 'ITEM') {
             console.log("Item Found:", item.itemData.name);
             const variations = item.itemData.variations || [];
             console.log(`Found ${variations.length} variations.`);
             
             variations.forEach((v, i) => {
                 console.log(`\n--- Variation ${i} ---`);
                 console.log("ID:", v.id);
                 console.log("Name:", v.itemVariationData.name);
                 console.log("Pricing Type:", v.itemVariationData.pricingType);
                 console.log("Price:", v.itemVariationData.priceMoney);
                 console.log("Duration:", v.itemVariationData.serviceDuration);
                 console.log("Available for Booking:", v.itemVariationData.availableForBooking);
                 console.log("Sellable:", v.itemVariationData.sellable);
                 console.log("Stockable:", v.itemVariationData.stockable);
                 console.log("Team Member IDs:", v.itemVariationData.teamMemberIds);
             });
        }

    } catch(e) { 
        console.log("FAILED:", e.message);
        if (e.body) console.log(JSON.stringify(e.body, null, 2));
    }
}

checkVariation();
