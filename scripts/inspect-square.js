
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

console.log("Environment:", process.env.SQUARE_ENVIRONMENT);
console.log("Access Token Start:", process.env.SQUARE_ACCESS_TOKEN ? process.env.SQUARE_ACCESS_TOKEN.substring(0, 10) + "..." : "MISSING");

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function inspectObject() {
    const serviceId = "5NSMYVMEE3XCXQ6TB5AYN2RM";
    
    console.log(`Fetching Object: ${serviceId}...`);
    try {
        const res = await client.catalog.object.get({ 
            objectId: serviceId,
            includeRelatedObjects: true
        });
        
        console.log("--- RESPONSE STRUCTURE ---");
        // Print keys of the response wrapper
        console.log("Keys on response:", Object.keys(res));
        
        // Print result keys
        if (res.result) {
            console.log("Keys on res.result:", Object.keys(res.result));
            if (res.result.object) {
                 console.log("res.result.object type:", res.result.object.type);
                 console.log("res.result.object ID:", res.result.object.id);
                 console.log("res.result.object IS_DELETED:", res.result.object.isDeleted);
                 console.log("res.result.object PRESENT_AT:", res.result.object.presentAtAllLocations ? "ALL" : res.result.object.presentAtLocationIds);
                 console.log(JSON.stringify(res.result.object, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
            } else {
                console.log("res.result.object is MISSING");
            }
        }
        
        if (res.body) {
             console.log("res.body exists (JSON string length):", res.body.length);
        }

    } catch(e) { 
        console.log("FAILED:", e.message);
        if (e.body) console.log("Body:", JSON.stringify(e.body, null, 2));
    }
}

inspectObject();
