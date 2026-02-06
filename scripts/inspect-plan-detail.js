const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Load Env
try {
  const envConfig = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.warn("Could not load .env.local", e);
}

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production, 
});

const PLAN_ID = 'LBZTK3K4MEBVIIWAVSURO2SK'; // Gold Plan

async function inspectPlan() {
    console.log(`Inspecting Plan: ${PLAN_ID}`);
    try {
        const response = await squareClient.catalog.object.get({ objectId: PLAN_ID });
        // Handle SDK response structure
        const result = response.result || response.body || response;
        
        console.log("Plan Object Full JSON:");
        console.log(JSON.stringify(result.object, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value, 
        2));
        
    } catch (e) {
        console.error("Error fetching plan:", e);
    }
}

inspectPlan();
