'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './header.module.css';
import { usePathname } from 'next/navigation';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { name: "HOME", href: "/" },
        { name: "WORKS", href: "/#works" },
        { name: "SERVICES", href: "/#services" },
    ];

    return (
        <nav className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logoLink}>
                    <img 
                        src="/logo-header.png" 
                        alt="Harries Barbershop" 
                        className={styles.logo} // Using our local logo asset but styled like source
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
                    <button className={styles.loginBtn}>LOGIN</button>
                    <button className={styles.btnBook}>SIGN UP</button>
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
                    <Link href="/book" className={styles.btnBook} onClick={() => setMobileMenuOpen(false)}>
                        BOOK NOW
                    </Link>
                </div>
            )}
        </nav>
    );
}
