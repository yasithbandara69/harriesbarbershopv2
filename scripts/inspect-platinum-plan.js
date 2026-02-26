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

const { SquareClient } = require("square");
const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function inspectPlans() {
    const OLD_PLAT_ID = 'TZFH5YML6ZEMQHMKQBUJ34UN';
    
    try {
        console.log(`Inspecting OLD Platinum Plan: ${OLD_PLAT_ID}...`);
        
        let response = await client.catalog.object.get({
            objectId: OLD_PLAT_ID
        });

        const result = response.result || response;
        if (result.object) {
            console.log("\n--- OLD PLAN OBJECT ---");
            console.log(JSON.stringify(result.object, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value, 2));
        } else {
            console.log("Old Plan NOT FOUND.");
        }
        
    } catch (error) {
        console.error("Error inspecting plan:", error);
    }
}

inspectPlans();
