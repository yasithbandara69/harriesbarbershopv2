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

async function listVariations() {
    console.log("Listing Subscription Plan Variations...");
    
    try {
        const response = await client.catalog.search({
            objectTypes: ["SUBSCRIPTION_PLAN_VARIATION"],
            includeDeletedObjects: false
        });

        const result = response.result || response;
        const variations = result.objects || [];
        
        console.log(`Found ${variations.length} variations.`);
        
        const validVariations = variations.filter(v => 
            v.subscriptionPlanVariationData && 
            v.subscriptionPlanVariationData.subscriptionPlanId === "EJGEEVYKOZMCQHWCLZI7MA4Z"
        );

        console.log(`Found ${validVariations.length} variations for Gold Plan EJGEEVYKOZMCQHWCLZI7MA4Z.`);

        validVariations.forEach(v => {
            console.log(`\nID: ${v.id}`);
            console.log(`Name: ${v.subscriptionPlanVariationData.name}`);
            console.log(JSON.stringify(v.subscriptionPlanVariationData, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
            , 2));
        });

        // Also let's specific search for items related to our Plan ID
        // But Subscription Plans are top level. Variations are... where?
        
    } catch (error) {
        console.error("Error listing variations:", error);
    }
}

listVariations();
