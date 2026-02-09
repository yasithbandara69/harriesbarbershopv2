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
    let planId = subAny.planId || subAny.plan_id;
    let foundPlan = null;
    
    const allPlans = SUBSCRIPTION_DATA.flatMap(cat => cat.plans);

    if (planId) {
        foundPlan = allPlans.find(p => p.squarePlanId === activeSub.planId);
    } 

    // Fallback: Check order_template_id if planId is missing or not found
    if (!foundPlan && subAny.orderTemplateId) {
         foundPlan = allPlans.find(p => p.squarePlanVariationId === subAny.orderTemplateId);
         if (foundPlan) {
             planId = foundPlan.squarePlanId; // Found it!
         }
    }
    
    // Last Resort Fallback: If still unknown but active, default to Gold (2 credits)
    // This handles the case where Plan ID is null but subscription is valid.
    let credits = 2; 
    if (foundPlan) {
        credits = foundPlan.credits;
    } else {
        console.warn(`Active subscription found but plan unknown. ID: ${activeSub.id}. Defaulting to 2 credits.`);
        // We might want to store 'UNKNOWN_PLAN' or similar
        if (!planId) planId = 'unknown-plan-fallback';
    }

    // 4. Update Database
    const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: user.id,
            square_subscription_id: activeSub.id,
            plan_id: planId,
            status: activeSub.status,
            credits: credits,
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
