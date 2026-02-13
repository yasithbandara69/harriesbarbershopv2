const { createClient } = require('@supabase/supabase-js');
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional, might not be needed for public schema introspection if allowed

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function main() {
    console.log("Inspecting 'profiles' table...");
    
    // We can't easily "describe" table via JS client, but we can try to select a single row
    // and see what columns come back, or if it errors.
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching profiles:", error);
    } else {
        console.log("Success! Columns found:");
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log("Table exists but is empty. Cannot infer columns from data.");
        }
    }
}

main();
