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

const BOOKING_ID = "5i7f236roavlj6"; // From Screenshot URL

async function main() {
    try {
        const response = await squareClient.bookings.get(BOOKING_ID);
        const result = response.result || response.body || response;
        const booking = result.booking || result.data?.booking;

        if (booking) {
            console.log(`\n[RESULT] FOUND MATCHING BOOKING: ${booking.id}`);
            console.log(`Location: ${booking.locationId}`);
        } else {
            console.log("\n[RESULT] BOOKING NOT FOUND (Object missing)");
        }

    } catch (e) {
        if (e.errors && e.errors[0]?.code === 'NOT_FOUND') {
             console.log("\n[RESULT] BOOKING NOT FOUND (404 API Response)");
        } else {
             console.log(`\n[RESULT] ERROR: ${e.message}`);
        }
    }
}

main();
