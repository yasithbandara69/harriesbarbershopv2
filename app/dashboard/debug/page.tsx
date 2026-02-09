'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SUBSCRIPTION_DATA } from '@/app/components/subscription-data';

export default function DebugPage() {
    const [loading, setLoading] = useState(true);
    const [debugData, setDebugData] = useState<any>(null);

    useEffect(() => {
        async function runDebug() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setDebugData({ error: "Not logged in" });
                setLoading(false);
                return;
            }

            const { data: sub, error } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // Attempt Matching
            let matchResult = "NO MATCH";
            let matchedPlan = null;
            
            if (sub && sub.plan_id) {
                 for (const cat of SUBSCRIPTION_DATA) {
                    const p = cat.plans.find(x => x.squarePlanId === sub.plan_id || x.squarePlanVariationId === sub.plan_id);
                    if (p) {
                        matchResult = "MATCH FOUND";
                        matchedPlan = p;
                        break;
                    }
                }
            }

            setDebugData({
                user_id: user.id,
                db_subscription: sub,
                db_error: error,
                subscriptions_data_config: SUBSCRIPTION_DATA,
                match_attempt: {
                    status: matchResult,
                    plan_found: matchedPlan,
                    details: "Checked against squarePlanId AND squarePlanVariationId"
                }
            });
            setLoading(false);
        }

        runDebug();
    }, []);

    if (loading) return <div style={{padding: '2rem', color: 'white'}}>Loading Debug Data...</div>;

    return (
        <div style={{padding: '2rem', color: 'white', fontFamily: 'monospace', whiteSpace: 'pre-wrap'}}>
            <h1>Subscription Debugger</h1>
            <div style={{background: '#333', padding: '1rem', borderRadius: '8px', overflowX: 'auto'}}>
                {JSON.stringify(debugData, null, 2)}
            </div>
            
            <h2 style={{marginTop: '2rem'}}>Actions</h2>
            <p>If "db_subscription" shows "plan_id": "unknown-plan-fallback", then the sync didn't work.</p>
        </div>
    );
}
