
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
  // Get Square Customer ID from metadata
  let squareCustomerId = user.user_metadata?.square_customer_id;

  // Verify if the customer actually exists in Square
  let customerIsValid = false;
  if (squareCustomerId) {
      try {
          // Check if the stored ID is an alias (merged) or valid
          const { customer } = await squareClient.customers.retrieve(squareCustomerId);
          if (customer) {
              customerIsValid = true;
              // SELF-HEALING: If the returned ID is different, it means the stored ID was merged.
              // We should update our database to use the new canonical ID.
              if (customer.id !== squareCustomerId) {
                  console.log(`[Checkout] User has merged/aliased Customer ID. Updating ${squareCustomerId} -> ${customer.id}`);
                  squareCustomerId = customer.id;
                  await supabase.auth.updateUser({
                      data: { square_customer_id: squareCustomerId }
                  });
              }
          }
      } catch (e: any) {
          console.warn(`[Checkout] Stored Square ID ${squareCustomerId} not found in Square. Creating new one.`);
          // If 404 or other error, assume invalid and recreate
          squareCustomerId = null; 
      }
  }

  if (!squareCustomerId) {
     console.log("[Checkout] No valid Square Customer ID. Creating new customer...");
     try {
         const { customer } = await squareClient.customers.create({
             givenName: user.user_metadata?.first_name || user.email?.split('@')[0],
             familyName: user.user_metadata?.last_name || "",
             emailAddress: user.email,
             phoneNumber: user.user_metadata?.phone,
             referenceId: user.id
         });
         
         if (customer?.id) {
             squareCustomerId = customer.id;
             // Update Supabase
             await supabase.auth.updateUser({
                 data: { square_customer_id: squareCustomerId }
             });
             console.log(`[Checkout] Created new Square Customer: ${squareCustomerId}`);
         }
     } catch (createError) {
         console.error("[Checkout] Failed to create Square customer:", createError);
         return NextResponse.json({ error: "Failed to create Square Customer account." }, { status: 500 });
     }
  }

  if (!squareCustomerId) {
     return NextResponse.json({ error: "No Square Customer ID found or created." }, { status: 500 });
  }

  // Lookup the plan in our internal data to find the corresponding Item Variation ID and Subscription Variation ID
  let itemVariationId: string | undefined;
  let subscriptionPlanVariationId: string | undefined;
  
  console.log(`[Checkout] Processing Plan ID: ${planId}`);
  
  // Find the plan object
  for (const category of SUBSCRIPTION_DATA) {
      const found = category.plans.find(p => p.squarePlanId === planId);
      if (found) {
          itemVariationId = found.itemVariationId;
          subscriptionPlanVariationId = found.squarePlanVariationId;
          break;
      }
  }
  console.log(`[Checkout] Mapped subscriptionPlanVariationId: ${subscriptionPlanVariationId}`);
  
  console.log(`[Checkout] Mapped itemVariationId: ${itemVariationId}`);

  // Construct Line Items
  const lineItems: any[] = [];
  if (itemVariationId) {
      // If we have a specific item mapped, use it. Pass quantity 1.
      // Fetch the REAL price from Square to ensure we charge what is configured in the Dashboard
      // This allows for dynamic pricing (e.g. $1 testing, discounts, updates) without redeploying.
      let priceMoneyOverride: { amount: bigint, currency: string } | undefined;

      if (subscriptionPlanVariationId) {
        try {
            console.log(`[Checkout] Fetching price for Subscription Variation: ${subscriptionPlanVariationId}`);
            const response = await squareClient.catalog.object.get({
                objectId: subscriptionPlanVariationId
            });
            
            // Handle different SDK response structures
            // @ts-ignore
            const objectData = response.result?.object || response.body?.object || response.object;

            if (objectData?.subscriptionPlanVariationData?.phases?.[0]?.recurringPriceMoney) {
                const money = objectData.subscriptionPlanVariationData.phases[0].recurringPriceMoney;
                if (money.amount !== undefined && money.currency !== undefined) {
                    priceMoneyOverride = {
                        amount: money.amount,
                        currency: money.currency
                    };
                    console.log(`[Checkout] Fetched fixed price from Square: ${priceMoneyOverride.amount} ${priceMoneyOverride.currency}`);
                }
            } else {
                console.log("[Checkout] No fixed price in plan (likely 'Varies by Item'). Using Item Catalog Price.");
            }
        } catch (e) {
            console.error("[Checkout] Failed to fetch subscription price from Square:", e);
            // Fallback to internal data ONLY if we really can't get data, 
            // but if the plan is "Varies by Item", we shouldn't force internal price either?
            // Let's stick to safe fallback if API fails completely.
            const plan = SUBSCRIPTION_DATA.flatMap(c => c.plans).find(p => p.squarePlanId === planId);
            if (plan) {
                priceMoneyOverride = {
                    amount: BigInt(Math.round(plan.price * 100)),
                    currency: "AUD"
                };
                console.log(`[Checkout] Used fallback internal price: ${priceMoneyOverride.amount}`);
            }
        }
      }

      const lineItem: any = {
          catalogObjectId: itemVariationId,
          quantity: "1"
      };

      if (priceMoneyOverride) {
          lineItem.basePriceMoney = priceMoneyOverride;
      }

      lineItems.push(lineItem);
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
    console.log(`[Checkout] Using Location ID: ${locationId}`); 
    
    // FAILSAFE: Verify Location ID matches expected production ID
    // L3Z75JJJK1XZR
    if (locationId !== 'L3Z75JJJK1XZR') {
        console.warn(`[Checkout] WARNING: Location ID ${locationId} does not match expected 'L3Z75JJJK1XZR'`);
    }

    // HARDCODED DIAGNOSTIC PAYLOAD
    // Matches scripts/test-manual-checkout.js EXACTLY
    const body: any = {
      idempotencyKey: randomUUID(),
      order: {
        locationId: locationId!,
        customerId: squareCustomerId, // ENABLED: Link to our resolved Square Customer
        lineItems: lineItems 
      },
      checkoutOptions: {
        redirectUrl: "https://harriesbarbershopv2.vercel.app/dashboard?subscriptionSuccess=true", // EXACT MATCH with script
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: user.email,
        buyerPhoneNumber: user.user_metadata?.phone
      }
    };
    
    // Pass the Subscription Plan Variation ID if available
    if (subscriptionPlanVariationId) {
        body.checkoutOptions.subscriptionPlanId = subscriptionPlanVariationId;
    }

    console.log("[Checkout] FINAL PAYLOAD:", JSON.stringify(body, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    , 2));

    console.log("[Checkout] prePopulatedData:", JSON.stringify(body.prePopulatedData, null, 2));

    const { paymentLink } = await squareClient.checkout.paymentLinks.create(body);

    if (paymentLink?.url) {
       return NextResponse.redirect(paymentLink.url);
    } else {
       return NextResponse.json({ error: "Failed to generate payment link" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Square Checkout Error:", error);
    
    // Log helpful properties explicitly
    if (error instanceof Error) {
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
    }
    
    // Square SDK errors often hide details in .result, .body, or .errors
    try {
        if (error.result) {
            console.error("Square Result:", JSON.stringify(error.result, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            , 2));
        }
        if (error.errors) {
             console.error("Square Errors:", JSON.stringify(error.errors, null, 2));
        }
        if (error.body) {
             console.error("Square Body:", JSON.stringify(error.body, null, 2));
        }
    } catch (logError) {
        console.error("Failed to log error details:", logError);
    }
    
    return NextResponse.json(
        { 
            error: "An error occurred creating the checkout link",
            details: error.message || String(error)
        }, 
        { status: 500 }
    );
  }
}
