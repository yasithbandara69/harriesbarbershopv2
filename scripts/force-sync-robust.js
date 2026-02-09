const { createClient } = require('@supabase/supabase-js');
const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Manual Env Parser
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/"/g, ''); // Remove quotes if any
        if (key && value) {
            envVars[key] = value;
        }
    }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const SQUARE_TOKEN = envVars.SQUARE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY || !SQUARE_TOKEN) {
    console.error("Missing Keys! Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SQUARE_ACCESS_TOKEN");
    console.log("Found Keys:", Object.keys(envVars));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const squareClient = new SquareClient({
    token: SQUARE_TOKEN,
    environment: SquareEnvironment.Production,
});

const EMAIL = 'yasithbandara.yb@gmail.com';

async function forceSync() {
    console.log(`--- ROBUST FORCE SYNC for ${EMAIL} ---`);
    
    // 1. Get User
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) { console.error("User List Error:", userError); return; }
    
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
        
        const result = response.result || response.body; 
        const subs = result.subscriptions || [];
        const activeSub = subs.find(s => s.status === 'ACTIVE');

        if (!activeSub) {
             console.error("No active subscription found in Square.");
             return;
        }

        console.log(`Found Active Sub: ${activeSub.id}`);
        const correctPlanId = activeSub.planVariationId || activeSub.plan_variation_id || activeSub.planId;
        console.log(`Using Plan ID: ${correctPlanId}`);

        // 4. Force Update DB
        const { error: upsertError } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: user.id,
                square_subscription_id: activeSub.id,
                plan_id: correctPlanId, 
                status: activeSub.status,
                credits: 2, 
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
