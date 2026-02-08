const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Load Env
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

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production, 
});

async function listRecentItems() {
    console.log("Fetching ITEMs...");
    try {
        const responseWrapper = await squareClient.catalog.list({ types: 'ITEM' });

        // Debugging structure if needed, but trying known path
        // Keys seen: ['response', 'rawResponse', 'data', ...]
        // list-subscription-plans.js used response.response.objects
        
        let items = [];
        if (responseWrapper.response && responseWrapper.response.objects) { // .objects for listCatalog
           items = responseWrapper.response.objects;
        } else if (responseWrapper.data) { 
           // Sometimes data holds the list directly or inside objects
           items = responseWrapper.data.objects || responseWrapper.data; 
        }

        if (items && Array.isArray(items)) {
            // Sort by updated_at descending
            items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            console.log(`Found ${items.length} items. Showing top 5 most recent:`);
            items.slice(0, 5).forEach(item => {
                console.log(`--------------------------------------------------`);
                console.log(`Name: ${item.itemData.name}`);
                console.log(`ID: ${item.id}`);
                console.log(`Updated At: ${item.updatedAt}`);
                console.log(`Type: ${item.type}`);
                console.log(`Product Type: ${item.itemData.productType}`);
                console.log(`Present At All Locations: ${item.presentAtAllLocations}`);
                console.log(`Variations:`);
                item.itemData.variations?.forEach(v => {
                    console.log(`  - ${v.itemVariationData.name} (${v.id}) - ${v.itemVariationData.priceMoney?.amount} ${v.itemVariationData.priceMoney?.currency}`);
                });
            });
        } else {
            console.log("No items found.");
            // Deep debug
             try {
                console.log("response.response keys:", responseWrapper.response ? Object.keys(responseWrapper.response) : 'undefined');
                console.log("response.data:", JSON.stringify(responseWrapper.data).substring(0, 200));
             } catch(e) {}
        }

    } catch (e) {
        console.error("Error listing items:", e);
    }
}

listRecentItems();
