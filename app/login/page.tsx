'use client';

import LoginForm from '@/app/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-lg shadow-xl border border-zinc-800">
         <LoginForm 
            onSwitchToSignup={() => window.location.href = '/signup'} 
         />
      </div>
    </div>
  );
}
