'use client';


import { signup } from '@/app/auth/actions';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import styles from './Auth.module.css';

interface SignupFormProps {
    onSuccess?: () => void;
    onSwitchToLogin?: () => void;
    planId?: string | null;
}

export default function SignupForm({ onSuccess, onSwitchToLogin, planId: propPlanId }: SignupFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = propPlanId || searchParams.get('planId');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const result = await signup(formData); 
        
        setLoading(false);
        
        if (result?.error) {
            setError(result.error);
        } else if (result?.message) {
            setMessage(result.message);
        } else {
            // Success!
            if (planId) {
                // If there's a planId, redirect to the checkout flow
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
            <h2 className={styles.title}>Sign Up</h2>
            
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
            
            {message ? (
                 <div className="text-center">
                    <div className={styles.success} style={{ marginBottom: '20px' }}>
                        {message}
                    </div>
                    <p className="mb-4 text-zinc-400">
                        We have sent a confirmation link to your email address. 
                        Please click the link to activate your account.
                    </p>
                    <button 
                        onClick={onSwitchToLogin}
                        className={styles.button}
                    >
                        Return to Login
                    </button>
                 </div>
            ) : (
                <>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {planId && <input type="hidden" name="planId" value={planId} />}
                    <div className={styles.grid}>
                        <div>
                            <label className={styles.label}>First Name</label>
                            <input 
                            name="firstName" 
                            type="text" 
                            required 
                            className={styles.input}
                            placeholder="John"
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Last Name</label>
                            <input 
                            name="lastName" 
                            type="text" 
                            required 
                            className={styles.input}
                            placeholder="Doe"
                            />
                        </div>
                    </div>
                    <div>
                        <label className={styles.label}>Phone</label>
                        <input 
                            name="phone" 
                            type="tel" 
                            required 
                            className={styles.input}
                            placeholder="+1234567890"
                        />
                    </div>
                    <div>
                        <label className={styles.label}>Email</label>
                        <input 
                            name="email" 
                            type="email" 
                            required 
                            className={styles.input}
                            placeholder="you@example.com"
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
                            minLength={6}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={styles.button}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className={styles.footer}>
                    Already have an account?{' '}
                    <button 
                        onClick={onSwitchToLogin}
                        className={styles.linkButton}
                    >
                        Login
                    </button>
                </div>
                </>
            )}
        </div>
    );
}
