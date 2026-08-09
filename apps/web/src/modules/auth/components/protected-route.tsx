'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  if (status !== 'authenticated') {
    return (
      <div className="session-loader" role="status" aria-live="polite">
        <span className="session-loader__mark">T</span>
        <span>{status === 'loading' ? 'Restoring your session…' : 'Redirecting…'}</span>
      </div>
    );
  }

  return children;
}
