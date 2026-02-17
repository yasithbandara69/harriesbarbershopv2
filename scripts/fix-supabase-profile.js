require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixProfile() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Use service role key if possible, but anon key + service role might be needed if RLS blocks.
  // Actually, anon key might fail if RLS is on and user is not auth-ed.
  // Need SERVICE_ROLE_KEY if available? Usually in .env.local as SUPABASE_SERVICE_ROLE_KEY?
  // Let's check env vars.
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    return;
  }

  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

  const email = 'jonathanweerasekara@gmail.com';
  const correctId = '1AY50HGN9N0Q5EHA6WM1YSMFFM'; // The valid one
  const wrongId = '1TA678QYF0PM7FF9MYAH5W7A64'; // The invalid one

  try {
    // 1. Get user ID from email (need auth admin or just query profiles if email is there?)
    // profiles table usually has id, but no email column?
    // User metadata has email.
    // Auth admin api is needed to find user by email.
    
    // Instead, let's query profiles where square_customer_id is the WRONG one.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('square_customer_id', wrongId);
      
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found with the WRONG ID.');
      // Maybe check by email?
      // Can't check email easily without auth admin.
      return;
    }

    console.log(`Found ${profiles.length} profiles with wrong ID.`);
    for (const profile of profiles) {
      console.log(`Updating profile ${profile.id}...`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ square_customer_id: correctId })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Failed to update profile ${profile.id}:`, updateError);
      } else {
        console.log(`Successfully updated profile ${profile.id} to use ${correctId}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixProfile();
