'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Modal from '@/app/components/Modal';
import styles from './EmailVerificationSuccess.module.css';

export default function EmailVerificationSuccess() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setIsOpen(true);
        }
    }, [searchParams]);

    const handleClose = () => {
        setIsOpen(false);
        // Remove the query param from URL without refreshing
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('verified');
        router.replace(`?${newParams.toString()}`, { scroll: false });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className={styles.container}>
                <div className={styles.iconWrapper}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h2 className={styles.title}>Email Confirmed!</h2>
                <p className={styles.message}>
                    Your email address has been successfully verified. You now have full access to your account.
                </p>
                <button onClick={handleClose} className={styles.button}>
                    Close
                </button>
            </div>
        </Modal>
    );
}
