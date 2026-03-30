'use client';


import { signup } from '@/app/auth/actions';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OTPVerifyForm from './OTPVerifyForm';

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
    const [emailToVerify, setEmailToVerify] = useState<string | null>(null);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = propPlanId || searchParams.get('planId');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const result = await signup(formData); 
        
        setLoading(false);
        
        if (result?.error) {
            setError(result.error);
        } else if (result?.message) {
            setMessage(result.message);
            setEmailToVerify(email);
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

    if (message && emailToVerify) {
        return (
            <OTPVerifyForm 
                email={emailToVerify} 
                planId={planId} 
                onSuccess={onSuccess} 
                onCancel={onSwitchToLogin} 
            />
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Sign Up</h2>
            
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
            
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
                        <div className={styles.phoneContainer}>
                            <select name="countryCode" className={styles.countrySelect} defaultValue="+61">
                                <option value="+61">🇦🇺 +61</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+64">🇳🇿 +64</option>
                            </select>
                            <input 
                                name="phoneNumber" 
                                type="tel" 
                                required 
                                className={styles.input}
                                placeholder="412345678"
                            />
                        </div>
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
                    <div>
                        <label className={styles.label}>Confirm Password</label>
                        <input 
                            name="confirmPassword" 
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
        </div>
    );
}
