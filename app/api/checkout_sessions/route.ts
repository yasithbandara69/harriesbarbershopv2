import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planTitle } = body;

        // Verify auth
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let priceId = '';
        if (planTitle === 'Haircut') {
            priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_HAIRCUT as string;
        } else if (planTitle === 'Haircut + Beard') {
            priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_HAIRCUT_BEARD as string;
        } else {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        if (!priceId) {
             console.error(`Price ID not configured in environment variables for plan: ${planTitle}`);
             return NextResponse.json({ error: 'Server misconfiguration. Have you added NEXT_PUBLIC_STRIPE_PRICE_* to .env.local?' }, { status: 500 });
        }

        // Create Checkout Sessions from body params.
        const origin = req.headers.get('origin') || 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/#memberships`,
            customer_email: user.email,
            client_reference_id: user.id,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json(
            { error: err.message || 'Internal Server Error' },
            { status: err.statusCode || 500 }
        );
    }
}
