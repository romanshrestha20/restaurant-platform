import Link from 'next/link';
import { classNames } from '@/lib/class-names';

type BrandProps = {
  href?: string;
  light?: boolean;
};

export function Brand({ href = '/', light = false }: BrandProps) {
  return (
    <Link
      className={classNames('wordmark', light && 'wordmark--light')}
      href={href}
      aria-label="Tablefolk home"
    >
      <span className="wordmark__seal" aria-hidden="true">T</span>
      <span>Tablefolk</span>
    </Link>
  );
}
