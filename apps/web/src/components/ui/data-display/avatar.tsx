import { classNames } from '@/lib/class-names';

export function Avatar({ alt = '', className, fallback, size = 'md', src }: { alt?: string; className?: string; fallback: string; size?: 'sm' | 'md' | 'lg' | 'xl'; src?: string | null }) {
  return <span className={classNames('ui-avatar', `ui-avatar--${size}`, className)}>{src ? <img src={src} alt={alt} /> : <span aria-label={alt || `Initials ${fallback}`}>{fallback.slice(0, 2).toUpperCase()}</span>}</span>;
}
