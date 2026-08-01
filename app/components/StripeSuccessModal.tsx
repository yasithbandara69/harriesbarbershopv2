'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useRouter } from 'next/navigation';

interface StripeSuccessModalProps {
    sessionId: string | undefined;
}

export default function StripeSuccessModal({ sessionId }: StripeSuccessModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (sessionId) {
            setIsOpen(true);
            // Remove session_id from URL so it doesn't show again on refresh
            router.replace('/dashboard', { scroll: false });
        }
    }, [sessionId, router]);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#fff',
                fontFamily: 'var(--font-inter), sans-serif'
            }}>
                <svg 
                    width="64" height="64" viewBox="0 0 24 24" fill="none" 
                    stroke="var(--primary-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ margin: '0 auto 1.5rem auto', display: 'block' }}
                >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 style={{
                    fontFamily: 'var(--font-oswald), sans-serif',
                    fontSize: '2rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--primary-gold)',
                    marginBottom: '1rem'
                }}>
                    Welcome to the Club!
                </h2>
                <p style={{
                    fontSize: '1rem',
                    color: '#d1d1d1',
                    marginBottom: '2rem',
                    lineHeight: 1.5
                }}>
                    Your payment was successful and your Loyalty Membership is now active. Enjoy your premium benefits!
                </p>
                <button 
                    onClick={handleClose}
                    style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: 'var(--primary-gold)',
                        color: '#000',
                        fontFamily: 'var(--font-inter), sans-serif',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0c541')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-gold)')}
                >
                    Continue to Dashboard
                </button>
            </div>
        </Modal>
    );
}
