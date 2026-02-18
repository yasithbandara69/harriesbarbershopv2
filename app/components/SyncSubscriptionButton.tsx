'use client';

import { useState } from 'react';
import { syncSubscriptionStatus } from '@/app/actions/subscription';
import { useRouter } from 'next/navigation';

export default function SyncSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await syncSubscriptionStatus();
      if (res.error) {
        setMsg(`Error: ${res.error}`);
      } else if (res.message) {
        setMsg(res.message);
        router.refresh();
      }
    } catch (e) {
      setMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleSync} 
        disabled={loading}
        style={{
            background: 'none',
            border: 'none',
            color: '#888',
            padding: '0',
            cursor: 'pointer',
            fontSize: '0.85rem',
            textDecoration: 'underline',
            fontFamily: 'inherit'
        }}
      >
        {loading ? 'Checking...' : 'Refresh Subscription Status'}
      </button>
      {msg && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</p>}
    </div>
  );
}
