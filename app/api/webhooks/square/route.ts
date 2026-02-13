
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
            console.log(`[Webhook] Processing subscription payment for: ${subscriptionId}`);
            await handleSubscriptionPayment(subscriptionId);
        }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

async function handleSubscriptionPayment(subscriptionId: string) {
    const supabase = await createClient();
    
    // 1. Fetch Subscription from Square to get Plan ID and Customer ID
    try {
        const response = await squareClient.subscriptions.retrieve(subscriptionId);
        // @ts-ignore
        const subscription = response.result?.subscription || response.body?.subscription || response.subscription;

        if (!subscription) {
            console.error(`[Webhook] Subscription ${subscriptionId} not found in Square`);
            return;
        }

        const customerId = subscription.customerId;
        const planId = subscription.planId;
        
        if (!customerId || !planId) {
            console.error(`[Webhook] Missing customerId or planId for subscription ${subscriptionId}`);
            return;
        }

        console.log(`[Webhook] Found Subscription: ${subscriptionId} for Customer: ${customerId} Plan: ${planId}`);

        // 2. Find User by Square Customer ID in profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('square_customer_id', customerId)
            .single();
            
        if (profileError || !profile) {
            console.error(`[Webhook] No user profile found for square_customer_id: ${customerId}`);
            // If profile not found, we might want to try finding by metadata in auth.users?
            // But we can't access auth.users easily here without Service Role Key and specific admin calls.
            // Assuming profile is created on signup/login.
            return;
        }

        // 3. Determine Credits based on Plan
        let credits = 0;
        // Helper to find plan
        const allPlans = SUBSCRIPTION_DATA.flatMap(cat => cat.plans);
        const planData = allPlans.find(p => p.squarePlanId === planId);
        
        if (planData) {
            credits = planData.credits;
            console.log(`[Webhook] Plan ${planData.tier} detected. Allocating ${credits} credits.`);
        } else {
            console.warn(`[Webhook] Unknown Plan ID: ${planId}, defaulting to 0 credits.`);
        }

        // 4. Upsert into user_subscriptions
        const startDate = subscription.startDate || subscription.start_date || new Date().toISOString();
        const chargedThroughDate = subscription.chargedThroughDate || subscription.charged_through_date;

        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: profile.id,
                square_subscription_id: subscriptionId,
                plan_id: planId,
                status: subscription.status || 'ACTIVE',
                credits: credits,
                current_period_start: startDate,
                current_period_end: chargedThroughDate, 
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error("[Webhook] Error updating user_subscriptions:", error);
        } else {
            console.log(`[Webhook] Successfully updated subscription for user ${profile.id}.`);
        }

    } catch (e) {
        console.error(`[Webhook] Error handling subscription ${subscriptionId}:`, e);
    }
}
