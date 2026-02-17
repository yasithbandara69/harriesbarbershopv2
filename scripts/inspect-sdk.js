require('dotenv').config({ path: '.env.local' });
const { SquareClient } = require("square");

// environment
const Environment = {
  Production: "https://connect.squareup.com",
  Sandbox: "https://connect.squareupsandbox.com"
};
const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

console.log('--- Inspecting Square Client Structure ---');
try {
    const client = new SquareClient({
        token: process.env.SQUARE_ACCESS_TOKEN,
        environment: isProduction ? Environment.Production : Environment.Sandbox,
    });
    
    console.log('Client keys:', Object.keys(client));
    if (client.customers) {
        console.log('client.customers keys:', Object.keys(client.customers));
        console.log('client.customers prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.customers)));
    } else if (client.customersApi) {
        console.log('client.customersApi keys:', Object.keys(client.customersApi));
        console.log('client.customersApi prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.customersApi)));
    } else {
        console.log('No customers or customersApi property found on client.');
    }

} catch (e) {
    console.error('Error inspecting client:', e);
}
