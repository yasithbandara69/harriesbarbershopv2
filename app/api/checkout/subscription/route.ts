
import { createClient } from "@/utils/supabase/server";
import { squareClient, locationId } from "@/lib/square";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SUBSCRIPTION_DATA } from "@/app/components/subscription-data"; // Flatten keys to search

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const planId = searchParams.get('planId');

  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // If called via API fetch, return 401. If via browser navigation, we might want to redirect to login.
    // For now, assuming this is called via `router.push('/api/...')` or `window.location.href`,
    // keeping it simple with JSON error or redirect instructions? 
    // Actually, let's redirect to login if not authenticated, preserving the planId.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('planId', planId);
    return NextResponse.redirect(loginUrl);
  }

  // Get Square Customer ID from metadata
  const squareCustomerId = user.user_metadata?.square_customer_id;

  if (!squareCustomerId) {
     return NextResponse.json({ error: "No Square Customer ID found for user." }, { status: 400 });
  }

  // Lookup the plan in our internal data to find the corresponding Item Variation ID
  let itemVariationId: string | undefined;
  
  console.log(`[Checkout] Processing Plan ID: ${planId}`);
  
  // Find the plan object
  for (const category of SUBSCRIPTION_DATA) {
      const found = category.plans.find(p => p.squarePlanId === planId);
      if (found && found.itemVariationId) {
          itemVariationId = found.itemVariationId;
          break;
      }
  }
  
  console.log(`[Checkout] Mapped itemVariationId: ${itemVariationId}`);

  // Construct Line Items
  const lineItems: any[] = [];
  if (itemVariationId) {
      // If we have a specific item mapped, use it. Pass quantity 1.
      lineItems.push({
          catalogObjectId: itemVariationId,
          quantity: "1"
      });
  } else {
      console.log(`[Checkout] No itemVariationId found. Using fallback.`);
      // Fallback to dummy item if no mapping found (should not happen for configured plans)
      lineItems.push({
        name: "Subscription Enrollment",
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(0),
          currency: "AUD", 
        }
      });
  }

  try {
    // Generate Payment Link
    console.log(`[Checkout] Generating Payment Link for user ${user.email}`);
    const body = {
      idempotencyKey: randomUUID(),
      order: {
        locationId: locationId!,
        customerId: squareCustomerId,
        lineItems: lineItems
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin}/dashboard?subscriptionSuccess=true`,
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: user.email,
        buyerPhoneNumber: user.user_metadata?.phone,
        buyerAddress: {
           firstName: user.user_metadata?.first_name,
           lastName: user.user_metadata?.last_name,
        }
      }
    };
    
    // console.log("[Checkout] Payment Link Req:", JSON.stringify(body, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

    const { paymentLink } = await squareClient.checkout.paymentLinks.create(body);

    if (paymentLink?.url) {
       return NextResponse.redirect(paymentLink.url);
    } else {
       return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Square Checkout Error:", error);
    if (error.result) console.error("Result:", error.result);
    if (error.errors) console.error("Errors:", JSON.stringify(error.errors));
    
    return NextResponse.json(
        { 
            error: error.message || "An error occurred creating the checkout link",
            details: error.errors || error.result 
        }, 
        { status: 500 }
    );
  }
}
