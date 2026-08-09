'use client';

import Link from 'next/link';
import { classNames } from '@/lib/class-names';
import { useBrand } from '@/lib/brand';

type BrandProps = {
  href?: string;
  light?: boolean;
};

export function Brand({ href = '/', light = false }: BrandProps) {
  const brand = useBrand();

  return (
    <Link
      className={classNames('wordmark', light && 'wordmark--light')}
      href={href === '/' ? brand.homeHref : href}
      aria-label={`${brand.name} home`}
    >
      <span className="wordmark__seal" aria-hidden="true">{brand.mark}</span>
      <span>{brand.name}</span>
    </Link>
  );
}
