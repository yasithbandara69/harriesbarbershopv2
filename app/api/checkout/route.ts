export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia', // Using the latest version matching SDK
});

export async function POST(req: Request) {
    try {
        const { priceId, planId } = await req.json();

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
        }

        // 1. Get authenticated user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch user profile to see if they already have a stripe_customer_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        let stripeCustomerId = profile?.stripe_customer_id;

        // If not, we could create one or let Stripe create one and link it via webhook
        // We will pass the Supabase user ID in client_reference_id so the webhook can link them.

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // 3. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId || undefined,
            client_reference_id: user.id,
            customer_email: stripeCustomerId ? undefined : user.email, // pre-fill email if no customer
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/#subscriptions`,
            subscription_data: {
                metadata: {
                    planId: planId,
                    userId: user.id
                }
            },
            metadata: {
                planId: planId, // Custom metadata to track the plan
                userId: user.id
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
