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
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
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

            <div className={styles.tabContainer}>
                <button 
                    type="button" 
                    className={`${styles.tab} ${loginMethod === 'email' ? styles.tabActive : ''}`}
                    onClick={() => setLoginMethod('email')}
                >
                    Email
                </button>
                <button 
                    type="button" 
                    className={`${styles.tab} ${loginMethod === 'phone' ? styles.tabActive : ''}`}
                    onClick={() => setLoginMethod('phone')}
                >
                    Phone
                </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {planId && <input type="hidden" name="planId" value={planId} />}
                
                {loginMethod === 'email' ? (
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
                ) : (
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
                )}

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
