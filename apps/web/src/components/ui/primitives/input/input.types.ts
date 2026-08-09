import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;
export type PasswordInputProps = Omit<InputProps, 'type'>;
