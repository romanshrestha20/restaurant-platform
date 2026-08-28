'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, AuthCard, AuthShell, Form, FormField, LoadingButton, PasswordInput } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { authService } from '../services/auth.service';

export default function ResetPasswordPage() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!token) return setError('This reset link is missing a token.');
    if (password.length < 12) return setError('Your password must be at least 12 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setSubmitting(true);
    try { await authService.resetPassword(token, password); setSuccess(true); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'This reset link is invalid or expired.'); }
    finally { setSubmitting(false); }
  };

  return <AuthShell eyebrow="Account recovery" title="A fresh start." description="Choose a new password for your Tablefolk account." footnote="Thoughtful dining, from first look to last course."><AuthCard eyebrow="Reset password" title={success ? 'Password reset successful' : 'Create a new password'} description={success ? 'Your password has been changed. You can now sign in with your new password.' : 'Use at least 12 characters and keep your password unique.'} footer={<p className="auth-switch"><Link href="/login">Sign in</Link></p>}>{success ? <Alert tone="success">Your password has been updated successfully.</Alert> : <Form className="auth-form" onSubmit={submit}><FormField label="New password" htmlFor="password"><PasswordInput id="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></FormField><FormField label="Confirm password" htmlFor="confirm-password"><PasswordInput id="confirm-password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></FormField><p className="auth-password-hint">At least 12 characters · Passwords must match</p>{error ? <Alert>{error}</Alert> : null}<LoadingButton fullWidth type="submit" loading={submitting} loadingText="Resetting…">Reset password</LoadingButton></Form>}</AuthCard></AuthShell>;
}
