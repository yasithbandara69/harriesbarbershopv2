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

const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

async function inspectLocation() {
    console.log(`Inspecting Location: ${LOCATION_ID}`);
    try {
        const response = await client.locations.list();
        const locations = (response.result || response).locations || [];
        
        const location = locations.find(l => l.id === LOCATION_ID);
        
        if (location) {
            console.log(`Name: ${location.name}`);
            console.log(`Status: ${location.status}`);
            console.log(`Currency: ${location.currency}`);
            console.log(`Country: ${location.country}`);
            console.log(`Capabilities: ${location.capabilities?.join(', ')}`);
        } else {
            console.log("❌ Location ID not found in account list.");
            console.log("Available Locations:", locations.map(l => l.id).join(", "));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

inspectLocation();
