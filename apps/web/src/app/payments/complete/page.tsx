'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CustomerNavigation } from '@/components/customer';

export default function PaymentCompletePage() {
  const params = useSearchParams();
  const status = params.get('redirect_status');
  const succeeded = status === 'succeeded';

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation />
          <div className="tf-payment-complete-page">
            <Link className="tf-checkout-back-link" href="/orders">← Back to my orders</Link>
            <section className={`tf-payment-complete-panel ${succeeded ? 'is-success' : 'is-error'}`}>
              <span className="tf-payment-complete-mark" aria-hidden="true">{succeeded ? '✓' : '!'}</span>
              <span className="tf-hero-eyebrow">PAYMENT</span>
              <h1>{succeeded ? 'Payment received' : 'Payment needs attention'}</h1>
              <p>
                {succeeded
                  ? 'Your payment was received. Your order will appear as confirmed once the provider webhook is processed.'
                  : 'We could not confirm the payment. Return to your orders and try again.'}
              </p>
              <Link className="tf-btn-primary" href="/orders">View my orders</Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
