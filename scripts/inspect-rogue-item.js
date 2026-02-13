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

const TARGET_VAR_ID = "MN74NI7HDAD56CGSQHATYX75";

async function inspectTarget() {
    console.log(`Inspecting Target Variation: ${TARGET_VAR_ID}`);
    try {
        const response = await client.catalog.object.get({ objectId: TARGET_VAR_ID });
        const obj = (response.result || response).object;
        
        console.log("--- Object Data ---");
        console.log(`ID: ${obj.id}`);
        console.log(`Type: ${obj.type}`);
        
        if (obj.type === "ITEM_VARIATION") {
             console.log(`Parent Item ID: ${obj.itemVariationData.itemId}`);
        } else {
             console.log("Object is not an ITEM_VARIATION.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

inspectTarget();
