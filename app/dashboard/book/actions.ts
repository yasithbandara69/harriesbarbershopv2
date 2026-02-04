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

    try {
        // 3. Create Booking in Square
        // We reuse the logic from general booking but ensuring we use the member service
        
        // Resolve Customer (Use existing Square ID if linked, otherwise search/create)
        // We can trust the user.user_metadata.square_customer_id if available?
        // Let's verify or search to be safe.
        let customerId = user.user_metadata?.square_customer_id;

        if (!customerId) {
             // Try search by email
             const searchRes = await squareClient.customers.search({
                query: { filter: { emailAddress: { exact: user.email } } }
             });
             customerId = searchRes.customers?.[0]?.id;
             
             // If still no customer, create one? 
             // Ideally members DO have a customer ID because they bought a sub.
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
            customerId = createRes.customer?.id;
        }
        
        if (!customerId) throw new Error("Could not resolve Square Customer ID");

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

        const response = await squareClient.bookings.create(bookingReq);
        const booking = serializeBigInt(response.booking);
        
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
