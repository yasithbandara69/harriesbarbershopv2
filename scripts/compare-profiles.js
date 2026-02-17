require('dotenv').config({ path: '.env.local' });
const { SquareClient } = require("square");
// environment
const Environment = {
  Production: "https://connect.squareup.com",
  Sandbox: "https://connect.squareupsandbox.com"
};
const isProduction = process.env.SQUARE_ENVIRONMENT === "production";

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? Environment.Production : Environment.Sandbox,
});

async function inspectProfile() {
  // 1TA6... is the one currently linked in Supabase (has Subscription?)
  // 1AY5... is the one found by email search (has Booking?)
  const duplicateId = '1TA678QYF0PM7FF9MYAH5W7A64'; 
  const originalId = '1AY50HGN9N0Q5EHA6WM1YSMFFM'; 

  try {
    console.log(`Inspecting Duplicate Profile: ${duplicateId}`);
    try {
        const { result: customer1 } = await squareClient.customers.get(duplicateId);
        console.log('--- Duplicate Profile Metadata ---');
        console.log(`ID: ${customer1.customer.id}`);
        console.log(`Email: ${customer1.customer.emailAddress}`);
        console.log(`Phone: ${customer1.customer.phoneNumber}`);
        console.log(`Created At: ${customer1.customer.createdAt}`);
        // console.log(`Cards: ${customer1.customer.cards ? customer1.customer.cards.length : 0}`);
        console.log(`Profile Data:`, JSON.stringify(customer1.customer, null, 2));
    } catch (e) { console.log("Duplicate lookup failed:", e.message); }
    
    console.log(`\nInspecting Original Profile: ${originalId}`);
    try {
        const { result: customer2 } = await squareClient.customers.get(originalId);
        console.log('--- Original Profile Metadata ---');
        console.log(`ID: ${customer2.customer.id}`);
        console.log(`Email: ${customer2.customer.emailAddress}`);
        console.log(`Phone: ${customer2.customer.phoneNumber}`);
        console.log(`Created At: ${customer2.customer.createdAt}`);
        // console.log(`Cards: ${customer2.customer.cards ? customer2.customer.cards.length : 0}`);
        console.log(`Profile Data:`, JSON.stringify(customer2.customer, null, 2));
    } catch (e) { console.log("Original lookup failed:", e.message); }

  } catch (error) {
    console.error('Error:', error);
  }
}

inspectProfile();
