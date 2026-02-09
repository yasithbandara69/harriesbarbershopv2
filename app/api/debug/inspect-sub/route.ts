
        import { createClient } from '@supabase/supabase-js';
        import { NextResponse } from 'next/server';

        export const dynamic = 'force-dynamic';

        export async function GET() {
            try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
                
                if (!supabaseKey) {
                    return NextResponse.json({ error: "Service Role Key missing on server" }, { status: 500 });
                }

                const supabase = createClient(supabaseUrl, supabaseKey);
                
                // Hardcoded email for debugging
                const EMAIL = 'yasithbandara.yb@gmail.com';
                
                const { data: users, error: userError } = await supabase.auth.admin.listUsers();
                const user = users?.users.find(u => u.email === EMAIL);

                if (!user) {
                     return NextResponse.json({ error: "User not found" });
                }

                const { data: sub, error: subError } = await supabase
                    .from('user_subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                return NextResponse.json({ 
                    user_id: user.id,
                    subscription: sub,
                    sub_error: subError
                });

            } catch (e: any) {
                return NextResponse.json({ error: e.message }, { status: 500 });
            }
        }
    
