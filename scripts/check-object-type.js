
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

async function checkType() {
    const serviceId = "5NSMYVMEE3XCXQ6TB5AYN2RM";
    
    console.log(`Fetching Object: ${serviceId}...`);
    try {
        const res = await client.catalog.object.get({ 
            objectId: serviceId,
            includeRelatedObjects: true
        });
        
        const item = res.result ? res.result.object : (res.body ? res.body.object : res.object);
        
        if (item) {
            console.log("Object Type:", item.type);
            console.log("Object ID:", item.id);
            if (item.itemVariationData) console.log("Has ItemVariationData");
            if (item.itemData) console.log("Has ItemData");
        } else {
            console.log("Item is null/undefined");
            console.log("Response keys:", Object.keys(res));
        }

    } catch(e) { 
        console.log("FAILED:", e.message);
    }
}

checkType();
