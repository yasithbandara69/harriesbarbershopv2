
const { SquareClient, SquareEnvironment } = require("square");
require('dotenv').config({ path: '.env.local' });

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function findHarry() {
  try {
    const response = await client.bookings.teamMemberProfiles.list({
        locationId: process.env.SQUARE_LOCATION_ID
    });
    
    const team = response.result.teamMemberProfiles || [];
    console.log("Team Members found:", team.length);
    team.forEach(t => {
        console.log(`Name: ${t.displayName}, ID: ${t.teamMemberId}`);
    });
    
    const harry = team.find(t => t.displayName.toLowerCase().includes('harry'));
    if (harry) {
        console.log("\nFOUND HARRY:", harry.teamMemberId);
    } else {
        console.log("\nHarry not found in list.");
    }
  } catch (error) {
    console.error(error);
  }
}

findHarry();
