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

const TARGET_ALIASE_NAMES = [
  "Gold Membership Haircut",
  "Platinum Membership Haircut", 
  "Platinum Membership Haircut + Beard"
];


const EXCLUDED_IDS = [
    "LW5ZSQKJQ2TQ6GH3ZDRU",
    "TSHE4PYA5732HHUE3YG3FQJR",
    "QALKFCB6FL5TSTCCKWE6VU57",
    "LBZTK3K4MEBVIIWAVSURO2SK"
];

async function deleteDuplicates() {
    try {
        console.log("Searching for plans to delete...");
        
        const response = await client.catalog.search({
            objectTypes: ["SUBSCRIPTION_PLAN"]
        });

        const result = response.result || response;
        const plans = result.objects || [];
        
        console.log(`Found ${plans.length} total plans.`);

        const toDelete = plans.filter(p => 
            !p.isDeleted && 
            TARGET_ALIASE_NAMES.includes(p.subscriptionPlanData.name) &&
            !EXCLUDED_IDS.includes(p.id)
        );
        
        console.log(`Found ${toDelete.length} plans to delete (excluding originals).`);

        if (toDelete.length === 0) {
            console.log("No duplicates found.");
            return;
        }

        console.log("Deleting...");
        const ids = toDelete.map(p => p.id);
        
        // Batch delete
        const deleteRes = await client.catalog.batchDelete({
            objectIds: ids
        });
        
        const deleteResult = deleteRes.result || deleteRes;
        console.log(`Successfully deleted ${deleteResult.deletedObjectIds ? deleteResult.deletedObjectIds.length : 0} items.`);
        console.log("Deleted IDs:", ids);

    } catch (error) {
        console.error("Error deleting duplicates:", error);
         if (error.body) console.error(JSON.stringify(error.body, null, 2));
    }
}

deleteDuplicates();
