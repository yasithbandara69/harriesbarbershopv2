'use client';

import LoginForm from '@/app/components/auth/LoginForm';
import Link from 'next/link';

import { Suspense } from 'react';

import styles from './Login.module.css';

export default function LoginPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginBox}>
         <Suspense fallback={<div>Loading...</div>}>
             <LoginForm 
                onSwitchToSignup={() => window.location.href = '/signup'} 
             />
         </Suspense>
      </div>
    </div>
  );
}
