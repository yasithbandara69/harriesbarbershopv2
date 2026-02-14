'use server';

import { createClient } from "@/utils/supabase/server";
import { squareClient, locationId } from "@/lib/square";
import { randomUUID } from "crypto";
import { CreateBookingRequest } from "square";

const serializeBigInt = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

export async function createMemberBooking(
    serviceId: string,
    serviceVersion: number,
    staffId: string,
    startAt: string,
    customerDetails: {
        id?: string;
        givenName: string;
        familyName: string;
        emailAddress: string;
        phoneNumber: string;
    },
    customerNote?: string
) {
    if (!locationId) throw new Error("Location ID not set");
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. Check Credits
    // Transaction-like safety is hard with Supabase HTTP API + Square API without PG functions.
    // For MVP: Check -> Decrement -> Book -> (Undo Decrement if Book Fails)
    
    // Get current subscription
     const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .single();
    
    if (subError || !subscription) {
        throw new Error("No active subscription found.");
    }

    if (subscription.credits < 1) {
        throw new Error("Insufficient credits.");
    }

    // 2. Decrement Credit (Optimistic)
    const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ credits: subscription.credits - 1 })
        .eq('id', subscription.id);

    if (updateError) {
        throw new Error("Failed to update credits.");
    }

    // 3. Create Booking in Square
    try {
        let customerId = customerDetails.id;  // Use passed ID first

        // Fallback: Check Profile Table (Source of Truth) if ID not passed
        if (!customerId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('square_customer_id')
                .eq('id', user.id)
                .single();
            customerId = profile?.square_customer_id;
        }

        // Fallback to Metadata (might be stale)
        if (!customerId) {
            customerId = user.user_metadata?.square_customer_id;
        }

        if (!customerId) {
             // Try search by email (Last Resort)
             console.log("[MemberBooking] ID missing, searching by email...");
             const searchRes = await squareClient.customers.search({
                query: { filter: { emailAddress: { exact: user.email } } }
             });
             // Robust handling
             const customers = searchRes.customers || (searchRes as any).result?.customers || (searchRes as any).body?.customers || [];
             customerId = customers?.[0]?.id;
        }
        
        if (!customerId) {
            // Fallback: Create new (should be rare for subscribers)
             const createRes = await squareClient.customers.create({
                givenName: customerDetails.givenName,
                familyName: customerDetails.familyName,
                emailAddress: customerDetails.emailAddress,
                phoneNumber: customerDetails.phoneNumber,
                idempotencyKey: randomUUID()
            });
            const created = createRes.customer || (createRes as any).result?.customer || (createRes as any).body?.customer;
            customerId = created?.id;
        }
        
        if (!customerId) throw new Error("Could not resolve Square Customer ID");

        // SYNC: Ensure we capture this ID in Supabase if it was missing
        if (!user.user_metadata?.square_customer_id && customerId) {
            console.log(`[MemberBooking] Linking resolved Square Customer ${customerId} to user ${user.id}`);
            // 1. Update public profile (used by Dashboard)
            await supabase.from('profiles').upsert({ 
                id: user.id,
                square_customer_id: customerId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
            // 2. Update Auth Metadata (used by Session)
            await supabase.auth.updateUser({ 
                data: { square_customer_id: customerId } 
            });
        }

        const bookingReq: CreateBookingRequest = {
            booking: {
                customerId,
                locationId,
                startAt,
                customerNote: customerNote ? `[MEMBER] ${customerNote}` : "[MEMBER BOOKING]",
                appointmentSegments: [
                    {
                        teamMemberId: staffId,
                        serviceVariationId: serviceId,
                        serviceVariationVersion: BigInt(serviceVersion),
                    }
                ]
            },
            idempotencyKey: randomUUID()
        };

        // @ts-ignore
        const response = await squareClient.bookings.create(bookingReq);
        const bResult = response as any;
        const booking = bResult.data?.booking || bResult.booking || bResult.result?.booking;

        if (!booking) {
             throw new Error("Booking created but no booking object returned from Square.");
        }
        
        return { success: true, booking };

    } catch (error: any) {
        console.error("Member Booking Failed:", error);
        
        // 4. Rollback Credit
        await supabase
            .from('user_subscriptions')
            .update({ credits: subscription.credits }) // Restore original
            .eq('id', subscription.id);
            
        throw new Error(error.errors ? JSON.stringify(error.errors) : error.message || "Booking failed at provider.");
    }
}
