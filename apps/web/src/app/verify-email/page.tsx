import { Suspense } from 'react';
import VerifyEmailPage from '@/modules/auth/components/verify-email-page';

export default function VerifyEmailRoute() {
  return <Suspense><VerifyEmailPage /></Suspense>;
}
