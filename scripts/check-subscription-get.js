
const fs = require('fs');
const path = require('path');
const { SquareClient, SquareEnvironment } = require("square");
// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
} catch (e) {}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function checkGet() {
    console.log("Testing subscriptions.get({ subscriptionId: '...' })...");
    try {
        // Use a dummy ID, we just want to see if it accepts the arg structure or throws "unknown argument"
        await client.subscriptions.get({ subscriptionId: "TEST_ID" });
        console.log("Call didn't crash on arguments (might fail on not found, which is fine)");
    } catch(e) {
        console.log("Error:", e.message);
        if (e.message.includes("subscriptionId")) console.log("Looks like it expects subscriptionId");
    }
}

checkGet();
