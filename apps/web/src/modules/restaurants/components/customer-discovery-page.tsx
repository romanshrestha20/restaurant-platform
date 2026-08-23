'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button, ErrorState, PageSkeleton } from '@/components/ui';
import { CustomerNavigation } from '@/components/customer';
import { customerRestaurantService } from '../services/customer-restaurant.service';
import type { CustomerRestaurant } from '../types/customer-restaurant.types';

export function CustomerDiscoveryPage() {
  const [restaurants, setRestaurants] = useState<CustomerRestaurant[]>([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = (selectedLocation = location) => {
    setStatus('loading');
    void customerRestaurantService.list(selectedLocation ?? undefined).then((items) => { setRestaurants(items); setStatus('ready'); }).catch(() => setStatus('error'));
  };
  useEffect(load, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { const next = { latitude: coords.latitude, longitude: coords.longitude }; setLocation(next); setLocationStatus('ready'); load(next); },
      () => setLocationStatus('error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return restaurants;
    return restaurants.filter((restaurant) => `${restaurant.name} ${restaurant.description ?? ''} ${restaurant.addresses[0]?.city ?? ''}`.toLowerCase().includes(normalized));
  }, [query, restaurants]);

  if (status === 'loading') return <PageSkeleton className="discovery-page" />;
  if (status === 'error') return <ErrorState title="Restaurants unavailable" description="We could not load places accepting orders right now." action={<Button onClick={() => load()}>Try again</Button>} />;

  return (
    <main className="discovery-page">
      <header className="discovery-hero">
        <CustomerNavigation />
        <div className="discovery-hero__content"><p>Good food, close by</p><h1>Choose where<br />to eat tonight.</h1><span>Browse menus from restaurants currently taking orders.</span></div>
      </header>
      <section className="discovery-content" aria-labelledby="restaurant-list-heading">
        <div className="discovery-toolbar"><div><p className="eyebrow">Open for orders</p><h2 id="restaurant-list-heading">Restaurants</h2></div><div className="discovery-actions"><label className="discovery-search"><span>Search restaurants</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or city" /></label><button className="discovery-location-button" type="button" onClick={useCurrentLocation}>{locationStatus === 'loading' ? 'Finding you…' : location ? 'Showing nearby' : 'Use my location'}</button></div></div>
        {locationStatus === 'error' ? <p className="discovery-location-error">Location access was unavailable. You can still browse all restaurants.</p> : null}
        {!visible.length ? <div className="discovery-empty"><h3>{location ? 'Nothing nearby' : 'No matches'}</h3><p>{location ? 'No restaurants currently deliver within 5 km of this location.' : 'Try another restaurant name or city.'}</p></div> : <div className="discovery-list">{visible.map((restaurant, index) => { const cover = restaurant.media.find((item) => item.type === 'COVER'); const location = restaurant.addresses[0]; return <Link className="discovery-row" href={`/order/${restaurant.slug}`} key={restaurant.id} style={{ animationDelay: `${index * 60}ms` }}><span className="discovery-row__image">{cover ? <img src={cover.media.url} alt={cover.alt ?? restaurant.name} /> : <i>{restaurant.name.charAt(0)}</i>}</span><span className="discovery-row__copy"><small>{location ? `${location.city}, ${location.country}` : 'Online ordering'}</small><strong>{restaurant.name}</strong><span>{restaurant.description || 'Explore the menu and order freshly prepared food.'}</span></span><span className="discovery-row__meta"><b>{restaurant.distanceKm !== null ? `${restaurant.distanceKm} km away` : `${restaurant.settings?.estimatedPrepMinutes ?? 30} min`}</b><small>{restaurant.itemCount} menu items</small></span><span className="discovery-row__arrow" aria-hidden="true">↗</span></Link>; })}</div>}
      </section>
    </main>
  );
}
