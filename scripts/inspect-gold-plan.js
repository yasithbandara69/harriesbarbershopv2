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

async function inspectGoldPlan() {
    const PLAN_ID = "EJGEEVYKOZMCQHWCLZI7MA4Z";

    try {
        console.log(`Inspecting Gold Plan: ${PLAN_ID}...`);
        
        let response = await client.catalog.object.get({
            objectId: PLAN_ID,
            includeRelatedObjects: true
        });

        const result = response.result || response;
        if (result.object) {
            console.log("\n--- GOLD PLAN OBJECT ---");
            console.log(JSON.stringify(result.object, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            , 2));
            return;
        }

        console.log("Gold Plan NOT FOUND.");
        
    } catch (error) {
        console.error("Error inspecting gold plan:", error);
    }
}

inspectGoldPlan();
