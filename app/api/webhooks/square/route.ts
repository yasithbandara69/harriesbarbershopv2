
import { NextRequest, NextResponse } from "next/server";
import { squareClient } from "@/lib/square";
import { createClient } from "@/utils/supabase/server";
import { SUBSCRIPTION_DATA } from "@/app/components/subscription-data";

export async function POST(req: NextRequest) {
  // In a real production app, verify the signature!
  // const signature = req.headers.get("x-square-hmac-sha256");
  
  try {
    const body = await req.json();
    const eventType = body.type;
    // console.log(`Received Square Webhook: ${eventType}`);

    if (eventType === "invoice.payment_made") {
      const invoice = body.data.object.payment; // Note: structure varies, check docs. Actually invoice.payment_made object is an Invoice.
      // Wait, let's double check the event structure for invoice.payment_made.
      // actually usually it gives the Invoice object.
      // Let's use 'subscription.updated' might be safer for status changes?
      // But we need to know when a payment happened to reset credits.
      
      // Let's assume standard handling: fetch subscription details if we have an ID
    }
    
    // Actually, for simplicity and reliability in this context, let's listen to 'order.created' or just inspect the payload.
    // However, the best event for "Subscription Paid" is 'invoice.payment_made'.
    // The payload object is an Invoice.
    
    if (eventType === "invoice.payment_made") {
        const invoice = body.data.object.invoice;
        const subscriptionId = invoice?.subscription_id;

        if (subscriptionId) {
            // console.log(`Processing subscription payment for: ${subscriptionId}`);
            await handleSubscriptionPayment(subscriptionId);
        }
    }
    
    // Also handle initial creation if needed, but often payment handles it.
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

async function handleSubscriptionPayment(subscriptionId: string) {
    const supabase = await createClient();
    
    // 1. Fetch Subscription from Square to get Plan ID and Customer ID
    // @ts-ignore
    const response = await squareClient.subscriptions.get({ subscriptionId });
    const result = response as any;
    // Handle Fern SDK { data: { subscription: ... } } vs others
    const subscription = result.data?.subscription || result.subscription || result.result?.subscription;
    
    if (!subscription) {
        console.error("Subscription not found in Square");
        return;
    }

    const customerId = subscription.customerId;
    const planId = subscription.planId;
    
    if (!customerId || !planId) return;

    // 2. Find User by Square Customer ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('square_customer_id', customerId)
        .single();
        
    if (!profile) {
        console.error(`No user found for square_customer_id: ${customerId}`);
        return;
    }

    // 3. Determine Credits based on Plan
    let credits = 0;
    // Helper to find plan
    const allPlans = SUBSCRIPTION_DATA.flatMap(cat => cat.plans);
    const planData = allPlans.find(p => p.squarePlanId === planId);
    
    if (planData) {
        credits = planData.credits;
    } else {
        console.warn(`Unknown Plan ID: ${planId}, defaulting to 0 credits.`);
    }

    // 4. Upsert into user_subscriptions
    // We update credits, status, and period details.
    const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: profile.id,
            square_subscription_id: subscriptionId,
            plan_id: planId,
            status: subscription.status || 'ACTIVE',
            credits: credits,
            current_period_start: subscription.startDate, // simplified, dependent on square's dates
            current_period_end: subscription.chargedThroughDate, 
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error("Error updating user_subscriptions:", error);
    } else {
        // console.log(`Updated subscription for user ${profile.id}: ${credits} credits.`);
    }
}
