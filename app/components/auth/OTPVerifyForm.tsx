'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOTP, resendOTP } from '@/app/auth/actions';
import styles from './Auth.module.css';

interface OTPVerifyFormProps {
    email: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    planId?: string | null;
}

export default function OTPVerifyForm({ email, onSuccess, onCancel, planId }: OTPVerifyFormProps) {
    const [token, setToken] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const result = await verifyOTP(email, token);

        setLoading(false);

        if (result?.error) {
            setError(result.error);
        } else {
            // Success!
            if (planId) {
                window.location.href = `/api/checkout/subscription?planId=${planId}`;
            } else if (onSuccess) {
                onSuccess();
            } else {
                router.push('/dashboard');
            }
        }
    };

    const handleResend = async () => {
        setResendStatus('loading');
        setError(null);
        
        const result = await resendOTP(email);
        
        if (result?.error) {
            setError(result.error);
            setResendStatus('error');
        } else {
            setResendStatus('success');
            // Hide success message and re-enable button after 15 seconds
            setTimeout(() => setResendStatus('idle'), 15000);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Confirm Your Email</h2>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#a1a1aa' }}>
                We've sent a confirmation code to <strong>{email}</strong>.
                Please enter it below to activate your account.
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.form}>
                <div>
                    <label className={styles.label}>Verification Code</label>
                    <input 
                        name="token" 
                        type="text" 
                        required 
                        className={styles.input}
                        placeholder="12345678"
                        maxLength={10}
                        value={token}
                        onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))} // only numbers
                        style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.15em' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading || token.length < 4}
                    className={styles.button}
                >
                    {loading ? 'Verifying...' : 'Verify Email'}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <button 
                        type="button" 
                        onClick={handleResend}
                        disabled={resendStatus === 'loading' || resendStatus === 'success'}
                        className={styles.linkButton}
                        style={{ fontSize: '0.875rem' }}
                    >
                        {resendStatus === 'loading' ? 'Sending...' : 
                         resendStatus === 'success' ? 'Code Sent!' : 
                         'Resend Code'}
                    </button>
                    {resendStatus === 'success' && (
                        <div style={{ color: '#bbf7d0', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            A new code has been sent to your email.
                        </div>
                    )}
                </div>
            </form>

            {onCancel && (
                <div className={styles.footer}>
                    <button 
                        onClick={onCancel}
                        className={styles.linkButton}
                    >
                        Return to Login
                    </button>
                </div>
            )}
        </div>
    );
}
