
const fs = require('fs');
const path = require('path');
const { SquareClient, SquareEnvironment } = require("square");

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '../../.env.local'); // Adjust path if needed, usually ../.env.local relative to script
    // Actually easier to just mock if we only need method names, but client needs auth.
    // Let's assume the previous script logic works.
    const rootEnv = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(rootEnv)) {
         const envConfig = fs.readFileSync(rootEnv, 'utf8');
         envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
} catch (e) {}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || "mock_token", // Token might not be strictly needed just to inspect prototype/keys if we don't make a call
  environment: SquareEnvironment.Sandbox,
});

async function inspectSubscriptions() {
    console.log("--- Inspecting client.subscriptions ---");
    console.log(Object.keys(client.subscriptions));
    console.log(Object.getPrototypeOf(client.subscriptions));
    
    // Also try to print the function definition of something close if found
    try {
        // In some versions it might be .retrieve
        if (client.subscriptions.retrieveSubscription) console.log("Found retrieveSubscription");
        if (client.subscriptions.retrieve) console.log("Found retrieve");
        if (client.subscriptions.get) console.log("Found get");
    } catch (e) {}
}

inspectSubscriptions();
