'use client';

import { forwardRef, useState } from 'react';
import { Input } from './input';
import type { PasswordInputProps } from './input.types';

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input"><Input ref={ref} {...props} type={visible ? 'text' : 'password'} /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? 'Hide' : 'Show'}</button></div>;
});
