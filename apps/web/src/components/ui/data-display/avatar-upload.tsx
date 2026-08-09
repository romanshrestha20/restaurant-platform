import { useId, type ChangeEventHandler } from 'react';
import { Avatar } from './avatar';
import { FormError } from '../form';
import { Spinner } from '../primitives/spinner';

export function AvatarUpload({ accept = 'image/jpeg,image/png,image/webp', alt, disabled, error, fallback, label, loading, onChange, src }: { accept?: string; alt?: string; disabled?: boolean; error?: string; fallback: string; label?: string; loading?: boolean; onChange: ChangeEventHandler<HTMLInputElement>; src?: string | null }) {
  const id = useId();
  const actionLabel = label ?? (src ? 'Change photo' : 'Add photo');
  return <div className="avatar-upload"><Avatar src={src} fallback={fallback} alt={alt} size="lg" /><label className="avatar-upload__button" htmlFor={id}>{loading ? <><Spinner size="sm" /> Uploading…</> : actionLabel}</label><input className="visually-hidden" id={id} type="file" accept={accept} disabled={disabled || loading} onChange={onChange} />{error ? <FormError className="avatar-upload__error">{error}</FormError> : null}</div>;
}
