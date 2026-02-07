'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubscriptionSuccess() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get('subscriptionSuccess') === 'true') {
      setShow(true);
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div style={{
      background: 'rgba(212, 175, 55, 0.2)',
      border: '1px solid var(--primary-gold)',
      color: 'var(--primary-gold)',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      textAlign: 'center',
      fontWeight: 'bold',
      animation: 'fadeIn 0.5s ease-in-out'
    }}>
      🎉 Subscription Activated Successfully!
    </div>
  );
}
