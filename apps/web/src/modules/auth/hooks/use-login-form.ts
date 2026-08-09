'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from './use-auth';

export function useLoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setPasswordChanged(
      new URLSearchParams(window.location.search).get('passwordChanged') === '1',
    );
    if (status === 'authenticated') router.replace('/account/profile');
  }, [router, status]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      const requestedPath = new URLSearchParams(window.location.search).get('next');
      router.replace(requestedPath?.startsWith('/') ? requestedPath : '/account/profile');
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'We could not sign you in. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    email,
    error,
    password,
    passwordChanged,
    setEmail,
    setPassword,
    setShowPassword,
    showPassword,
    submit,
    submitting,
  };
}
