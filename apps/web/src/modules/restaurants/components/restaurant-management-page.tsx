'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  FormField,
  Input,
  LoadingButton,
  Modal,
  Select,
  SectionHeader,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { restaurantService } from '../services/restaurant.service';
import type {
  DayOfWeek,
  OpeningHour,
  RestaurantAddress,
  RestaurantAddressInput,
  RestaurantManagement,
  UpdateRestaurantInput,
} from '../types/restaurant.types';
import { RestaurantAvatar } from './restaurant-avatar';

export type RestaurantManagementSection =
  'overview' | 'general' | 'hours' | 'locations' | 'brand' | 'settings';

const days: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const dayLabels: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const getError = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.messages.join(' ') : fallback;

export function RestaurantManagementPage({
  restaurantId,
  section = 'overview',
}: {
  restaurantId: string;
  section?: RestaurantManagementSection;
}) {
  const [restaurant, setRestaurant] = useState<RestaurantManagement | null>(
    null,
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setRestaurant(await restaurantService.get(restaurantId));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [restaurantId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="restaurant-management restaurant-management--loading">
        <Skeleton className="restaurant-management__cover-skeleton" />
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--line" />
      </div>
    );
  }

  if (status === 'error' || !restaurant) {
    return (
      <div className="restaurant-management restaurant-management--error">
        <Alert>We could not load this restaurant workspace.</Alert>
        <Button onClick={() => void load().catch(() => undefined)}>
          Try again
        </Button>
      </div>
    );
  }

  const canEdit =
    restaurant.callerRole === 'OWNER' || restaurant.callerRole === 'MANAGER';
  const cover = restaurant.media.find((item) => item.type === 'COVER');
  const logo = restaurant.media.find((item) => item.type === 'LOGO');

  return (
    <div className="restaurant-management">
      {section === 'overview' ? (
        <>
          <header
            className="restaurant-venue-header"
            style={
              cover ? { backgroundImage: `url(${cover.media.url})` } : undefined
            }
          >
            <div className="restaurant-venue-header__shade" />
            <div className="restaurant-venue-header__identity">
              <RestaurantAvatar
                className="restaurant-venue-header__logo"
                logoUrl={logo?.media.url}
                name={restaurant.name}
                size="xl"
              />
              <div>
                <div className="restaurant-venue-header__meta">
                  <Badge
                    tone={
                      restaurant.status === 'ACTIVE' ? 'success' : 'warning'
                    }
                  >
                    {restaurant.status.toLowerCase()}
                  </Badge>
                  <span>{restaurant.callerRole.toLowerCase()}</span>
                </div>
                <h1>{restaurant.name}</h1>
                <p>/{restaurant.slug}</p>
              </div>
            </div>
          </header>
          <WorkspaceOverview restaurant={restaurant} />
        </>
      ) : null}

      {section === 'general' ? (
        <OverviewPanel
          canEdit={canEdit}
          restaurant={restaurant}
          onChange={setRestaurant}
        />
      ) : null}
      {section === 'hours' ? (
        <HoursPanel
          canEdit={canEdit}
          restaurant={restaurant}
          onChange={(openingHours) =>
            setRestaurant((current) =>
              current ? { ...current, openingHours } : current,
            )
          }
        />
      ) : null}
      {section === 'locations' ? (
        <LocationsPanel
          canEdit={canEdit}
          restaurant={restaurant}
          onChange={(addresses) =>
            setRestaurant((current) =>
              current ? { ...current, addresses } : current,
            )
          }
        />
      ) : null}
      {section === 'brand' ? (
        <BrandPanel
          canEdit={canEdit}
          restaurant={restaurant}
          onRefresh={load}
        />
      ) : null}
      {section === 'settings' ? (
        <SettingsPanel restaurant={restaurant} />
      ) : null}
      {!canEdit && section !== 'overview' && section !== 'settings' ? (
        <p className="restaurant-management__readonly-banner">
          Your {restaurant.callerRole.toLowerCase()} role has read-only access.
        </p>
      ) : null}
    </div>
  );
}

function WorkspaceOverview({
  restaurant,
}: {
  restaurant: RestaurantManagement;
}) {
  const primaryAddress =
    restaurant.addresses.find((address) => address.isPrimary) ??
    restaurant.addresses[0];
  const configuredDays = restaurant.openingHours.filter(
    (hours) => !hours.isClosed,
  ).length;

  return (
    <section className="workspace-overview">
      <header>
        <p className="eyebrow">Workspace overview</p>
        <h2>Ready for service</h2>
        <p>Current identity and operating configuration for this restaurant.</p>
      </header>
      <dl className="workspace-overview__facts">
        <div>
          <dt>Primary location</dt>
          <dd>{primaryAddress ? primaryAddress.city : 'Not configured'}</dd>
          <small>
            {primaryAddress?.street ?? 'Add a customer-facing address'}
          </small>
        </div>
        <div>
          <dt>Service week</dt>
          <dd>{configuredDays} open days</dd>
          <small>{restaurant.timezone}</small>
        </div>
        <div>
          <dt>Orders</dt>
          <dd>{restaurant.settings?.acceptsOrders ? 'Accepting' : 'Paused'}</dd>
          <small>
            {restaurant.settings?.estimatedPrepMinutes ?? 0} min preparation
          </small>
        </div>
        <div>
          <dt>Reservations</dt>
          <dd>
            {restaurant.settings?.acceptsReservations ? 'Accepting' : 'Paused'}
          </dd>
          <small>
            {restaurant.addresses.length} active location
            {restaurant.addresses.length === 1 ? '' : 's'}
          </small>
        </div>
      </dl>
    </section>
  );
}

function OverviewPanel({
  canEdit,
  onChange,
  restaurant,
}: {
  canEdit: boolean;
  onChange: (restaurant: RestaurantManagement) => void;
  restaurant: RestaurantManagement;
}) {
  const [form, setForm] = useState<UpdateRestaurantInput>({
    name: restaurant.name,
    description: restaurant.description ?? '',
    email: restaurant.email ?? '',
    phone: restaurant.phone ?? '',
    currency: restaurant.currency,
    timezone: restaurant.timezone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const update = (key: keyof UpdateRestaurantInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await restaurantService.update(restaurant.id, {
        ...form,
        description: String(form.description ?? '').trim() || null,
        email: String(form.email ?? '').trim() || null,
        phone: String(form.phone ?? '').trim() || null,
      });
      onChange(updated);
      toast.success('Restaurant details saved');
    } catch (caught) {
      setError(getError(caught, 'Could not save restaurant details.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="restaurant-panel">
      <SectionHeader
        className="restaurant-panel-heading"
        description="Public identity, contact information, and operating locale."
        title="Restaurant details"
      />
      <form className="restaurant-detail-form" onSubmit={save}>
        {error ? <Alert>{error}</Alert> : null}
        <div className="field-grid">
          <FormField htmlFor="manage-name" label="Name">
            <Input
              disabled={!canEdit}
              id="manage-name"
              minLength={2}
              required
              value={String(form.name ?? '')}
              onChange={(event) => update('name', event.target.value)}
            />
          </FormField>
          <FormField
            htmlFor="manage-slug"
            label="Public URL"
            hint="fixed after setup"
          >
            <Input id="manage-slug" readOnly value={`/${restaurant.slug}`} />
          </FormField>
          <FormField fullWidth htmlFor="manage-description" label="Description">
            <Textarea
              disabled={!canEdit}
              id="manage-description"
              maxLength={2000}
              value={String(form.description ?? '')}
              onChange={(event) => update('description', event.target.value)}
            />
          </FormField>
          <FormField htmlFor="manage-email" label="Contact email">
            <Input
              disabled={!canEdit}
              id="manage-email"
              type="email"
              value={String(form.email ?? '')}
              onChange={(event) => update('email', event.target.value)}
            />
          </FormField>
          <FormField htmlFor="manage-phone" label="Contact phone">
            <Input
              disabled={!canEdit}
              id="manage-phone"
              placeholder="+358401234567"
              value={String(form.phone ?? '')}
              onChange={(event) => update('phone', event.target.value)}
            />
          </FormField>
          <FormField htmlFor="manage-currency" label="Currency">
            <Select
              disabled={!canEdit}
              id="manage-currency"
              value={String(form.currency ?? '')}
              onChange={(event) => update('currency', event.target.value)}
            >
              {['EUR', 'USD', 'GBP', 'SEK', 'NOK'].map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField htmlFor="manage-timezone" label="Timezone">
            <Input
              disabled={!canEdit}
              id="manage-timezone"
              value={String(form.timezone ?? '')}
              onChange={(event) => update('timezone', event.target.value)}
            />
          </FormField>
        </div>
        {canEdit ? (
          <div className="restaurant-panel__actions">
            <LoadingButton loading={saving} loadingText="Saving…" type="submit">
              Save details
            </LoadingButton>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function SettingsPanel({ restaurant }: { restaurant: RestaurantManagement }) {
  return (
    <section className="restaurant-panel">
      <SectionHeader
        className="restaurant-panel-heading"
        description="Current defaults used by future ordering and reservation modules."
        title="Settings"
      />
      <OperationalSettings restaurant={restaurant} />
      <p className="restaurant-settings-note">
        Settings are read-only until the restaurant settings API is available.
      </p>
    </section>
  );
}

function OperationalSettings({
  restaurant,
}: {
  restaurant: RestaurantManagement;
}) {
  const settings = restaurant.settings;
  if (!settings) return null;
  const facts = [
    ['Orders', settings.acceptsOrders ? 'Accepted' : 'Paused'],
    ['Reservations', settings.acceptsReservations ? 'Accepted' : 'Paused'],
    ['Preparation', `${settings.estimatedPrepMinutes} min`],
    ['Minimum order', `${settings.minimumOrder} ${restaurant.currency}`],
    ['Delivery fee', `${settings.deliveryFee} ${restaurant.currency}`],
    ['Tax rate', `${settings.taxRate}%`],
  ];
  return (
    <div className="restaurant-operations">
      <div>
        <h3>Operating defaults</h3>
        <p>Configured values currently used by the restaurant.</p>
      </div>
      <dl>
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function normalizedHours(openingHours: OpeningHour[]): OpeningHour[] {
  return days.map((day) => {
    const existing = openingHours.find((hours) => hours.day === day);
    return (
      existing ?? {
        day,
        isClosed: false,
        opensAt: '09:00',
        closesAt: '22:00',
      }
    );
  });
}

function HoursPanel({
  canEdit,
  onChange,
  restaurant,
}: {
  canEdit: boolean;
  onChange: (hours: OpeningHour[]) => void;
  restaurant: RestaurantManagement;
}) {
  const [hours, setHours] = useState(() =>
    normalizedHours(restaurant.openingHours),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const update = (day: DayOfWeek, patch: Partial<OpeningHour>) => {
    setHours((current) =>
      current.map((item) => (item.day === day ? { ...item, ...patch } : item)),
    );
    setError('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = hours.map(({ day, isClosed, opensAt, closesAt }) => ({
        day,
        isClosed,
        opensAt: isClosed ? null : opensAt,
        closesAt: isClosed ? null : closesAt,
      }));
      const result = await restaurantService.replaceOpeningHours(
        restaurant.id,
        payload,
      );
      setHours(normalizedHours(result.openingHours));
      onChange(result.openingHours);
      toast.success('Opening hours saved');
    } catch (caught) {
      setError(getError(caught, 'Could not save opening hours.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="restaurant-panel">
      <SectionHeader
        className="restaurant-panel-heading"
        description={`Times are interpreted in ${restaurant.timezone}.`}
        title="Opening hours"
      />
      {error ? <Alert>{error}</Alert> : null}
      <div className="restaurant-hours">
        {hours.map((item) => (
          <div className="restaurant-hours__row" key={item.day}>
            <strong>{dayLabels[item.day]}</strong>
            <Checkbox
              checked={item.isClosed}
              disabled={!canEdit}
              label="Closed"
              onChange={(event) =>
                update(item.day, {
                  isClosed: event.target.checked,
                  ...(event.target.checked
                    ? { opensAt: null, closesAt: null }
                    : { opensAt: '09:00', closesAt: '22:00' }),
                })
              }
            />
            <div className="restaurant-hours__times">
              <Input
                aria-label={`${dayLabels[item.day]} opening time`}
                disabled={!canEdit || item.isClosed}
                type="time"
                value={item.opensAt ?? ''}
                onChange={(event) =>
                  update(item.day, { opensAt: event.target.value })
                }
              />
              <span>to</span>
              <Input
                aria-label={`${dayLabels[item.day]} closing time`}
                disabled={!canEdit || item.isClosed}
                type="time"
                value={item.closesAt ?? ''}
                onChange={(event) =>
                  update(item.day, { closesAt: event.target.value })
                }
              />
            </div>
          </div>
        ))}
      </div>
      {canEdit ? (
        <div className="restaurant-panel__actions">
          <LoadingButton loading={saving} loadingText="Saving…" onClick={save}>
            Save hours
          </LoadingButton>
        </div>
      ) : null}
    </section>
  );
}

const emptyAddress: RestaurantAddressInput = {
  label: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'FI',
  isPrimary: false,
};

function LocationsPanel({
  canEdit,
  onChange,
  restaurant,
}: {
  canEdit: boolean;
  onChange: (addresses: RestaurantAddress[]) => void;
  restaurant: RestaurantManagement;
}) {
  const [editing, setEditing] = useState<RestaurantAddress | 'new' | null>(
    null,
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const toast = useToast();

  const reload = async () => {
    onChange(await restaurantService.listAddresses(restaurant.id));
  };

  const remove = async (address: RestaurantAddress) => {
    if (!window.confirm(`Remove ${address.label}?`)) return;
    setDeleting(address.id);
    try {
      await restaurantService.removeAddress(restaurant.id, address.id);
      await reload();
      toast.success('Address removed');
    } catch (error) {
      toast.error('Could not remove address', {
        description: getError(error, 'Please try again.'),
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="restaurant-panel">
      <SectionHeader
        className="restaurant-panel-heading"
        description="Service locations and the primary customer-facing address."
        title="Locations"
      />
      <div className="restaurant-addresses">
        {restaurant.addresses.map((address) => (
          <article className="restaurant-address" key={address.id}>
            <div className="restaurant-address__index" aria-hidden="true">
              {String(restaurant.addresses.indexOf(address) + 1).padStart(
                2,
                '0',
              )}
            </div>
            <div>
              <div className="restaurant-address__title">
                <h3>{address.label}</h3>
                {address.isPrimary ? (
                  <Badge tone="accent">Primary</Badge>
                ) : null}
              </div>
              <address>
                {address.street}
                <br />
                {[address.postalCode, address.city].filter(Boolean).join(' ')}
                {address.state ? `, ${address.state}` : ''}
                <br />
                {address.country}
              </address>
            </div>
            {canEdit ? (
              <div className="restaurant-address__actions">
                <Button variant="ghost" onClick={() => setEditing(address)}>
                  Edit
                </Button>
                <Button
                  disabled={deleting === address.id}
                  variant="ghost"
                  onClick={() => void remove(address)}
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {canEdit ? (
        <div className="restaurant-panel__actions restaurant-panel__actions--start">
          <Button variant="secondary" onClick={() => setEditing('new')}>
            Add location
          </Button>
        </div>
      ) : null}

      <AddressModal
        address={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          await reload();
          setEditing(null);
        }}
        open={editing !== null}
        restaurantId={restaurant.id}
      />
    </section>
  );
}

function AddressModal({
  address,
  onClose,
  onSaved,
  open,
  restaurantId,
}: {
  address: RestaurantAddress | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  open: boolean;
  restaurantId: string;
}) {
  const [form, setForm] = useState<RestaurantAddressInput>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      address
        ? {
            label: address.label,
            street: address.street,
            city: address.city,
            state: address.state ?? '',
            postalCode: address.postalCode ?? '',
            country: address.country,
            isPrimary: address.isPrimary,
          }
        : emptyAddress,
    );
    setError('');
  }, [address, open]);

  const update = (key: keyof RestaurantAddressInput, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const input = {
      ...form,
      state: form.state?.trim() || null,
      postalCode: form.postalCode?.trim() || null,
      country: form.country.toUpperCase(),
    };
    try {
      if (address) {
        await restaurantService.updateAddress(restaurantId, address.id, input);
      } else {
        await restaurantService.addAddress(restaurantId, input);
      }
      await onSaved();
    } catch (caught) {
      setError(getError(caught, 'Could not save this address.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      description="Use an ISO two-letter country code, such as FI or SE."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            form="restaurant-address-form"
            loading={saving}
            loadingText="Saving…"
            type="submit"
          >
            Save location
          </LoadingButton>
        </>
      }
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
      title={address ? 'Edit location' : 'Add location'}
    >
      <form
        className="ui-form ui-form--md"
        id="restaurant-address-form"
        onSubmit={submit}
      >
        {error ? <Alert>{error}</Alert> : null}
        <FormField htmlFor="location-label" label="Label">
          <Input
            id="location-label"
            required
            value={form.label}
            onChange={(event) => update('label', event.target.value)}
          />
        </FormField>
        <FormField htmlFor="location-street" label="Street address">
          <Input
            id="location-street"
            required
            value={form.street}
            onChange={(event) => update('street', event.target.value)}
          />
        </FormField>
        <div className="field-grid">
          <FormField htmlFor="location-city" label="City">
            <Input
              id="location-city"
              required
              value={form.city}
              onChange={(event) => update('city', event.target.value)}
            />
          </FormField>
          <FormField htmlFor="location-region" label="State or region">
            <Input
              id="location-region"
              value={form.state ?? ''}
              onChange={(event) => update('state', event.target.value)}
            />
          </FormField>
          <FormField htmlFor="location-postal" label="Postal code">
            <Input
              id="location-postal"
              value={form.postalCode ?? ''}
              onChange={(event) => update('postalCode', event.target.value)}
            />
          </FormField>
          <FormField htmlFor="location-country" label="Country">
            <Input
              id="location-country"
              maxLength={2}
              required
              value={form.country}
              onChange={(event) => update('country', event.target.value)}
            />
          </FormField>
        </div>
        <Checkbox
          checked={form.isPrimary}
          disabled={address?.isPrimary}
          label="Use as the primary address"
          onChange={(event) => update('isPrimary', event.target.checked)}
        />
      </form>
    </Modal>
  );
}

function BrandPanel({
  canEdit,
  onRefresh,
  restaurant,
}: {
  canEdit: boolean;
  onRefresh: () => Promise<void>;
  restaurant: RestaurantManagement;
}) {
  const [busy, setBusy] = useState<'logo' | 'cover' | null>(null);
  const toast = useToast();
  const logo = restaurant.media.find((item) => item.type === 'LOGO');
  const cover = restaurant.media.find((item) => item.type === 'COVER');

  const upload = async (
    type: 'logo' | 'cover',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Unsupported image', {
        description: 'Choose JPEG, PNG, or WebP.',
      });
      return;
    }
    if (file.size > 5_000_000) {
      toast.error('Image is too large', {
        description: 'Choose an image under 5 MB.',
      });
      return;
    }
    setBusy(type);
    try {
      await restaurantService.uploadMedia(restaurant.id, type, file);
      await onRefresh();
      toast.success(`${type === 'logo' ? 'Logo' : 'Cover'} updated`);
    } catch (error) {
      toast.error('Upload failed', {
        description: getError(error, 'Please try again.'),
      });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (type: 'logo' | 'cover') => {
    setBusy(type);
    try {
      await restaurantService.removeMedia(restaurant.id, type);
      await onRefresh();
      toast.success(`${type === 'logo' ? 'Logo' : 'Cover'} removed`);
    } catch (error) {
      toast.error('Could not remove image', {
        description: getError(error, 'Please try again.'),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="restaurant-panel">
      <SectionHeader
        className="restaurant-panel-heading"
        description="Images are cropped automatically for consistent presentation."
        title="Brand media"
      />
      <div className="restaurant-media-editor">
        <article className="restaurant-media-editor__item restaurant-media-editor__item--logo">
          <div className="restaurant-media-editor__preview">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.media.url} alt={`${restaurant.name} logo`} />
            ) : (
              <span>{restaurant.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3>Logo</h3>
            <p>Square image, at least 800 × 800 pixels.</p>
            {canEdit ? (
              <div className="restaurant-media-editor__actions">
                <label className="button button--secondary">
                  {busy === 'logo' ? 'Uploading…' : 'Choose logo'}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="visually-hidden"
                    disabled={busy !== null}
                    type="file"
                    onChange={(event) => void upload('logo', event)}
                  />
                </label>
                {logo ? (
                  <Button
                    disabled={busy !== null}
                    variant="ghost"
                    onClick={() => void remove('logo')}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </article>

        <article className="restaurant-media-editor__item restaurant-media-editor__item--cover">
          <div className="restaurant-media-editor__preview">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.media.url} alt={`${restaurant.name} cover`} />
            ) : (
              <span>Cover</span>
            )}
          </div>
          <div>
            <h3>Cover image</h3>
            <p>Landscape image, ideally 1600 × 900 pixels.</p>
            {canEdit ? (
              <div className="restaurant-media-editor__actions">
                <label className="button button--secondary">
                  {busy === 'cover' ? 'Uploading…' : 'Choose cover'}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="visually-hidden"
                    disabled={busy !== null}
                    type="file"
                    onChange={(event) => void upload('cover', event)}
                  />
                </label>
                {cover ? (
                  <Button
                    disabled={busy !== null}
                    variant="ghost"
                    onClick={() => void remove('cover')}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
