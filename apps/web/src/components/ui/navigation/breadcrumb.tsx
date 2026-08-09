import Link from 'next/link';
import type { ReactNode } from 'react';

export type BreadcrumbItem = { href?: string; label: ReactNode };

export function Breadcrumb({ items, label = 'Breadcrumb' }: { items: BreadcrumbItem[]; label?: string }) {
  return <nav className="breadcrumb" aria-label={label}><ol>{items.map((item, index) => { const current = index === items.length - 1; return <li key={index}>{index > 0 ? <span className="breadcrumb__separator" aria-hidden="true">/</span> : null}{item.href && !current ? <Link href={item.href}>{item.label}</Link> : <span aria-current={current ? 'page' : undefined}>{item.label}</span>}</li>; })}</ol></nav>;
}
