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
    // 2. Reverse Lookup: Since Square sometimes omits planId in the response,
    // we iterate through our known plans and ask Square: "Does user have THIS plan?"
    const allPlans = SUBSCRIPTION_DATA.flatMap(cat => cat.plans);
    
    let foundSubscription: any = null;
    let foundPlanId: string | null = null;
    let foundCredits = 0;

    // parallel requests could be faster, but let's be sequential for safety/simplicity first
    // or Promise.all if we want speed. There are only ~4 plans.
    
    const searchPromises = allPlans.map(async (plan) => {
        try {
            const response = await squareClient.subscriptions.search({
                query: {
                    filter: {
                        customerIds: [profile.square_customer_id],
                        planIds: [plan.squarePlanId] // Search specifically for this plan
                    }
                }
            });
            
            const result = response as any;
            const subs = result.subscriptions || result.body?.subscriptions || [];
            const activeSub = subs.find((s: any) => s.status === 'ACTIVE');
            
            if (activeSub) {
                return { sub: activeSub, plan };
            }
        } catch (e) {
            console.error(`Error searching plan ${plan.squarePlanId}:`, e);
        }
        return null;
    });

    const results = await Promise.all(searchPromises);
    const match = results.find(r => r !== null);

    if (match) {
        foundSubscription = match.sub;
        foundPlanId = match.plan.squarePlanId;
        foundCredits = match.plan.credits;
    }

    if (!foundSubscription || !foundPlanId) {
        return { message: "No active subscriptions found for known plans." };
    }

    // 3. Update Database using the identified Plan ID
    const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: user.id,
            square_subscription_id: foundSubscription.id,
            plan_id: foundPlanId,
            status: foundSubscription.status,
            credits: foundCredits,
            current_period_start: foundSubscription.startDate,
            current_period_end: foundSubscription.chargedThroughDate,
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
