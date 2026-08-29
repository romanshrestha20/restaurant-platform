'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { AccountPlaceholder, AccountSectionPage } from '../_components/account-section-page';
type Reservation = { id: string; guestCount: number; reservationAt: string; status: string; restaurant: { name: string; addresses: Array<{ street: string; city: string }> } };

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { void apiClient.get<Reservation[]>('/reservations').then(setReservations).finally(() => setLoading(false)); }, []);
  const cancel = async (id: string) => { await apiClient.delete(`/reservations/${id}`); setReservations((items) => items.map((item) => item.id === id ? { ...item, status: 'CANCELLED' } : item)); };
  return (
    <AccountSectionPage
      eyebrow="Reservations"
      title="Your reservations"
      description="Keep your upcoming tables and past dining plans in one place."
    >
      {loading ? <p>Loading reservations…</p> : !reservations.length ? <AccountPlaceholder title="No reservations yet" description="Tables you book will appear here with the restaurant, date, time, and guest details." /> : <div className="reservation-list">{reservations.map((reservation) => <article className="reservation-entry" key={reservation.id}><div><p className="eyebrow">{reservation.status}</p><h3>{reservation.restaurant.name}</h3><p>{new Date(reservation.reservationAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · {reservation.guestCount} guests</p><small>{reservation.restaurant.addresses[0]?.street}, {reservation.restaurant.addresses[0]?.city}</small></div>{['PENDING', 'CONFIRMED'].includes(reservation.status) ? <Button variant="ghost" onClick={() => void cancel(reservation.id)}>Cancel</Button> : null}</article>)}</div>}
    </AccountSectionPage>
  );
}
