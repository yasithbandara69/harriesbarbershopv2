'use server';

import { createClient } from "@/utils/supabase/server";
import { squareClient } from "@/lib/square";
import { SUBSCRIPTION_DATA } from "@/app/components/subscription-data";
import { revalidatePath } from "next/cache";

export async function syncSubscriptionStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. Get Square Customer ID from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('square_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.square_customer_id) {
    return { error: "No Square Customer ID linked to account." };
  }

  try {
    // 2. Fetch all subscriptions for the customer
    const response = await squareClient.subscriptions.search({
      query: {
        filter: {
          customerIds: [profile.square_customer_id]
        }
      }
    });

    const result = response as any;
    let subscriptions = result.subscriptions || result.body?.subscriptions || [];
    
    // Filter for ACTIVE status in memory 
    const activeSub = subscriptions.find((s: any) => s.status === 'ACTIVE');

    if (!activeSub) {
        return { message: "No active subscriptions found." };
    }

    // 3. Identify Plan ID or Fallback
    const subAny = activeSub as any;
    const subAny = activeSub as any;
    // Check all possible casing variations from Square SDK/API
    let planId = subAny.planId || subAny.plan_id || subAny.planVariationId || subAny.plan_variation_id; 
    let foundPlan = null;
    
    const allPlans = SUBSCRIPTION_DATA.flatMap(cat => cat.plans);

    if (planId) {
        // partial match check? No, IDs are exact.
        foundPlan = allPlans.find(p => p.squarePlanId === planId || p.squarePlanVariationId === planId);
    } 

    // Fallback: Check order_template_id if planId is missing or not found
    if (!foundPlan && subAny.orderTemplateId) {
         foundPlan = allPlans.find(p => p.squarePlanVariationId === subAny.orderTemplateId);
    }
    
    if (foundPlan) {
        planId = foundPlan.squarePlanId; // Normalize to our Plan ID
    } else {
        // If we still can't find it, we can't safely assign credits.
        const subDebug = JSON.stringify(subAny, (key, value) => typeof value === 'bigint' ? value.toString() : value);
        console.error(`Could not identify plan for subscription ${activeSub.id}. Data: ${subDebug}`);
        return { error: "Subscription active but Plan not recognized. Contact support." };
    }

    // 4. Update Database
    const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: user.id,
            square_subscription_id: activeSub.id,
            plan_id: planId,
            status: activeSub.status,
            credits: foundPlan.credits,
            current_period_start: activeSub.startDate,
            current_period_end: activeSub.chargedThroughDate,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); 
        
    if (error) {
        console.error("Supabase error:", error);
        return { error: "Failed to update database record." };
    }

    revalidatePath('/dashboard');
    return { success: true, message: "Subscription synced successfully!" };

  } catch (error: any) {
    console.error("Sync error:", error);
    return { error: "Failed to sync with Square." };
  }
}
