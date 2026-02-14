const { SquareClient } = require('square');
const util = require('util');
const fs = require('fs');
const path = require('path');

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
    const targetId = "9VVR56HRY3864SBCW4SRKTVN";
    
    console.log(`=== INSPECTING CUSTOMER: ${targetId} ===`);
    
    const customersApi = squareClient.customers;
    console.log("customersApi Type:", typeof customersApi);
    if (customersApi) {
        console.log("customersApi Prototype Properties:", Object.getOwnPropertyNames(Object.getPrototypeOf(customersApi)));
        console.log("customersApi Properties:", Object.getOwnPropertyNames(customersApi));
    }

    try {
        // Try 'retrieve'
        if (customersApi.retrieve) {
            console.log("Calling retrieve()...");
            const response = await customersApi.retrieve(targetId);
            const customer = response.result?.customer || response.body?.customer || response.customer;
            console.log("Customer Found via retrieve:", customer ? customer.id : "No");
             if (customer) {
                console.log(`- Email: ${customer.emailAddress}`);
                console.log(`- Phone: ${customer.phoneNumber}`);
            }
            return;
        }

         // Try 'retrieveCustomer'
        if (customersApi.retrieveCustomer) {
            console.log("Calling retrieveCustomer()...");
            const response = await customersApi.retrieveCustomer(targetId);
            const customer = response.result?.customer || response.body?.customer || response.customer;
            console.log("Customer Found via retrieveCustomer:", customer ? customer.id : "No");
            if (customer) {
                console.log(`- Email: ${customer.emailAddress}`);
                console.log(`- Phone: ${customer.phoneNumber}`);
            }
            return;
        }
        
    } catch (e) {
        console.error("Error retrieving customer:", e.message);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    }
}

main();
