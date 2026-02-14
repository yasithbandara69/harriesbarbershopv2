import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { squareClient } from '@/lib/square';
import { listCustomerBookings } from '@/app/actions';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', '/api/fix-account');
    return NextResponse.redirect(loginUrl);
  }

  const currentId = user.user_metadata?.square_customer_id;
  const email = user.email;

  if (!email) {
      return NextResponse.json({ error: "User email not found." }, { status: 400 });
  }

  // 1. Search Square for ANY profiles for this email
  let customers: any[] = [];
  try {
      const searchRes = await squareClient.customers.search({
          query: { filter: { emailAddress: { exact: email } } }
      });
      // Handle response robustly
      customers = searchRes.customers || (searchRes as any).result?.customers || (searchRes as any).body?.customers || [];
  } catch (e) {
      console.error("Square search failed:", e);
      return NextResponse.json({ error: "Square search failed." }, { status: 500 });
  }

  if (customers.length <= 1) {
      // Only one profile exists (likely the current one).
      // If currentId is missing, set to this one.
      const found = customers[0];
      if (found && found.id !== currentId) {
           await supabase.auth.updateUser({
               data: { square_customer_id: found.id }
           });
           return NextResponse.redirect(new URL('/dashboard?msg=AccountFixed', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard?msg=NoOtherProfilesFound', request.url));
  }

  // 2. Check current profile bookings
  let currentBookings: any[] = [];
  if (currentId) {
      try {
          currentBookings = await listCustomerBookings(currentId);
      } catch (e) {}
  }

  if (currentBookings.length > 0) {
      // Current profile is fine (has data).
      return NextResponse.redirect(new URL('/dashboard?msg=AccountOK', request.url));
  }

  // 3. Current profile has 0 bookings. Find another one with bookings.
  let betterId: string | undefined;
  
  for (const cust of customers) {
      if (cust.id === currentId) continue;
      
      try {
          const bookings = await listCustomerBookings(cust.id);
          if (bookings.length > 0) {
              betterId = cust.id;
              break; // Found one!
          }
      } catch (e) {}
  }

  // If no bookings found for anyone, pick the oldest one? Or just stick with current?
  // Let's stick with current if none have bookings unless currentId is NULL.
  // Actually, if currentId is NULL, we pick ANY one.
  if (!currentId && !betterId && customers.length > 0) {
      betterId = customers[0].id;
  }

  if (betterId) {
      console.log(`[Self-Healing] Switching user ${user.id} from ${currentId} to ${betterId} (found bookings/profile)`);
      const { error } = await supabase.auth.updateUser({
           data: { square_customer_id: betterId }
      });
      
      if (error) {
          return NextResponse.json({ error: `Update failed: ${error.message}` }, { status: 500 });
      }

      return NextResponse.redirect(new URL('/dashboard?msg=AccountFixed', request.url));
  }

  return NextResponse.redirect(new URL('/dashboard?msg=NoBetterProfileFound', request.url));
}
