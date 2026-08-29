"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, ErrorState, PageSkeleton } from "@/components/ui";
import { CustomerNavigation } from "@/components/customer";
import { customerOrderService } from "../services/customer-order.service";
import type { CustomerOrder, OrderStatus } from "../types/customer-order.types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending Confirmation",
  CONFIRMED: "Order Confirmed",
  PREPARING: "Kitchen Preparing",
  READY: "Ready for delivery/pickup",
  SERVED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "info",
  READY: "success",
  SERVED: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

const PAST_STATUSES: OrderStatus[] = ["COMPLETED", "CANCELLED", "REFUNDED"];
type OrderFilter = "all" | "active" | "past";

const formatOrderDate = (order: CustomerOrder) => {
  const value =
    order.createdAt ||
    (order as CustomerOrder & { placedAt?: string }).placedAt;
  return new Date(value || Date.now()).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function OrderCard({ order }: { order: CustomerOrder }) {
  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: order.currency || order.restaurant?.currency || "EUR",
  });
  const isActive = !PAST_STATUSES.includes(order.status);
  const itemCount = order.items?.length || 1;

  return (
    <li className="tf-order-item">
      <Link
        className={`tf-order-card ${isActive ? "is-active-order" : ""}`}
        href={`/orders/${order.id}`}
      >
        <div className="tf-order-card__header">
          <span className="tf-order-card__number">
            Order #{order.orderNumber}
          </span>
          <span className={`tf-order-badge is-${STATUS_TONE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="tf-order-card__title-row">
          <h3 className="tf-order-card__restaurant">
            {order.restaurant?.name || "Restaurant"}
          </h3>
          <strong className="tf-order-card__total">
            {money.format(Number(order.total))}
          </strong>
        </div>
        <p className="tf-order-card__items">
          {order.items
            ?.slice(0, 3)
            .map((item) => `${item.quantity}× ${item.name}`)
            .join(" · ") || "Order items"}
          {(order.items?.length || 0) > 3
            ? ` · +${order.items.length - 3} more`
            : ""}
        </p>
        <div className="tf-order-card__meta">
          <span>
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="tf-dot">·</span>
          <span>
            {order.type?.replace("_", " ").toLowerCase() || "delivery"}
          </span>
          <span className="tf-dot">·</span>
        </div>
        <div className="tf-order-card__footer">
          <time dateTime={order.createdAt}>{formatOrderDate(order)}</time>
          <span className="tf-order-view-link">
            {isActive ? "View tracking details" : "View order details"} →
          </span>
        </div>
      </Link>
    </li>
  );
}

export function OrdersPage() {
  const pathname = usePathname();
  const isAccountRoute = pathname.startsWith("/account/");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [filter, setFilter] = useState<OrderFilter>("all");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await customerOrderService.listOrders();
      setOrders(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { activeOrders, pastOrders } = useMemo(
    () => ({
      activeOrders: orders.filter(
        (order) => !PAST_STATUSES.includes(order.status),
      ),
      pastOrders: orders.filter((order) =>
        PAST_STATUSES.includes(order.status),
      ),
    }),
    [orders],
  );

  const sections =
    filter === "active"
      ? [{ title: "Active orders", items: activeOrders }]
      : filter === "past"
        ? [{ title: "Past orders", items: pastOrders }]
        : [
            { title: "Active orders", items: activeOrders },
            { title: "Past orders", items: pastOrders },
          ];

  if (status === "loading") return <PageSkeleton className="orders-loading" />;

  const content = (
    <div className="tf-orders-page-content">
      <header className="tf-orders-header">
        <span className="tf-hero-eyebrow">YOUR ACCOUNT</span>
        <h1 className="tf-orders-title">Your order history</h1>
        <p className="tf-orders-subtitle">
          A record of the meals you loved, plus anything still on its way.
        </p>
        <div
          className="tf-order-filters"
          role="group"
          aria-label="Filter orders"
        >
          {(["all", "active", "past"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={filter === option ? "is-active" : ""}
              onClick={() => setFilter(option)}
            >
              {option === "all"
                ? "All orders"
                : option === "active"
                  ? "Active"
                  : "Past"}
              <span>
                {option === "all"
                  ? orders.length
                  : option === "active"
                    ? activeOrders.length
                    : pastOrders.length}
              </span>
            </button>
          ))}
        </div>
      </header>

      {status === "error" ? (
        <ErrorState
          title="Could not load orders"
          description="We were unable to retrieve your order history."
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      ) : !orders.length ? (
        <div className="tf-orders-empty">
          <div className="tf-orders-empty-icon">🧾</div>
          <h2>No orders placed yet</h2>
          <p>
            When you place an order with any restaurant, you can track it in
            real time here.
          </p>
          <Link className="tf-btn-primary" href="/restaurants">
            Browse restaurants
          </Link>
        </div>
      ) : sections.every((section) => section.items.length === 0) ? (
        <div className="tf-orders-empty tf-orders-empty--filtered">
          <div className="tf-orders-empty-icon">⌁</div>
          <h2>No {filter} orders</h2>
          <p>
            {filter === "active"
              ? "Your active orders will appear here while they are being prepared."
              : "Completed orders will appear here after you place one."}
          </p>
        </div>
      ) : (
        <div className="tf-orders-sections">
          {sections.map((section) =>
            section.items.length ? (
              <section
                key={section.title}
                aria-labelledby={section.title.replace(" ", "-").toLowerCase()}
              >
                <h2
                  id={section.title.replace(" ", "-").toLowerCase()}
                  className="tf-orders-section-title"
                >
                  {section.title}
                  <span>{section.items.length}</span>
                </h2>
                <ul className="tf-orders-list" aria-label={section.title}>
                  {section.items.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}
    </div>
  );

  if (isAccountRoute) return content;

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation />
          {content}
        </main>
      </div>
    </div>
  );
}
