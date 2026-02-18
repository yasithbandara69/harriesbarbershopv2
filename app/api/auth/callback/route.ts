import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
      // Construct absolute URL for redirect, handling base and path
      const redirectUrl = new URL(next, baseUrl);
      redirectUrl.searchParams.set('verified', 'true');
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=AuthCodeError`);
}
