import { Spinner } from '../spinner';
import { Button } from './button';
import type { LoadingButtonProps } from './button.types';

export function LoadingButton({ children, disabled, loading = false, loadingText = 'Loading…', ...props }: LoadingButtonProps) {
  return <Button disabled={disabled || loading} aria-busy={loading} {...props}>{loading ? <><Spinner size="sm" label={loadingText} /><span>{loadingText}</span></> : children}</Button>;
}
