'use client';

import type { ReactNode } from 'react';
import { useAuthBootstrap } from '../hooks/use-auth-bootstrap';

export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthBootstrap();

  return children;
}
