'use client';

import { login } from '@/app/auth/actions';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import styles from './Auth.module.css';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToSignup?: () => void;
    planId?: string | null;
}

export default function LoginForm({ onSuccess, onSwitchToSignup, planId: propPlanId }: LoginFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = propPlanId || searchParams.get('planId');
    const message = searchParams.get('message');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(event.currentTarget);
        const result = await login(formData); 
        
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else if (result?.success) {
             if (planId) {
                 window.location.href = `/api/checkout/subscription?planId=${planId}`;
             } else if (onSuccess) {
                 onSuccess();
             } else {
                 router.push('/dashboard');
             }
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Login</h2>
            
            {message && (
                <div className={styles.success}>
                    {message}
                </div>
            )}

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {planId && <input type="hidden" name="planId" value={planId} />}
                <div>
                    <label className={styles.label}>Email or Phone</label>
                    <input 
                        name="email" 
                        type="text" 
                        required 
                        className={styles.input}
                        placeholder="you@example.com or +1234567890"
                    />
                </div>
                <div>
                    <label className={styles.label}>Password</label>
                    <input 
                        name="password" 
                        type="password" 
                        required 
                        className={styles.input}
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className={styles.button}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <div className={styles.footer}>
                Don't have an account?{' '}
                <button 
                    onClick={onSwitchToSignup}
                    className={styles.linkButton}
                >
                    Sign up
                </button>
            </div>
        </div>
    );
}
