import { Suspense } from 'react';
import ResetPasswordPage from '@/modules/auth/components/reset-password-page';

export default function ResetPasswordRoute() {
  return <Suspense><ResetPasswordPage /></Suspense>;
}
