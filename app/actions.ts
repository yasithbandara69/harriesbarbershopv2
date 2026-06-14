'use server';

import { squareClient, locationId } from "@/lib/square";
import { createClient } from "@/utils/supabase/server";
import { SearchAvailabilityRequest, CreateBookingRequest } from "square";
import { randomUUID } from "crypto";

// Helper to handle BigInt serialization for JSON
const serializeBigInt = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

export async function listTeamMembers() {
  try {
    const response = await squareClient.bookings.teamMemberProfiles.list({
        locationId: locationId
    });
    const result = response as any;
    const profiles = result.data || result.teamMemberProfiles || [];
    return profiles.map((p: any) => ({
        id: p.teamMemberId, // Use teamMemberId as the ID we pass around
        name: p.displayName
    }));
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

export async function listServices(teamMemberId?: string) {
  try {
    const response = await squareClient.catalog.searchItems({
      productTypes: ["APPOINTMENTS_SERVICE"],
    });
    
    const result = response as any;
    const items = result.items || [];
    
    const services = items.flatMap((item: any) => item.itemData?.variations?.map((variation: any) => {
        // Filter by Team Member if provided
        if (teamMemberId) {
            const assignedIds = variation.itemVariationData?.teamMemberIds || [];
            if (assignedIds.length > 0 && !assignedIds.includes(teamMemberId)) {
                return null;
            }
        }

        const name = item.itemData?.name + (variation.itemVariationData?.name ? ` - ${variation.itemVariationData.name}` : '');

        if (name.toLowerCase().includes('subscription')) {
            return null;
        }

        return {
            id: variation.id,
            name: name,
            price: variation.itemVariationData?.priceMoney,
            duration: variation.itemVariationData?.serviceDuration,
            description: item.itemData?.description,
            version: variation.version
        };
    })).filter(Boolean);

    return serializeBigInt(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

// NEW: Fetch a specific service by ID (even if hidden from general search)
export async function getServiceById(serviceId: string) {
    try {
        // Corrected method based on SDK v44 inspection: client.catalog.object.get({ objectId, ... })
        const response = await squareClient.catalog.object.get({
            objectId: serviceId,
            includeRelatedObjects: true
        });
        
        // Corrected based on debug script: The response object itself contains 'object' and 'relatedObjects'
        // There is no .result wrapper on this specific return type from the SDK for this method.
        const result = response as any;
        const item = result.object;
        
        if (!item) return null;

        if (item.type === "ITEM") {
             // If we got the parent Item, we need to pick a variation.
             // Usually for a subscription service there is only one variation.
             const variation = item.itemData?.variations?.[0];
             if (!variation) return null;
             
             return serializeBigInt({
                id: variation.id,
                name: item.itemData?.name + (variation.itemVariationData?.name ? ` - ${variation.itemVariationData.name}` : ''),
                price: variation.itemVariationData?.priceMoney,
                duration: variation.itemVariationData?.serviceDuration,
                version: variation.version
             });
        }

        // Check if we got the variation directly
        if (item.type === "ITEM_VARIATION") {
             // We need to fetch the parent Item to get the main name
             const parentId = item.itemVariationData?.itemId;
             let name = item.itemVariationData?.name || "Service";
             
             if (parentId) {
                 try {
                    const parentRes = await squareClient.catalog.object.get({ objectId: parentId });
                    const pResult = parentRes as any;
                    const parentName = pResult.object?.itemData?.name;
                    if (parentName) name = `${parentName} - ${name}`;
                 } catch(e) {}
             }

             return serializeBigInt({
                id: item.id,
                name: name,
                price: item.itemVariationData?.priceMoney,
                duration: item.itemVariationData?.serviceDuration,
                version: item.version
             });
        }
        
        return null;
    } catch (error: any) {
        console.error("Error fetching specific service:", error);
        throw error;
    }
}

export async function searchAvailability(startAt: string, endAt: string, serviceId: string, staffId?: string) {
    if (!locationId) throw new Error("Location ID not set");

    const query: SearchAvailabilityRequest = {
        query: {
            filter: {
                startAtRange: {
                    startAt: startAt,
                    endAt: endAt
                },
                locationId,
                segmentFilters: [
                    {
                        serviceVariationId: serviceId,
                        teamMemberIdFilter: {
                            any: staffId ? [staffId] : undefined
                        }
                    }
                ]
            }
        }
    };

    try {
        const response = await squareClient.bookings.searchAvailability(query);
        // Corrected based on debug: response has availabilities directly
        const result = response as any; 
        return serializeBigInt(result.availabilities || []);
    } catch (error: any) {
        console.error("Error searching availability:", JSON.stringify(error, null, 2));
        if (error.result?.errors?.some((e: any) => e.detail && e.detail.includes("Search did not find a team member"))) {
             return [];
        }
        throw error;
    }
}

// RESTORED: Create Booking function
export async function createBooking(
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

    try {
        // 1. Resolve Customer (Use existing Square ID if linked, otherwise search/create)
        // Check for logged-in user context
        let customerId: string | undefined;
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check profile for truth
                const { data: profile } = await supabase.from('profiles').select('square_customer_id').eq('id', user.id).single();
                customerId = profile?.square_customer_id || user.user_metadata?.square_customer_id;
            }
        } catch (e) {
            // Ignore auth errors, proceed as guest
        }

        if (!customerId) {
            // Try search by email
            const searchEmail = customerDetails.emailAddress.toLowerCase().trim();
            const searchRes = await squareClient.customers.search({
                query: { filter: { emailAddress: { exact: searchEmail } } }
            });
            // Robust handling
            const customers = searchRes.customers || (searchRes as any).result?.customers || (searchRes as any).body?.customers || [];
            customerId = customers?.[0]?.id;
        }

        if (!customerId) {
            // Fallback: Create new customer
            try {
                const createRes = await squareClient.customers.create({
                    givenName: customerDetails.givenName,
                    familyName: customerDetails.familyName,
                    emailAddress: customerDetails.emailAddress,
                    phoneNumber: customerDetails.phoneNumber,
                    idempotencyKey: randomUUID() 
                });
                const created = createRes.customer || (createRes as any).result?.customer || (createRes as any).body?.customer;
                customerId = created?.id;
            } catch (err: any) {
                const isPhoneError = err.errors?.some((e: any) => e.code === 'INVALID_PHONE_NUMBER') || JSON.stringify(err).includes('INVALID_PHONE_NUMBER');
                if (isPhoneError) {
                    console.log("Retrying customer creation without invalid phone number:", customerDetails.phoneNumber);
                    const retryRes = await squareClient.customers.create({
                        givenName: customerDetails.givenName,
                        familyName: customerDetails.familyName,
                        emailAddress: customerDetails.emailAddress,
                        idempotencyKey: randomUUID() 
                    });
                    const created = retryRes.customer || (retryRes as any).result?.customer || (retryRes as any).body?.customer;
                    customerId = created?.id;
                } else {
                    throw err;
                }
            }
        }

        if (!customerId) throw new Error("Failed to resolve customer user.");

        // 2. Create Booking
        const bookingReq: CreateBookingRequest = {
            booking: {
                customerId,
                locationId,
                startAt,
                customerNote,
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

        // Reverted to .create() based on working code
        // Fern SDK returns { data: { booking: ... } }
        // Node SDK returns { booking: ... }
        // @ts-ignore
        const response = await squareClient.bookings.create(bookingReq);
        const bResult = response as any;
        const booking = bResult.data?.booking || bResult.booking || bResult.result?.booking;
        
        if (!booking) {
            throw new Error("Booking created but no booking object returned.");
        }

        return serializeBigInt(booking);

    } catch (error: any) {
        console.error("Error creating booking:", error);
        throw new Error(error.errors ? JSON.stringify(error.errors) : error.message);
    }
}

// NEW: List bookings for a specific customer
export async function listCustomerBookings(customerId: string) {
    if (!locationId) throw new Error("Location ID not set");

    try {
        // @ts-ignore
        const response = await squareClient.bookings.list({
             customerId,
             // limit: 50, // optional
        });

        // Handle various response structures from different SDK versions/builds
        const bookings = response.data?.bookings 
                        // @ts-ignore
                        || response.response?.bookings 
                        // @ts-ignore
                        || response.bookings 
                        // @ts-ignore
                        || response.result?.bookings 
                        || [];

        console.log(`Found ${bookings.length} bookings for user.`);
        
        return bookings.map((b: any) => ({
            id: b.id,
            status: b.status,
            startAt: b.startAt,
            serviceVariationId: b.appointmentSegments?.[0]?.serviceVariationId
        }));
    } catch (error) {
        console.error("Error listing customer bookings:", error);
        return [];
        }
}

export async function getHarryTeamMember() {
    const team = await listTeamMembers();
    const harry = team.find((m: any) => m.name.toLowerCase().includes('harry')) || team[0];
    return harry;
}
