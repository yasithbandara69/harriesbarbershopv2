
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
  
  
  // Find the plan object
  for (const category of SUBSCRIPTION_DATA) {
      const found = category.plans.find(p => p.squarePlanId === planId);
      if (found && found.itemVariationId) {
          itemVariationId = found.itemVariationId;
          break;
      }
  }

  // Construct Line Items
  const lineItems: any[] = [];
  if (itemVariationId) {
      // If we have a specific item mapped, use it. Pass quantity 1.
      lineItems.push({
          catalogObjectId: itemVariationId,
          quantity: "1"
      });
  } else {
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
    // 1. Check if the plan is free (100% discount or $0 price)
    const planResponse = await squareClient.catalog.object.get({ objectId: planId });
    // Safe access for different SDK versions
    const planResult = (planResponse as any).result || (planResponse as any).body || planResponse;
    const planObject = planResult.object;
    
    const priceMoney = planObject?.subscriptionPlanData?.phases?.[0]?.recurringPriceMoney;
    const priceAmount = priceMoney?.amount ? Number(priceMoney.amount) : 0; // default to 0 if undefined? No, usually typical plans have price. Assuming safe access.

    // If price is 0, Bypass Checkout and Create Subscription Directly
    if (priceAmount === 0) {
        console.log(`Plan ${planId} is free. Creating subscription directly.`);
        
        const { subscription } = await squareClient.subscriptions.create({
            idempotencyKey: randomUUID(),
            locationId: locationId!,
            planId: planId,
            customerId: squareCustomerId,
        } as any) as any;

        // We can rely on the webhook to update Supabase, or do it here for immediate feedback.
        // Doing it here ensures the user sees credits immediately on redirect.
        
        // Upsert into user_subscriptions (Mirroring webhook logic for speed)
        // Find plan configured credits
        let credits = 0;
        const allPlans = SUBSCRIPTION_DATA.flatMap(cat => cat.plans);
        const planData = allPlans.find(p => p.squarePlanId === planId);
        if (planData) credits = planData.credits;

        await supabase.from('user_subscriptions').upsert({
            user_id: user.id,
            square_subscription_id: subscription.id,
            plan_id: planId,
            status: subscription.status || 'ACTIVE',
            credits: credits,
            current_period_start: subscription.startDate,
            current_period_end: subscription.chargedThroughDate,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin}/dashboard?subscriptionSuccess=true`);
    }

    // 2. If not free, generate Payment Link
    const { paymentLink } = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: locationId!,
        customerId: squareCustomerId,
        lineItems: lineItems
      },
      checkoutOptions: {
        subscriptionPlanId: planId,
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
    });

    if (paymentLink?.url) {
       return NextResponse.redirect(paymentLink.url);
    } else {
       return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Square Checkout Error:", error);
    // Parse Square error if possible
    return NextResponse.json({ error: error.message || "An error occurred creating the checkout link" }, { status: 500 });
  }
}
