'use client';

import Link from 'next/link';
import { Alert, AuthShell, Button, FormField } from '@/components/ui';
import { useRegisterForm } from '../hooks/use-register-form';

export default function RegisterPage() {
  const registration = useRegisterForm();

  return (
    <AuthShell
      eyebrow="Join the table"
      title="Your favourite places, remembered."
      description="Create one account for personal details, future bookings, and orders."
      footnote="A simpler way to return to the places you love."
      compact
    >
          <p className="eyebrow">Create account</p>
          <h2>Tell us about yourself</h2>
          <p className="section-intro">Start with the details needed for your account.</p>

          <form className="auth-form" onSubmit={registration.submit} noValidate>
            <div className="field-grid">
              <FormField label="First name" htmlFor="firstName">
                <input id="firstName" autoComplete="given-name" maxLength={50} value={registration.form.firstName} onChange={(event) => registration.update('firstName', event.target.value)} required />
              </FormField>
              <FormField label="Last name" htmlFor="lastName">
                <input id="lastName" autoComplete="family-name" maxLength={50} value={registration.form.lastName} onChange={(event) => registration.update('lastName', event.target.value)} required />
              </FormField>
            </div>
            <FormField label="Email address" htmlFor="email">
              <input id="email" type="email" autoComplete="email" value={registration.form.email} onChange={(event) => registration.update('email', event.target.value)} required />
            </FormField>
            <FormField label="Phone number" htmlFor="phone" hint="Optional">
              <input id="phone" type="tel" autoComplete="tel" placeholder="+358401234567" value={registration.form.phone} onChange={(event) => registration.update('phone', event.target.value)} />
            </FormField>
            <FormField label="Password" htmlFor="password" hint="12+ characters">
              <div className="password-input">
                <input id="password" type={registration.showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} value={registration.form.password} onChange={(event) => registration.update('password', event.target.value)} required />
                <button type="button" onClick={() => registration.setShowPassword(!registration.showPassword)} aria-label={registration.showPassword ? 'Hide password' : 'Show password'} aria-pressed={registration.showPassword}>
                  {registration.showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormField>

            {registration.error ? <Alert>{registration.error}</Alert> : null}
            <Button fullWidth type="submit" disabled={registration.submitting}>
              {registration.submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
    </AuthShell>
  );
}
