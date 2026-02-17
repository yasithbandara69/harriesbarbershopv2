import { createClient } from "@/utils/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const correctId = '1AY50HGN9N0Q5EHA6WM1YSMFFM';

    const { error } = await supabase
        .from('profiles')
        .update({ square_customer_id: correctId })
        .eq('id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also update metadata if possible (optional but good for consistency)
    // Supabase auth admin needed for that? User can update their own metadata usually.
    const { error: metaError } = await supabase.auth.updateUser({
        data: { square_customer_id: correctId }
    });

    if (metaError) {
         console.error("Meta update failed:", metaError);
    }

    return NextResponse.json({ 
        success: true, 
        message: `Profile updated to use Square ID: ${correctId}`,
        user_email: user.email
    });
}
