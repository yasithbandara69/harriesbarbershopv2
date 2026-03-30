import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia'
});

export async function POST(req: Request) {
    const payload = await req.text();
    const signature = req.headers.get('Stripe-Signature');

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(payload, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        console.error('Webhook signature verification failed.', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                {
                    const session = event.data.object as Stripe.Checkout.Session;
                    const userId = session.client_reference_id || session.metadata?.userId;
                    const planId = session.metadata?.planId;

                    if (!userId) {
                        console.error('No userId found in checkout session.');
                        break;
                    }

                    const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                    const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
                    
                    const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
                        auth: { autoRefreshToken: false, persistSession: false }
                    });

                    // Determine initial credits
                    const initialCredits = (planId && planId.includes('premium')) ? 4 : 2;

                    // Update user profile with Stripe IDs and initial credits
                    const { error } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            stripe_customer_id: session.customer?.toString(),
                            stripe_subscription_id: session.subscription?.toString(),
                            credits: initialCredits
                        })
                        .eq('id', userId);

                    if (error) {
                        console.error('Error updating Stripe IDs and credits in Supabase:', error);
                        return NextResponse.json({ error: 'Failed to apply IDs' }, { status: 500 });
                    }

                    console.log(`Successfully linked subscription and assigned ${initialCredits} credits to user ${userId}`);
                }
                break;
                
            case 'invoice.payment_succeeded':
                {
                    const invoice = event.data.object as any;
                    
                    // Only process for subscription cycles (not the initial payment handled by checkout.session.completed)
                    if (invoice.billing_reason === 'subscription_cycle') {
                        const subscriptionId = invoice.subscription?.toString();
                        
                        if (!subscriptionId) {
                            console.log('No subscription ID found in invoice, skipping.');
                            break;
                        }

                        const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                        const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
                        
                        const supabaseAdmin = createClient(supabaseAdminUrl, supabaseAdminKey, {
                            auth: { autoRefreshToken: false, persistSession: false }
                        });

                        // Find user by subscription ID
                        const { data: profile } = await supabaseAdmin
                            .from('profiles')
                            .select('id, credits')
                            .eq('stripe_subscription_id', subscriptionId)
                            .single();

                        if (profile) {
                            // Determine credits based on price ID
                            let creditsToAdd = 2; // Default to essential
                            const priceId = invoice.lines?.data?.[0]?.price?.id;
                            
                            if (priceId === 'price_1TFFPdLJS030B1q4pOhImkwQ' || priceId === 'price_1TFFRVLJS030B1q4FNqhcnBS') {
                                creditsToAdd = 4;
                            }

                            // User requested: "no set the credits back to 2 or 4 credits" (no rollover)
                            const { error } = await supabaseAdmin
                                .from('profiles')
                                .update({ credits: creditsToAdd })
                                .eq('id', profile.id);

                            if (error) {
                                console.error('Failed to update credits for subscription cycle', error);
                            } else {
                                console.log(`Successfully reset credits to ${creditsToAdd} for user ${profile.id} on renewal`);
                            }
                        }
                    }
                }
                break;
                
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook event:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
