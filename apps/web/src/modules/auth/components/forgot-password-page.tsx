'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Alert, AuthCard, AuthShell, Form, FormField, Input, LoadingButton } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { authService } from '../services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'We could not process your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow="Account recovery" title="Get back to your table." description="Reset your password securely and return to the food you love." footnote="Thoughtful dining, from first look to last course.">
      <AuthCard eyebrow="Forgot password?" title={submitted ? 'Check your email' : 'Reset your password'} description={submitted ? "If an account exists for that email address, we've sent instructions to reset your password. The link expires after a limited time." : "Enter the email address associated with your account and we'll send you a reset link."} footer={<p className="auth-switch"><Link href="/login">Back to login</Link></p>}>
        {submitted ? <Alert tone="success">If your email is registered, the reset instructions are on their way.</Alert> : <Form className="auth-form" onSubmit={submit}><FormField label="Email address" htmlFor="email"><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></FormField>{error ? <Alert>{error}</Alert> : null}<LoadingButton fullWidth type="submit" loading={submitting} loadingText="Sending…">Send reset link</LoadingButton></Form>}
      </AuthCard>
    </AuthShell>
  );
}
