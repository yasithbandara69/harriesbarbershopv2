const { SquareClient } = require('square');
const fs = require('fs');
const path = require('path');

// 1. Load Env
try {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
} catch (e) {}

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function main() {
    console.log("=== LISTING ALL ACCESSIBLE LOCATIONS ===");
    console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
    console.log(`Token Prefix: ${process.env.SQUARE_ACCESS_TOKEN.substring(0, 10)}...`);

    try {
        const response = await squareClient.locations.list();
        const locations = response.result?.locations || response.body?.locations || response.locations || [];
        
        if (!locations || locations.length === 0) {
            console.log("No locations found (unexpected for active account).");
            console.log("Raw Response Keys:", Object.keys(response));
            if (response.result) console.log("Result Keys:", Object.keys(response.result));
        } else {
            locations.forEach(loc => {
                console.log("-----------------------------------------");
                console.log(`Name:        ${loc.name}`);
                console.log(`ID:          ${loc.id}`);
                console.log(`Status:      ${loc.status}`);
                console.log(`Type:        ${loc.type}`);
                console.log(`Address:     ${loc.address?.addressLine1}, ${loc.address?.locality}`);
            });
            console.log("-----------------------------------------");
        }

    } catch (e) {
        console.error("Error listing locations:", e.message);
    }
}

main();
