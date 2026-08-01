import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event;
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            // For local testing without a configured webhook secret
            event = JSON.parse(payload);
        } else {
            event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
        }
    } catch (err: any) {
        console.error('Webhook signature verification failed.', err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const adminClient = createAdminClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                
                const userId = session.client_reference_id;
                if (!userId) break;

                const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                const priceId = lineItems.data[0]?.price?.id;

                let tier = '';
                let haircutCredits = 0;
                let beardCredits = 0;

                if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_HAIRCUT) {
                    tier = 'Haircut';
                    haircutCredits = 4;
                } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_HAIRCUT_BEARD) {
                    tier = 'Haircut + Beard';
                    beardCredits = 4; 
                }

                if (tier) {
                    await adminClient.from('profiles').update({
                        subscription_tier: tier,
                        haircut_credits: haircutCredits,
                        beard_credits: beardCredits,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: session.subscription as string
                    }).eq('id', userId);
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                
                if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
                     const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                     const priceId = subscription.items.data[0]?.price?.id;

                     let haircutCredits = 0;
                     let beardCredits = 0;

                     if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_HAIRCUT) {
                         haircutCredits = 4;
                     } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_HAIRCUT_BEARD) {
                         beardCredits = 4;
                     }

                     if (haircutCredits > 0) {
                        await adminClient.from('profiles').update({
                            haircut_credits: haircutCredits,
                            beard_credits: beardCredits,
                        }).eq('stripe_subscription_id', invoice.subscription);
                     }
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('Webhook handler failed:', err);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
