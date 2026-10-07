import { Separator } from '@restaurant/ui';
import { formatMoney } from '@/features/menu/components/menu-item-card';
import type { Order } from '../types';

/** Line items and totals as charged, read from the order's checkout snapshot. */
export function OrderSummary({ order }: { order: Order }) {
  const currency = order.restaurant.currency;
  const deliveryFee = Number(order.restaurantSnapshot?.delivery?.fee ?? 0);

  return (
    <>
      <ul className="space-y-4 text-sm">
        {order.items.map((item) => {
          const options = [
            ...item.variantOptions.map((option) => (option.variantName ? `${option.variantName}: ${option.name}` : option.name)),
            ...item.addOns.map((addOn) => `${addOn.quantity > 1 ? `${addOn.quantity}× ` : ''}${addOn.name}`),
          ];
          return (
            <li key={item.id} className="flex justify-between gap-4">
              <div>
                <p><span className="font-semibold">{item.quantity}×</span> {item.name}</p>
                {options.length > 0 && <p className="text-muted-foreground">{options.join(' · ')}</p>}
              </div>
              <span className="shrink-0">{formatMoney(item.totalPrice, currency)}</span>
            </li>
          );
        })}
      </ul>

      <Separator className="my-6" />

      <dl className="space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(order.subtotal, currency)} />
        {Number(order.discount) > 0 && <Row label="Discount" value={`−${formatMoney(order.discount, currency)}`} />}
        <Row label="Tax" value={formatMoney(order.tax, currency)} />
        {deliveryFee > 0 && <Row label="Delivery" value={formatMoney(deliveryFee, currency)} />}
        {Number(order.tip) > 0 && <Row label="Tip" value={formatMoney(order.tip, currency)} />}
        <div className="flex justify-between pt-2 text-lg font-black"><dt>Total</dt><dd>{formatMoney(order.total, currency)}</dd></div>
      </dl>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt>{label}</dt><dd>{value}</dd></div>;
}
