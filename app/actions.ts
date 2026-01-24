'use server';

import { squareClient, locationId } from "@/lib/square"; // Assuming alias @ maps to ./
import { SearchAvailabilityRequest, CreateBookingRequest, Money } from "square";
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
    const profiles = response.data || [];
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
    
    const items = response.items || [];
    
    const services = items.flatMap((item: any) => item.itemData?.variations?.map((variation: any) => {
        // Filter by Team Member if provided
        if (teamMemberId) {
            const assignedIds = variation.itemVariationData?.teamMemberIds || [];
            // If the service has specific assignments and the requested staff is NOT in them, skip it.
            // Note: If assignedIds is empty, it usually means "All Team Members" in Square Dashboard, so we include it.
            if (assignedIds.length > 0 && !assignedIds.includes(teamMemberId)) {
                return null;
            }
        }

        return {
            id: variation.id,
            name: item.itemData?.name + (variation.itemVariationData?.name ? ` - ${variation.itemVariationData.name}` : ''),
            price: variation.itemVariationData?.priceMoney,
            duration: variation.itemVariationData?.serviceDuration,
            description: item.itemData?.description,
            version: variation.version // Required for booking
        };
    })).filter(Boolean);

    return serializeBigInt(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
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
        return serializeBigInt(response.availabilities || []);
    } catch (error: any) {
        console.error("Error searching availability:", JSON.stringify(error, null, 2));
        // If the error is because the staff doesn't perform the service, just return empty availability
        if (error.result?.errors?.some((e: any) => e.detail && e.detail.includes("Search did not find a team member"))) {
             return [];
        }
        throw error; // Rethrow other errors to be handled by the UI
    }
}

export async function createBooking(
    serviceId: string,
    serviceVersion: number, // Added version
    staffId: string,
    startAt: string,
    customerDetails: {
        givenName: string;
        familyName: string;
        emailAddress: string;
        phoneNumber: string;
    }
) {
    if (!locationId) throw new Error("Location ID not set");

    try {
        // 1. Create or Retrieve Customer
        const searchCustomerReq = {
            query: {
                filter: {
                    emailAddress: {
                        exact: customerDetails.emailAddress
                    }
                }
            }
        };
        
        let customerId: string | undefined;
        try {
            const searchRes = await squareClient.customers.search(searchCustomerReq);
            if (searchRes.customers && searchRes.customers.length > 0) {
                customerId = searchRes.customers[0].id;
            }
        } catch (e) {
            console.log("Customer search failed or empty, creating new.");
        }

        if (!customerId) {
            const createCustomerReq = {
                givenName: customerDetails.givenName,
                familyName: customerDetails.familyName,
                emailAddress: customerDetails.emailAddress,
                phoneNumber: customerDetails.phoneNumber,
                idempotencyKey: randomUUID() 
            };
            const createRes = await squareClient.customers.create(createCustomerReq);
            customerId = createRes.customer?.id;
        }

        if (!customerId) throw new Error("Failed to resolve customer user.");

        // 2. Create Booking
        const bookingReq: CreateBookingRequest = {
            booking: {
                customerId,
                locationId,
                startAt,
                appointmentSegments: [
                    {
                        teamMemberId: staffId,
                        serviceVariationId: serviceId,
                        serviceVariationVersion: BigInt(serviceVersion), // Pass version
                    }
                ]
            },
            idempotencyKey: randomUUID()
        };

        const response = await squareClient.bookings.create(bookingReq);
        return serializeBigInt(response.booking);

    } catch (error: any) {
        console.error("Error creating booking:", error);
        throw new Error(error.errors ? JSON.stringify(error.errors) : error.message);
    }
}
