'use client';

import { useState } from 'react';
import { Button, Card, Input } from '@restaurant/ui';
import { useAuth } from '../hooks/use-auth';

export function AuthPage() {
  const { isAuthenticated, user, login, register, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return (
      <Card className="mx-auto mt-12 max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">Signed in as {user.email}</p>
        <Button onClick={() => void logout()}>Log out</Button>
      </Card>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to authenticate.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto mt-12 max-w-md p-6">
      <h1 className="text-2xl font-bold">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <Input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        )}
        <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}</Button>
      </form>
      <button className="mt-4 text-sm text-primary underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}
      </button>
    </Card>
  );
}
