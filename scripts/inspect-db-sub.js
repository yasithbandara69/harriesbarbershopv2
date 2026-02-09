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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key.");
    console.log("URL:", supabaseUrl);
    console.log("Key Exists:", !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserSub() {
    console.log("--- Checking User Subscription for email: yasithbandara.yb@gmail.com ---");
    // Get User ID
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'yasithbandara.yb@gmail.com');
    
    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log(`User ID: ${user.id}`);

    const { data: sub, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error("Error fetching subscription:", error);
    } else {
        console.log("Subscription Record:");
        console.log(JSON.stringify(sub, null, 2));
    }
}

checkUserSub();
