'use client';

import Link from 'next/link';
import { Alert, AuthShell, Button, FormField } from '@/components/ui';
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
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to your account</h2>
          <p className="section-intro">Use the email and password connected to your Tablefolk account.</p>

          {form.passwordChanged ? (
            <Alert tone="success">Password changed. Sign in again with your new password.</Alert>
          ) : null}

          <form className="auth-form" onSubmit={form.submit} noValidate>
            <FormField label="Email address" htmlFor="email">
              <input
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
              <div className="password-input">
                <input
                  id="password"
                  name="password"
                  type={form.showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => form.setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => form.setShowPassword(!form.showPassword)}
                  aria-label={form.showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={form.showPassword}
                >
                  {form.showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormField>

            {form.error ? <Alert>{form.error}</Alert> : null}

            <Button fullWidth type="submit" disabled={form.submitting}>
              {form.submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="auth-switch">
            New to Tablefolk? <Link href="/register">Create an account</Link>
          </p>
    </AuthShell>
  );
}
