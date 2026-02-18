'use client';

import SignupForm from '@/app/components/auth/SignupForm';
import Link from 'next/link';

import { Suspense } from 'react';

import styles from '../login/Login.module.css';

export default function SignupPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginBox}>
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm 
                onSwitchToLogin={() => window.location.href = '/login'} 
            />
        </Suspense>
      </div>
    </div>
  );
}
