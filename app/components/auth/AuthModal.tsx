'use client';

import { useState } from 'react';
import Modal from '@/app/components/Modal';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'login' | 'signup';
    onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialView = 'signup', onSuccess }: AuthModalProps) {
    const [view, setView] = useState<'login' | 'signup'>(initialView);

    // Reset view when modal opens/closes if needed, or just let it persist. 
    // Usually better to respect initialView or stick to last state. 
    // We'll trust state for now, but update it if initialView changes when opening?
    // Let's keep it simple.

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-4">
                {view === 'login' ? (
                    <LoginForm 
                        onSuccess={onSuccess} 
                        onSwitchToSignup={() => setView('signup')} 
                    />
                ) : (
                    <SignupForm 
                        onSuccess={onSuccess} 
                        onSwitchToLogin={() => setView('login')} 
                    />
                )}
            </div>
        </Modal>
    );
}
