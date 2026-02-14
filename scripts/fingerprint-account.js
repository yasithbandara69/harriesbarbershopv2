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

async function main() {
    console.log("=== ACCOUNT FINGERPRINT ===");
    console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);

    try {
        console.log("\n--- TEAM MEMBERS CHECK ---");
        // 3. TEAM MEMBERS
        const teamRes = await squareClient.teamMembers.search({
            query: { filter: { status: "ACTIVE" } }
        });
        
        // Debug keys to be sure
        const teamResult = teamRes.result || teamRes.body || teamRes;
        // console.log("Team Result keys:", Object.keys(teamResult));

        let team = [];
        if (teamResult.teamMembers) {
            team = teamResult.teamMembers;
        } else if (teamResult.data) {
             // Handle if data is array or object with numeric keys
             team = Array.isArray(teamResult.data) ? teamResult.data : Object.values(teamResult.data);
        }

        console.log(`Found ${team.length} Active Team Members:`);
        team.forEach(t => {
            console.log(`> ${t.givenName} ${t.familyName} (ID: ${t.id})`);
        });

    } catch (e) {
        console.error("Team Check Failed:", e);
    }
}

main();
