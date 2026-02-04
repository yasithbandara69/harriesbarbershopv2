
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

async function inspectMethods() {
    console.log("--- Inspecting listTeamMembers ---");
    try {
        const res = await client.bookings.teamMemberProfiles.list({ locationId: process.env.SQUARE_LOCATION_ID });
        console.log("Top Keys:", Object.keys(res));
        if (res.data) console.log("res.data Keys:", Object.keys(res.data));
        // It seems to be a Page object
    } catch(e) { console.log("Error:", e.message); }

    console.log("\n--- Inspecting customers.search ---");
    try {
        const res = await client.customers.search({
            query: { filter: { emailAddress: { exact: "test@example.com" } } }
        });
        console.log("Keys:", Object.keys(res));
        if (res.customers) console.log("Has .customers directly");
    } catch(e) { console.log("Error:", e.message); }
    
    console.log("\n--- Inspecting customers.create ---");
    try {
        // Just verify keys on a dummy call if possible, or assume based on search
        // Actually creating a user might spam, so let's skip or try invalid data to get error? 
        // Or just rely on search pattern.
        // Usually search return wrapper matching get/create.
    } catch(e) {}
}

inspectMethods();
