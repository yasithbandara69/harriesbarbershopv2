'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './header.module.css';
import { usePathname } from 'next/navigation';
import Modal from './Modal';
import LoginForm from './auth/LoginForm';
import SignupForm from './auth/SignupForm';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const pathname = usePathname();

    // Close modals when route changes (e.g. successful login redirect)
    useEffect(() => {
        setShowLoginModal(false);
        setShowSignupModal(false);
        setMobileMenuOpen(false);
    }, [pathname]);

    const navItems = [
        { name: "HOME", href: "/" },
        { name: "WORKS", href: "/#works" },
        { name: "SERVICES", href: "/#services" },
    ];

    const openLogin = () => {
        setShowSignupModal(false);
        setShowLoginModal(true);
        setMobileMenuOpen(false); // Close mobile menu if open
    };

    const openSignup = () => {
        setShowLoginModal(false);
        setShowSignupModal(true);
        setMobileMenuOpen(false); // Close mobile menu if open
    };

    const closeModal = () => {
        setShowLoginModal(false);
        setShowSignupModal(false);
    };

    return (
        <nav className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logoLink}>
                    <img 
                        src="/logo-header.png" 
                        alt="Harries Barbershop" 
                        className={styles.logo} 
                    />
                </Link>
                
                {/* Desktop Nav */}
                <div className={styles.nav}>
                    {navItems.map(item => (
                        <Link 
                            key={item.name} 
                            href={item.href} 
                            className={styles.navLink}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Controls (Login, Signup, Book) */}
                <div className={styles.controls}>
                    <button 
                        className={styles.loginBtn}
                        onClick={openLogin}
                        style={{ position: 'relative', zIndex: 60 }}
                    >
                        LOGIN
                    </button>
                    <button 
                        className={styles.btnBook} // Keep style similar
                        onClick={openSignup}
                        style={{ marginRight: '0.5rem', position: 'relative', zIndex: 60 }} // Add a bit of spacing if needed
                    >
                        SIGN UP
                    </button>
                    <Link href="/book" className={styles.btnBook}>
                        BOOK NOW
                    </Link>
                </div>

                {/* Mobile Menu Toggle (Simplified) */}
                <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {mobileMenuOpen 
                            ? <line x1="18" y1="6" x2="6" y2="18"></line> 
                            : <line x1="3" y1="12" x2="21" y2="12"></line>
                        }
                        {mobileMenuOpen 
                            ? <line x1="6" y1="6" x2="18" y2="18"></line> 
                            : <>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                              </>
                        }
                    </svg>
                </button>
            </div>

            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    {navItems.map(item => (
                        <Link 
                            key={item.name} 
                            href={item.href} 
                            className={styles.mobileNavLink}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <button 
                        className={styles.mobileNavLink} 
                        onClick={openLogin}
                        style={{ textAlign: 'left', background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}
                    >
                        LOGIN
                    </button>
                    <button 
                        className={styles.btnBook} 
                        onClick={openSignup}
                        style={{ textAlign: 'center' }}
                    >
                        SIGN UP
                    </button>
                    <Link href="/book" className={styles.btnBook} onClick={() => setMobileMenuOpen(false)}>
                        BOOK NOW
                    </Link>
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={showLoginModal} onClose={closeModal}>
                <LoginForm onSwitchToSignup={openSignup} />
            </Modal>

            <Modal isOpen={showSignupModal} onClose={closeModal}>
                <SignupForm onSwitchToLogin={openLogin} />
            </Modal>
        </nav>
    );
}
