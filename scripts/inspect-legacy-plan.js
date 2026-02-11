const fs = require('fs');
const path = require('path');

// Load .env.local manually
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
const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function inspectLegacyPlan() {
    const LEGACY_ITEM_VAR_ID = "UTYAA22JQROPKLS4KZ4TSQZI";

    try {
        console.log(`Inspecting Legacy Item: ${LEGACY_ITEM_VAR_ID} (via Catalog.get)...`);
        
        let response = await client.catalog.object.get({
            objectId: LEGACY_ITEM_VAR_ID,
            includeRelatedObjects: true // Get the parent item and maybe subscription settings?
        });

        const result = response.result || response;
        if (result.object) {
            console.log("\n--- LEGACY ITEM OBJECT ---");
            console.log(JSON.stringify(result.object, null, 2));
            
            if (result.relatedObjects) {
                console.log("\n--- RELATED OBJECTS ---");
                result.relatedObjects.forEach(obj => {
                    console.log(`Type: ${obj.type}, ID: ${obj.id}, Name: ${obj.subscriptionPlanData?.name || obj.itemData?.name}`);
                });
            }
            return;
        }

        console.log("Legacy Item NOT FOUND.");
        
    } catch (error) {
        console.error("Error inspecting legacy plan:", error);
    }
}

inspectLegacyPlan();
