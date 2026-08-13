'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import {
  Alert,
  Checkbox,
  FormField,
  Input,
  LoadingButton,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { restaurantService } from '../services/restaurant.service';
import type { DayOfWeek, OpeningHour } from '../types/restaurant.types';

const wizardSteps = [
  'Basic information',
  'Location',
  'Opening hours',
  'Branding',
  'Review',
];
const days: Array<{ day: DayOfWeek; label: string }> = [
  { day: 'MONDAY', label: 'Monday' },
  { day: 'TUESDAY', label: 'Tuesday' },
  { day: 'WEDNESDAY', label: 'Wednesday' },
  { day: 'THURSDAY', label: 'Thursday' },
  { day: 'FRIDAY', label: 'Friday' },
  { day: 'SATURDAY', label: 'Saturday' },
  { day: 'SUNDAY', label: 'Sunday' },
];

type FormState = {
  name: string;
  slug: string;
  description: string;
  email: string;
  phone: string;
  currency: string;
  timezone: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const initialForm: FormState = {
  name: '',
  slug: '',
  description: '',
  email: '',
  phone: '',
  currency: 'EUR',
  timezone: 'Europe/Helsinki',
  label: 'Primary',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'FI',
};

const initialHours: OpeningHour[] = days.map(({ day }) => ({
  day,
  isClosed: day === 'SUNDAY',
  opensAt: day === 'SUNDAY' ? null : '09:00',
  closesAt: day === 'SUNDAY' ? null : '22:00',
}));

export function RestaurantOnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [hours, setHours] = useState(initialHours);
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const suggestedSlug = useMemo(
    () =>
      form.name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    [form.name],
  );

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const updateHours = (day: DayOfWeek, patch: Partial<OpeningHour>) => {
    setHours((current) =>
      current.map((item) => (item.day === day ? { ...item, ...patch } : item)),
    );
  };

  const validateStep = (): string => {
    if (step === 0 && form.name.trim().length < 2)
      return 'Enter a restaurant name.';
    if (
      step === 1 &&
      (!form.street.trim() ||
        !form.city.trim() ||
        form.country.trim().length !== 2)
    ) {
      return 'Enter a street, city, and two-letter country code.';
    }
    if (
      step === 2 &&
      hours.some((item) => !item.isClosed && (!item.opensAt || !item.closesAt))
    ) {
      return 'Every open day needs opening and closing times.';
    }
    return '';
  };

  const advance = () => {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, wizardSteps.length - 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < wizardSteps.length - 1) {
      advance();
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const restaurant = await restaurantService.create({
        name: form.name.trim(),
        ...(form.slug.trim() ? { slug: form.slug.trim().toLowerCase() } : {}),
        description: form.description.trim() || null,
        email: form.email.trim().toLowerCase() || null,
        phone: form.phone.trim() || null,
        currency: form.currency,
        timezone: form.timezone.trim(),
        primaryAddress: {
          label: form.label.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim() || null,
          postalCode: form.postalCode.trim() || null,
          country: form.country.trim().toUpperCase(),
        },
        openingHours: hours.map(({ day, isClosed, opensAt, closesAt }) => ({
          day,
          isClosed,
          opensAt: isClosed ? null : opensAt,
          closesAt: isClosed ? null : closesAt,
        })),
      });

      const uploads: Promise<unknown>[] = [];
      if (logo)
        uploads.push(
          restaurantService.uploadMedia(restaurant.id, 'logo', logo),
        );
      if (cover)
        uploads.push(
          restaurantService.uploadMedia(restaurant.id, 'cover', cover),
        );
      await Promise.all(uploads);
      router.replace(`/restaurants/${restaurant.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.messages.join(' ')
          : 'Could not create the restaurant. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="restaurant-wizard">
      <Link className="restaurant-backlink" href="/restaurants">
        ← Restaurant selector
      </Link>
      <div className="restaurant-wizard__layout">
        <aside className="restaurant-wizard__progress">
          <p className="eyebrow">Create restaurant</p>
          <ol>
            {wizardSteps.map((label, index) => (
              <li
                className={
                  index === step
                    ? 'is-active'
                    : index < step
                      ? 'is-complete'
                      : ''
                }
                key={label}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{label}</strong>
              </li>
            ))}
          </ol>
        </aside>

        <form className="restaurant-wizard__form" onSubmit={submit}>
          <PageHeader
            className="restaurant-wizard__heading"
            description={stepDescription(step)}
            eyebrow={`Step ${step + 1} of ${wizardSteps.length}`}
            title={wizardSteps[step]}
          />
          {error ? <Alert>{error}</Alert> : null}

          {step === 0 ? (
            <div className="restaurant-wizard__fields field-grid">
              <FormField htmlFor="restaurant-name" label="Restaurant name">
                <Input
                  id="restaurant-name"
                  minLength={2}
                  required
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                />
              </FormField>
              <FormField
                htmlFor="restaurant-slug"
                label="Public URL"
                hint={
                  form.slug
                    ? undefined
                    : suggestedSlug || 'generated automatically'
                }
              >
                <Input
                  id="restaurant-slug"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder={suggestedSlug || 'nordic-table'}
                  value={form.slug}
                  onChange={(event) => update('slug', event.target.value)}
                />
              </FormField>
              <FormField
                fullWidth
                htmlFor="restaurant-description"
                label="Description"
              >
                <Textarea
                  id="restaurant-description"
                  maxLength={2000}
                  placeholder="What should guests know about this restaurant?"
                  value={form.description}
                  onChange={(event) =>
                    update('description', event.target.value)
                  }
                />
              </FormField>
              <FormField htmlFor="restaurant-email" label="Contact email">
                <Input
                  id="restaurant-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
              </FormField>
              <FormField htmlFor="restaurant-phone" label="Contact phone">
                <Input
                  id="restaurant-phone"
                  placeholder="+358401234567"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </FormField>
              <FormField htmlFor="restaurant-currency" label="Currency">
                <Select
                  id="restaurant-currency"
                  value={form.currency}
                  onChange={(event) => update('currency', event.target.value)}
                >
                  {['EUR', 'USD', 'GBP', 'SEK', 'NOK'].map((currency) => (
                    <option key={currency}>{currency}</option>
                  ))}
                </Select>
              </FormField>
              <FormField htmlFor="restaurant-timezone" label="Timezone">
                <Input
                  id="restaurant-timezone"
                  required
                  value={form.timezone}
                  onChange={(event) => update('timezone', event.target.value)}
                />
              </FormField>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="restaurant-wizard__fields field-grid">
              <FormField htmlFor="address-label" label="Location label">
                <Input
                  id="address-label"
                  required
                  value={form.label}
                  onChange={(event) => update('label', event.target.value)}
                />
              </FormField>
              <FormField htmlFor="address-street" label="Street address">
                <Input
                  id="address-street"
                  required
                  value={form.street}
                  onChange={(event) => update('street', event.target.value)}
                />
              </FormField>
              <FormField htmlFor="address-city" label="City">
                <Input
                  id="address-city"
                  required
                  value={form.city}
                  onChange={(event) => update('city', event.target.value)}
                />
              </FormField>
              <FormField htmlFor="address-state" label="State or region">
                <Input
                  id="address-state"
                  value={form.state}
                  onChange={(event) => update('state', event.target.value)}
                />
              </FormField>
              <FormField htmlFor="address-postal" label="Postal code">
                <Input
                  id="address-postal"
                  value={form.postalCode}
                  onChange={(event) => update('postalCode', event.target.value)}
                />
              </FormField>
              <FormField htmlFor="address-country" label="Country code">
                <Input
                  id="address-country"
                  maxLength={2}
                  required
                  value={form.country}
                  onChange={(event) => update('country', event.target.value)}
                />
              </FormField>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="restaurant-wizard__hours">
              {hours.map((item) => (
                <div key={item.day}>
                  <strong>
                    {days.find(({ day }) => day === item.day)?.label}
                  </strong>
                  <Checkbox
                    checked={item.isClosed}
                    label="Closed"
                    onChange={(event) =>
                      updateHours(
                        item.day,
                        event.target.checked
                          ? { isClosed: true, opensAt: null, closesAt: null }
                          : {
                              isClosed: false,
                              opensAt: '09:00',
                              closesAt: '22:00',
                            },
                      )
                    }
                  />
                  <Input
                    aria-label={`${item.day} opens`}
                    disabled={item.isClosed}
                    type="time"
                    value={item.opensAt ?? ''}
                    onChange={(event) =>
                      updateHours(item.day, { opensAt: event.target.value })
                    }
                  />
                  <span>to</span>
                  <Input
                    aria-label={`${item.day} closes`}
                    disabled={item.isClosed}
                    type="time"
                    value={item.closesAt ?? ''}
                    onChange={(event) =>
                      updateHours(item.day, { closesAt: event.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="restaurant-wizard__branding">
              <WizardFile
                label="Logo"
                description="Square, at least 800 × 800 pixels"
                file={logo}
                onChange={setLogo}
              />
              <WizardFile
                label="Cover image"
                description="Landscape, ideally 1600 × 900 pixels"
                file={cover}
                onChange={setCover}
              />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="restaurant-wizard__review">
              <ReviewSection
                label="Restaurant"
                value={form.name}
                detail={
                  [form.email, form.phone].filter(Boolean).join(' · ') ||
                  'No contact details'
                }
                onEdit={() => setStep(0)}
              />
              <ReviewSection
                label="Location"
                value={`${form.street}, ${form.city}`}
                detail={`${form.postalCode} ${form.country}`.trim()}
                onEdit={() => setStep(1)}
              />
              <ReviewSection
                label="Opening hours"
                value={`${hours.filter((item) => !item.isClosed).length} open days`}
                detail={form.timezone}
                onEdit={() => setStep(2)}
              />
              <ReviewSection
                label="Branding"
                value={
                  [logo && 'Logo', cover && 'Cover']
                    .filter(Boolean)
                    .join(' and ') || 'No images'
                }
                detail="Can be changed later"
                onEdit={() => setStep(3)}
              />
            </div>
          ) : null}

          <footer className="restaurant-wizard__actions">
            <button
              className="text-button"
              disabled={step === 0 || submitting}
              type="button"
              onClick={() => {
                setError('');
                setStep((current) => current - 1);
              }}
            >
              Back
            </button>
            {step === wizardSteps.length - 1 ? (
              <LoadingButton
                loading={submitting}
                loadingText="Creating workspace…"
                type="submit"
              >
                Create restaurant
              </LoadingButton>
            ) : (
              <button className="button button--primary" type="submit">
                Continue
              </button>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
}

function WizardFile({
  description,
  file,
  label,
  onChange,
}: {
  description: string;
  file: File | null;
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="restaurant-wizard-file">
      <span className="restaurant-wizard-file__mark" aria-hidden="true">
        {file ? '✓' : '+'}
      </span>
      <strong>{label}</strong>
      <small>{file?.name ?? description}</small>
      <input
        className="visually-hidden"
        accept="image/jpeg,image/png,image/webp"
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function ReviewSection({
  detail,
  label,
  onEdit,
  value,
}: {
  detail: string;
  label: string;
  onEdit: () => void;
  value: string;
}) {
  return (
    <section>
      <span>{label}</span>
      <div>
        <strong>{value || 'Not provided'}</strong>
        <small>{detail}</small>
      </div>
      <button className="text-button" type="button" onClick={onEdit}>
        Edit
      </button>
    </section>
  );
}

function stepDescription(step: number): string {
  return (
    [
      'Name the workspace and add its public contact details.',
      'Set the primary physical location for this restaurant.',
      'Define the standard service week. You can adjust it later.',
      'Give the workspace a recognizable identity. Images are optional.',
      'Confirm the workspace details before creating the restaurant.',
    ][step] ?? ''
  );
}
