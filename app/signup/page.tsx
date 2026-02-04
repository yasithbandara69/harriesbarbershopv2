'use client';

import SignupForm from '@/app/components/auth/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-lg shadow-xl border border-zinc-800">
        <SignupForm 
            onSwitchToLogin={() => window.location.href = '/login'} 
        />
      </div>
    </div>
  );
}
