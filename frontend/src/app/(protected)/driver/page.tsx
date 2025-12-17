'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverIndex() {
  const router = useRouter();

  useEffect(() => {
    router.push('/driver/trips');
  }, [router]);

  return null;
}

