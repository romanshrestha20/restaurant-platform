'use client';

import Link from 'next/link';
import {
  Alert,
  AuthCard,
  AuthShell,
  Form,
  FormField,
  Input,
  LoadingButton,
  PasswordInput,
} from '@/components/ui';
import { useLoginForm } from '../hooks/use-login-form';

export default function LoginPage() {
  const form = useLoginForm();

  return (
    <AuthShell
      eyebrow="Your table is waiting"
      title="Good food tastes better when everything else feels effortless."
      description="Keep your details, bookings, and favourite places close at hand."
      footnote="Thoughtful dining, from first look to last course."
    >
      <AuthCard
        eyebrow="Welcome back"
        title="Sign in to your account"
        description="Use the email and password connected to your Tablefolk account."
        footer={<p className="auth-switch">New to Tablefolk? <Link href="/register">Create an account</Link></p>}
      >
        {form.passwordChanged ? (
          <Alert tone="success">Password changed. Sign in again with your new password.</Alert>
        ) : null}
          <Form className="auth-form" onSubmit={form.submit}>
            <FormField label="Email address" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => form.setEmail(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Password" htmlFor="password">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => form.setPassword(event.target.value)}
                  required
                />
            </FormField>

            {form.error ? <Alert>{form.error}</Alert> : null}

            <LoadingButton fullWidth type="submit" loading={form.submitting} loadingText="Signing in…">Sign in</LoadingButton>
          </Form>
      </AuthCard>
    </AuthShell>
  );
}
