'use client';

import Link from 'next/link';
import { Alert, AuthCard, AuthShell, Form, FormField, Input, LoadingButton, PasswordInput } from '@/components/ui';
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
      <AuthCard
        eyebrow="Create account"
        title="Tell us about yourself"
        description="Start with the details needed for your account."
        footer={<p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>}
      >
          <Form className="auth-form" onSubmit={registration.submit}>
            <div className="field-grid">
              <FormField label="First name" htmlFor="firstName">
                <Input id="firstName" autoComplete="given-name" maxLength={50} value={registration.form.firstName} onChange={(event) => registration.update('firstName', event.target.value)} required />
              </FormField>
              <FormField label="Last name" htmlFor="lastName">
                <Input id="lastName" autoComplete="family-name" maxLength={50} value={registration.form.lastName} onChange={(event) => registration.update('lastName', event.target.value)} required />
              </FormField>
            </div>
            <FormField label="Email address" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={registration.form.email} onChange={(event) => registration.update('email', event.target.value)} required />
            </FormField>
            <FormField label="Phone number" htmlFor="phone" hint="Optional">
              <Input id="phone" type="tel" autoComplete="tel" placeholder="+358401234567" value={registration.form.phone} onChange={(event) => registration.update('phone', event.target.value)} />
            </FormField>
            <FormField label="Password" htmlFor="password" hint="12+ characters">
                <PasswordInput id="password" autoComplete="new-password" minLength={12} value={registration.form.password} onChange={(event) => registration.update('password', event.target.value)} required />
            </FormField>

            {registration.error ? <Alert>{registration.error}</Alert> : null}
            <LoadingButton fullWidth type="submit" loading={registration.submitting} loadingText="Creating account…">Create account</LoadingButton>
          </Form>
      </AuthCard>
    </AuthShell>
  );
}
