const { SquareClient } = require("square");
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

const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com",
});

async function listCustomers() {
    console.log("Searching Customers...");
    try {
        const response = await client.customers.search({
            limit: 5n
        });
        
        const result = response.result || response;
        const customers = result.customers || [];
        
        console.log(`Found ${customers.length} customers.`);
        
        customers.forEach(c => {
            console.log(`ID: ${c.id} | Name: ${c.givenName} ${c.familyName} | Email: ${c.emailAddress}`);
        });

    } catch (e) {
        console.error(e);
        if (e.result) console.error(JSON.stringify(e.result, null, 2));
    }
}

listCustomers();
