const fs = require('fs');
const path = require('path');

// Load Env
try {
  const envConfig = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.warn("Could not load .env.local", e);
}

const TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SUB_ID = '83278187-2e78-40e3-86b8-7bfb5628198d';

async function fetchRaw() {
    console.log(`Fetching RAW Subscription: ${SUB_ID}...`);
    try {
        const res = await fetch(`https://connect.squareup.com/v2/subscriptions/${SUB_ID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            return;
        }

        const data = await res.json();
        console.log("--- RAW JSON RESPONSE ---");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

fetchRaw();
