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
      const redirectTo = process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?message=Email+confirmed`
        : `${origin}/login?message=Email+confirmed`;
      
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=AuthCodeError`);
}
