const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    });
    return envVars;
  } catch (error) {
    console.warn("Could not load .env.local:", error.message);
    return process.env;
  }
}

const env = loadEnv();
const accessToken = env.SQUARE_ACCESS_TOKEN;

if (!accessToken) {
  console.error("SQUARE_ACCESS_TOKEN not found in .env.local");
  process.exit(1);
}

const client = new SquareClient({
  token: accessToken,
  environment: SquareEnvironment.Production,
});

async function listServices() {
  try {
    console.log("Fetching catalog items (type: ITEM, APPOINTMENT_SERVICE)...");
    
    // List standard ITEMs
    const response = await client.catalog.list({ types: "ITEM" });
    console.log("Response Keys:", Object.keys(response));
    
    // Check data keys
    console.log("Response Data Keys:", response.data ? Object.keys(response.data) : "No Data");

    // Try getItems helper
    let items = [];
    if (typeof response.getItems === 'function') {
        try {
            items = await response.getItems();
            console.log("Retrieved items via getItems()");
        } catch (e) {
            console.warn("getItems failed:", e);
        }
    }
    
    // Fallback? No, response.data IS the array based on keys [ '0', '1', ... ]
    if (!items || items.length === 0) {
        if (Array.isArray(response.data)) {
            items = response.data;
        } else if (response.data && typeof response.data === 'object') {
             // It might be an object with numeric keys matching an array, or just an array
             items =  Object.values(response.data);
        }
    }

    console.log(`Found ${items.length} items. Filtering for Haircut/Beard services...`);

    if (items.length > 0) {
        console.log("First Item Sample:", JSON.stringify(items[0], (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    }

    const findings = [];
    console.log(`\n--- ANALYSIS (${items.length} items) ---`);

    items.forEach(item => {
        const name = item.itemData?.name || "Unnamed";
        const pType = item.itemData?.productType;
        
        // precise filter
        if (name.toLowerCase().includes('haircut') || name.toLowerCase().includes('beard')) {
             const foundItem = {
                 name,
                 id: item.id,
                 productType: pType,
                 variations: []
             };

             if (item.itemData?.variations) {
                 item.itemData.variations.forEach(v => {
                     const price = v.itemVariationData?.priceMoney;
                     const duration = v.itemVariationData?.serviceDuration; // ms
                     const bookable = v.itemVariationData?.availableForBooking;
                     
                     if (duration) {
                         const durationMin = Number(duration) / 60000;
                         foundItem.variations.push({
                             name: v.itemVariationData?.name,
                             id: v.id,
                             durationMin,
                             price: price ? Number(price.amount)/100 : 'N/A',
                             bookable
                         });
                     }
                 });
             }
             findings.push(foundItem);
        }
    });
    
    fs.writeFileSync('services_found.json', JSON.stringify(findings, null, 2));
    console.log(`Wrote ${findings.length} findings to services_found.json`);

  } catch (error) {
    console.error("Error listing services:", error);
  }
}

listServices();
