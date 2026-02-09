const { SquareClient, SquareEnvironment } = require('square');
const { createClient } = require('@supabase/supabase-js');
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

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production, 
});

const SUB_ID = '83278187-2e78-40e3-86b8-7bfb5628198d';
const PLAN_ID = 'LW5ZSQKJQ2TQ6GH3ZDRU'; // Test Plan (Gold Membership Testing)
const TEST_PLAN_CREDITS = 2; // Gold has 2 credits

async function syncSubscription() {
    console.log(`Syncing Subscription: ${SUB_ID}...`);
    
    try {
        // 1. Fetch Subscription from Square
        const subRes = await squareClient.subscriptions.retrieve({ subscriptionId: SUB_ID });
        const sub = subRes.result?.subscription || subRes.body?.subscription || subRes.subscription;
        
        if (!sub) { throw new Error("Subscription not found in Square"); }
        console.log("Found Subscription:", sub.id);
        
        const customerId = sub.customerId;
        
        // 2. Fetch Customer Email to Match User
        const custRes = await squareClient.customers.retrieve({ customerId });
        const customer = custRes.result?.customer || custRes.body?.customer || custRes.customer;
        
        if (!customer || !customer.emailAddress) { throw new Error("Customer Email not found"); }
        const email = customer.emailAddress;
        console.log(`Customer Email: ${email}`);
        
        // 3. Init Supabase Admin
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY missing. Cannot search users.");
        }
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // 4. Find User (using admin listUsers is safer than query profiles if profiles logic is broken)
        // But let's try querying profiles first as it is easier.
        // Actually, we can just query the 'profiles' table directly with service role.
        // But 'profiles' might not have email? The schema usually relies on auth.users for email.
        // Let's check if we can query auth.users via admin.
        
        // Alternative: Query profiles by email IF it exists there.
        // If not, we rely on the fact that we might have to use listUsers()
        
        // Note: The dashboard page shows user.email.
        // Assuming profiles is linked to auth.users.
        // Let's try searching for the user in `profiles` by assuming there is an email column or we have to use listUsers.
        
        // Let's use listUsers() to be safe.
        // Note: listUsers() is not available in @supabase/supabase-js v2 client directly without admin auth?
        // Actually `supabase.auth.admin.listUsers()`
        
        // Wait, current @supabase/supabase-js version in package.json is ^2.93.3.
        
        // We can search for user by email using listUsers()
        /*
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
            filters: { email: email } // this filter syntax might be hypothetical
        });
        */
        
        // Actually, easiest way is just to assume we can select from `profiles` if we can't get auth.
        // But usually profiles doesn't have email.
        // Let's try to query `profiles` table first? No.
        
        // Let's try `supabase.from('profiles').select('*')`... wait, how do we match provided email?
        // We can't unless we have an email column in profiles.
        
        // Let's use `supabase.auth.admin.listUsers()` if possible.
        // Or `supabase.auth.admin.getUserByEmail(email)` (older v1 syntax)
        
        // V2 Syntax:
        // supabase.auth.admin.listUsers() doesn't support email filtering directly in all versions.
        
        console.log("Searching for user by email...");
        // This is inefficient but works for small number of users
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) throw userError;
        
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            console.error("User not found in Supabase Auth!");
            return;
        }
        
        console.log(`Found User ID: ${user.id}`);
        
        // 5. Update Profile with Square Customer ID
        console.log("Updating Profile Square Customer ID...");
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ square_customer_id: customerId })
            .eq('id', user.id);
            
        if (profileError) console.error("Profile update error:", profileError);
        else console.log("Profile updated.");
        
        // 6. Insert Subscription
        console.log("Inserting Subscription...");
        const { error: subError } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: user.id,
                square_subscription_id: sub.id,
                plan_id: PLAN_ID,
                status: sub.status || 'ACTIVE',
                credits: TEST_PLAN_CREDITS,
                current_period_start: sub.startDate,
                current_period_end: sub.chargedThroughDate,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            
        if (subError) {
            throw subError;
        }
        
        console.log("SUCCESS: Subscription Synced!");

    } catch (e) {
        console.error("Error syncing:", e);
    }
}

syncSubscription();
