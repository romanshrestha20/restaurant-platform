'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from './use-auth';

type RegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

const initialForm: RegistrationForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
};

export function useRegisterForm() {
  const { register, status } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/account/profile');
  }, [router, status]);

  const update = (field: keyof RegistrationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = form.phone.trim();

    if (!firstName || !lastName || firstName.length > 50 || lastName.length > 50) {
      setError('Enter a first and last name between 1 and 50 characters.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError('Use an international phone number such as +358401234567.');
      return;
    }
    if (form.password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await register({
        firstName,
        lastName,
        email: form.email.trim(),
        password: form.password,
        ...(phone ? { phone } : {}),
      });
      router.replace('/account/profile');
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'We could not create your account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    error,
    form,
    setShowPassword,
    showPassword,
    submit,
    submitting,
    update,
  };
}
