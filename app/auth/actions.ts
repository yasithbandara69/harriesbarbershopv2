'use server';

import { createClient } from "@/utils/supabase/server";
import { squareClient, locationId } from "@/lib/square";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const identifier = formData.get('email') as string; // We'll assume the input name matches the field, but logic handles both
  const password = formData.get('password') as string;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  // Simple check: if not email, assume phone. Or use regex for phone.
  // Supabase phone requires format. If user typed valid phone, pass it.
  
  let credentials: any = { password };
  if (isEmail) {
      credentials.email = identifier;
  } else {
      credentials.phone = identifier;
  }

  const { error, data: { user } } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { error: error.message };
  }

  // Check role and redirect
  const role = user?.user_metadata?.role;
  
  if (role === 'admin') {
      redirect('/admin/dashboard');
  }

  // If we are here, we are logged in.
  // We return success so the client can decide where to go (e.g., if there is a planId)
  // Or we can default redirect here.
  // To allow client-side handling for planId, we should NOT redirect here for standard users if we want client to handle it.
  // However, Server Actions that redirect will interrupt client code execution.
  // A pattern is to return a URL to redirect to, or just return success.
  // But standard login should definitely redirect.
  // Let's modify the client to *not* use this action's redirect if possible? No, we can't prevent `redirect()` from throwing.
  // CHANGE: Return success status, let client handle valid redirect.
  // If we must handle security (admin), we can redirect.
  // For users, we return so client can do `router.push(destination)`.
  
  return { success: true };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get('email') as string).toLowerCase().trim();
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phone = formData.get('phone') as string;
  const planId = formData.get('planId') as string | null;

  // 1. Create Square Customer
  let squareCustomerId: string | undefined;
  try {
      // Search first
      const searchRes = await squareClient.customers.search({
          query: {
              filter: {
                  emailAddress: {
                      exact: email
                  }
              }
          }
      });

      // Robust response handling for different SDK versions
      const customers = searchRes.customers || searchRes.result?.customers || searchRes.body?.customers || [];

      if (customers.length > 0) {
          // Use existing customer
          squareCustomerId = customers[0].id;
      } else {
          // Create new customer
          const createRes = await squareClient.customers.create({
              givenName: firstName,
              familyName: lastName,
              emailAddress: email,
              phoneNumber: phone,
              idempotencyKey: randomUUID()
          });
          const customer = createRes.customer || createRes.result?.customer || createRes.body?.customer;
          squareCustomerId = customer?.id;
      }
  } catch (error) {
      console.error("Square customer creation/search failed:", error);
      return { error: "Failed to initialize customer record. Please try again." };
  }

  if (!squareCustomerId) {
       return { error: "Failed to resolve customer record." };
  }

  // 2. Create Supabase User
  // Force logout to clear any stale session/cookies from previous users
  await supabase.auth.signOut();

  const nextUrl = planId ? `/api/checkout/subscription?planId=${planId}` : '/dashboard';
  const emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=${encodeURIComponent(nextUrl)}`;

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        square_customer_id: squareCustomerId,
        role: 'user', // Default role
      },
      emailRedirectTo: emailRedirectTo
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.session) {
      // Immediate session created (Email confirmation disabled or implicit)
      return { success: true };
  } else {
      // Email confirmation required
      return { message: "Account created! Please check your email to confirm before logging in." };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
