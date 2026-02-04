'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!mounted || !isOpen) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true">
            {/* Backdrop handling in overlay click */}
            <div 
                style={{position: 'absolute', inset: 0}} 
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Panel */}
            <div className={styles.modal}>
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className={styles.closeButton}
                    aria-label="Close"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                {children}
            </div>
        </div>,
        document.body
    );
}
