
const fs = require('fs');
const path = require('path');
const { SquareClient, SquareEnvironment } = require("square");

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function inspectAvailability() {
    const variationId = "IG3KC7ZQIDZFPETUY3UWRPTU";
    const staffId = "TMMZpLgW00Z1uRNm"; 
    const locationId = process.env.SQUARE_LOCATION_ID;

    // Tomorrow
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17, 0, 0, 0);

    const query = {
        query: {
            filter: {
                startAtRange: {
                    startAt: start.toISOString(),
                    endAt: end.toISOString()
                },
                locationId,
                segmentFilters: [
                    {
                        serviceVariationId: variationId,
                        teamMemberIdFilter: {
                            any: [staffId]
                        }
                    }
                ]
            }
        }
    };
    
    console.log("Searching Availability...");
    try {
        const res = await client.bookings.searchAvailability(query);
        // Corrected: just use res directly, no type assertion needed in JS
        const slots = res.availabilities || [];
        
        console.log(`Found ${slots.length} slots.`);
        
        if (slots.length > 0) {
            console.log("--- First Slot Structure ---");
            console.log(JSON.stringify(slots[0], (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
        } else {
            console.log("No slots found.");
        }

    } catch(e) { 
        console.log("FAILED:", e.message);
        if (e.errors) console.log("Errors:", JSON.stringify(e.errors, null, 2));
    }
}

inspectAvailability();
