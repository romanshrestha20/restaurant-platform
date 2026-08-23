import Link from 'next/link';
import { CustomerNavigation } from '@/components/customer';

export default function CartPage() {
  return (
    <div className="customer-page">
      <CustomerNavigation />
      <main className="customer-empty-page">
        <p className="eyebrow">Cart</p>
        <h1>Your cart is waiting.</h1>
        <p>Choose a restaurant to start an order. Your selected items will appear here during checkout.</p>
        <Link className="button button--primary" href="/restaurants">Browse restaurants</Link>
      </main>
    </div>
  );
}
