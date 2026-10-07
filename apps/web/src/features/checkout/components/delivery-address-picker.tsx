'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Skeleton } from '@restaurant/ui';
import { useAddresses, useAddressSearch, useCreateAddress } from '@/features/account/hooks/use-addresses';
import type { Address, AddressSearchResult } from '@/features/account/types';
import { isApiError } from '@/lib/api/errors';

const SEARCH_DEBOUNCE_MS = 600;

/** The customer's explicit choice wins; otherwise the default address, then the first one. */
export function resolveDeliveryAddressId(addresses: Address[] | undefined, chosenId: string | null): string | null {
  if (!addresses?.length) return null;
  if (chosenId && addresses.some((address) => address.id === chosenId)) return chosenId;
  return (addresses.find((address) => address.isDefault) ?? addresses[0])!.id;
}

interface DeliveryAddressPickerProps {
  /** Already resolved with resolveDeliveryAddressId. */
  selectedAddressId: string | null;
  onSelect: (addressId: string) => void;
}

export function DeliveryAddressPicker({ selectedAddressId, onSelect }: DeliveryAddressPickerProps) {
  const addressesQuery = useAddresses();
  const addresses = addressesQuery.data ?? [];
  const [isAdding, setIsAdding] = useState(false);

  if (addressesQuery.isLoading) {
    return <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>;
  }

  if (addressesQuery.isError) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        We could not load your saved addresses.{' '}
        <button type="button" className="font-semibold underline" onClick={() => void addressesQuery.refetch()}>Try again</button>
      </div>
    );
  }

  const showForm = isAdding || addresses.length === 0;

  return (
    <div className="space-y-3">
      {addresses.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="sr-only">Saved addresses</legend>
          {addresses.map((address) => (
            <AddressOption
              key={address.id}
              address={address}
              checked={address.id === selectedAddressId}
              onChange={() => onSelect(address.id)}
            />
          ))}
        </fieldset>
      )}

      {showForm ? (
        <NewAddressForm
          canCancel={addresses.length > 0}
          onCancel={() => setIsAdding(false)}
          onCreated={(address) => {
            setIsAdding(false);
            onSelect(address.id);
          }}
        />
      ) : (
        <Button type="button" variant="outline" onClick={() => setIsAdding(true)}>Add a new address</Button>
      )}
    </div>
  );
}

function AddressOption({ address, checked, onChange }: { address: Address; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
      <input type="radio" name="delivery-address" className="mt-1 accent-primary" checked={checked} onChange={onChange} />
      <span className="text-sm">
        <span className="font-semibold">{address.label}</span>
        <span className="block text-muted-foreground">{address.street}, {address.postalCode} {address.city}</span>
      </span>
    </label>
  );
}

function NewAddressForm({ canCancel, onCancel, onCreated }: { canCancel: boolean; onCancel: () => void; onCreated: (address: Address) => void }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [label, setLabel] = useState('Home');
  const [selected, setSelected] = useState<AddressSearchResult | null>(null);
  const searchQuery = useAddressSearch(debouncedQuery);
  const createAddress = useCreateAddress();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  // The API requires a street, postcode and an ISO country code.
  const isComplete = Boolean(selected?.street && selected.postalCode && selected.city && selected.country.length === 2);

  const save = () => {
    if (!selected || !isComplete) return;
    createAddress.mutate(
      {
        label: label.trim() || 'Home',
        street: selected.street,
        city: selected.city,
        postalCode: selected.postalCode,
        country: selected.country,
        latitude: selected.latitude,
        longitude: selected.longitude,
      },
      { onSuccess: onCreated },
    );
  };

  const results = searchQuery.data ?? [];

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <label htmlFor="address-search" className="text-sm font-semibold">Find your address</label>
        <Input
          id="address-search"
          className="mt-2"
          placeholder="Street and house number, city"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
          }}
        />
      </div>

      {searchQuery.isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}
      {searchQuery.isError && <p className="text-sm text-destructive">Address search is unavailable right now.</p>}
      {!searchQuery.isFetching && debouncedQuery.trim().length >= 3 && results.length === 0 && !searchQuery.isError && (
        <p className="text-sm text-muted-foreground">No matching addresses. Try adding the city.</p>
      )}

      {results.length > 0 && !selected && (
        <ul className="divide-y divide-border rounded-xl border border-border" aria-label="Address suggestions">
          {results.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button type="button" className="w-full px-4 py-3 text-left text-sm hover:bg-muted" onClick={() => setSelected(result)}>
                {result.formattedAddress}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="font-semibold">{selected.street || 'Street missing'}</p>
          <p className="text-muted-foreground">{selected.postalCode} {selected.city} {selected.country}</p>
          {!isComplete && <p className="mt-2 text-destructive">This match is missing a street number, postcode or city. Search for a more specific address.</p>}
        </div>
      )}

      <div>
        <label htmlFor="address-label" className="text-sm font-semibold">Label</label>
        <Input id="address-label" className="mt-2" maxLength={30} value={label} onChange={(event) => setLabel(event.target.value)} />
      </div>

      {createAddress.isError && (
        <p role="alert" className="text-sm text-destructive">
          {isApiError(createAddress.error) && createAddress.error.statusCode === 400
            ? createAddress.error.messages[0]
            : 'We could not save this address. Please try again.'}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" disabled={!isComplete} isLoading={createAddress.isPending} onClick={save}>Use this address</Button>
        {canCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}
