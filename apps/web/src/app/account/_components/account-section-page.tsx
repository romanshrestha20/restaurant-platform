import Link from 'next/link';
import type { ReactNode } from 'react';

export function AccountSectionPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <section className="account-section-page"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="account-section-page__description">{description}</p><div className="account-section-page__body">{children}</div></section>;
}

export function AccountPlaceholder({ title, description }: { title: string; description: string }) {
  return <div className="account-placeholder"><h3>{title}</h3><p>{description}</p><Link className="button button--secondary" href="/restaurants">Browse restaurants</Link></div>;
}
