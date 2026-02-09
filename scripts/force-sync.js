const { createClient } = require('@supabase/supabase-js');
const { SquareClient, SquareEnvironment } = require('square');
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

// Fallback to manual key if env load fails (USER - DO NOT COMMIT THIS FILE IF YOU ADD KEYS)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SQUARE_TOKEN = process.env.SQUARE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY || !SQUARE_TOKEN) {
    console.error("Missing Keys! Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SQUARE_ACCESS_TOKEN");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const squareClient = new SquareClient({
    token: SQUARE_TOKEN,
    environment: SquareEnvironment.Production,
});

const EMAIL = 'yasithbandara.yb@gmail.com';
const EXPECTED_PLAN_VARIATION_ID = 'NBFQJPSPRQMVTBHPC3LX6QCD'; // Gold Haircut + Beard

async function forceSync() {
    console.log(`--- FORCE SYNC for ${EMAIL} ---`);
    
    // 1. Get User
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) { console.error(userError); return; }
    
    const user = users.find(u => u.email === EMAIL);
    if (!user) { console.error("User not found"); return; }
    console.log(`Found User ID: ${user.id}`);

    // 2. Get Square Customer ID
    const { data: profile } = await supabase.from('profiles').select('square_customer_id').eq('id', user.id).single();
    if (!profile?.square_customer_id) { console.error("No Square ID"); return; }
    console.log(`Square ID: ${profile.square_customer_id}`);

    // 3. Fetch Subscription from Square
    console.log("Fetching subscriptions from Square...");
    try {
        const response = await squareClient.subscriptions.search({
            query: { filter: { customerIds: [profile.square_customer_id] } }
        });
        
        const result = response.result || response.body; // Handle varied SDK structure
        const subs = result.subscriptions || [];
        const activeSub = subs.find(s => s.status === 'ACTIVE');

        if (!activeSub) {
             console.error("No active subscription found in Square.");
             return;
        }

        console.log(`Found Active Sub: ${activeSub.id}`);
        // Log IDs to be sure
        console.log(`Plan ID: ${activeSub.planId}`);
        console.log(`Variation ID: ${activeSub.planVariationId}`); // SDK might camelCase it

        // 4. Force Update DB
        const correctPlanId = activeSub.planVariationId || activeSub.plan_variation_id || activeSub.planId;
        
        console.log(`Updating DB with Plan ID: ${correctPlanId}`);

        const { error: upsertError } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: user.id,
                square_subscription_id: activeSub.id,
                plan_id: correctPlanId, // THIS IS THE KEY FIX
                status: activeSub.status,
                credits: 2, // Hardcode 2 for safety for this specific user/plan
                current_period_start: activeSub.startDate,
                current_period_end: activeSub.chargedThroughDate,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (upsertError) {
            console.error("DB Update Failed:", upsertError);
        } else {
            console.log("SUCCESS! Database updated manually.");
        }

    } catch (e) {
        console.error("Square API Error:", e);
    }
}

forceSync();
