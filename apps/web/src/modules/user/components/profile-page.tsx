'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';
import { Alert, Button, StatusBadge } from '@/components/ui';
import { useUser } from '../hooks/use-user';
import type {
  Gender as UserGender,
  UpdateUserProfileInput,
  UserProfile,
} from '../types/user.types';

type Gender = '' | UserGender;

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  gender: Gender;
  dateOfBirth: string;
};

type FieldErrors = Partial<Record<keyof ProfileForm | 'form', string>>;

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordErrors = Partial<Record<keyof PasswordForm | 'form', string>>;

const emptyForm: ProfileForm = {
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
  gender: '',
  dateOfBirth: '',
};

const toForm = (data: UserProfile): ProfileForm => ({
  firstName: data.profile?.firstName ?? '',
  lastName: data.profile?.lastName ?? '',
  phone: data.phone ?? '',
  bio: data.profile?.bio ?? '',
  gender: data.profile?.gender ?? '',
  dateOfBirth: data.profile?.dateOfBirth?.slice(0, 10) ?? '',
});

const validate = (form: ProfileForm): FieldErrors => {
  const errors: FieldErrors = {};
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();

  if (firstName.length < 1 || firstName.length > 50) {
    errors.firstName = 'Enter a first name between 1 and 50 characters.';
  }
  if (lastName.length < 1 || lastName.length > 50) {
    errors.lastName = 'Enter a last name between 1 and 50 characters.';
  }
  if (form.phone && !/^\+[1-9]\d{7,14}$/.test(form.phone.trim())) {
    errors.phone = 'Use international format, for example +358401234567.';
  }
  if (form.bio.length > 500) {
    errors.bio = 'Keep your bio to 500 characters or fewer.';
  }
  if (form.dateOfBirth) {
    const selectedDate = new Date(`${form.dateOfBirth}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      errors.dateOfBirth = 'Enter a valid date.';
    } else if (selectedDate.getTime() > Date.now()) {
      errors.dateOfBirth = 'Date of birth cannot be in the future.';
    }
  }

  return errors;
};

const getServerErrors = (error: ApiError): FieldErrors => {
  const errors: FieldErrors = {};

  for (const message of error.messages) {
    if (message.toLowerCase().includes('phone')) errors.phone = message;
    else if (message.startsWith('firstName')) errors.firstName = message;
    else if (message.startsWith('lastName')) errors.lastName = message;
    else if (message.startsWith('bio')) errors.bio = message;
    else if (message.startsWith('gender')) errors.gender = message;
    else if (message.startsWith('dateOfBirth')) errors.dateOfBirth = message;
    else errors.form = message;
  }

  return errors;
};

export default function ProfilePage() {
  const { signOut } = useAuth();
  const {
    changePassword,
    error: profileError,
    fetchCurrentUser,
    profile,
    status,
    updateProfile,
    uploadPhoto,
  } = useUser();
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [savedForm, setSavedForm] = useState<ProfileForm>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    fetchCurrentUser()
      .then((data) => {
        if (!active) return;
        const nextForm = toForm(data);
        setForm(nextForm);
        setSavedForm(nextForm);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [fetchCurrentUser]);

  const initials = useMemo(() => {
    const letters = [form.firstName, form.lastName]
      .map((name) => name.trim().charAt(0).toUpperCase())
      .join('');
    return letters || 'TF';
  }, [form.firstName, form.lastName]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const updateField = <Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setSaved(false);
    setErrors({});

    try {
      const update: UpdateUserProfileInput = {};
      if (form.firstName !== savedForm.firstName) update.firstName = form.firstName.trim();
      if (form.lastName !== savedForm.lastName) update.lastName = form.lastName.trim();
      if (form.phone !== savedForm.phone) update.phone = form.phone.trim() || null;
      if (form.bio !== savedForm.bio) update.bio = form.bio.trim() || null;
      if (form.gender !== savedForm.gender) update.gender = form.gender || null;
      if (form.dateOfBirth !== savedForm.dateOfBirth) update.dateOfBirth = form.dateOfBirth || null;

      const data = await updateProfile(update);
      const nextForm = toForm(data);
      setForm(nextForm);
      setSavedForm(nextForm);
      setSaved(true);
    } catch (error: unknown) {
      setErrors(
        error instanceof ApiError
          ? getServerErrors(error)
          : { form: 'Could not save your changes. Please try again.' },
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5_000_000) {
      setPhotoError('Choose an image smaller than 5 MB.');
      return;
    }

    setUploadingPhoto(true);
    setPhotoError('');
    try {
      await uploadPhoto(file);
    } catch (error: unknown) {
      setPhotoError(
        error instanceof ApiError
          ? error.message
          : 'Could not upload your photo. Please try again.',
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updatePasswordField = (key: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [key]: value }));
    setPasswordErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: PasswordErrors = {};

    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = 'Enter your current password.';
    }
    if (
      passwordForm.newPassword.length < 12 ||
      passwordForm.newPassword.length > 72 ||
      new TextEncoder().encode(passwordForm.newPassword).length > 72
    ) {
      nextErrors.newPassword =
        'Use 12–72 characters and no more than 72 UTF-8 bytes.';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      nextErrors.newPassword = 'Choose a password different from your current one.';
    }
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      return;
    }

    setChangingPassword(true);
    setPasswordErrors({});

    try {
      await changePassword(passwordForm);
      await signOut();
      router.replace('/login?passwordChanged=1');
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const message = error.message;
        if (message.toLowerCase().includes('current password')) {
          setPasswordErrors({ currentPassword: message });
        } else if (message.toLowerCase().includes('confirm')) {
          setPasswordErrors({ confirmPassword: message });
        } else if (message.toLowerCase().includes('new password')) {
          setPasswordErrors({ newPassword: message });
        } else {
          setPasswordErrors({ form: message });
        }
      } else {
        setPasswordErrors({
          form: 'Could not change your password. Please try again.',
        });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <section className="profile-loading" aria-label="Loading profile">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--form" />
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="profile-error">
        <p className="eyebrow">Profile unavailable</p>
        <h2>We couldn’t load your details.</h2>
        <p>{profileError ?? errors.form ?? 'Please refresh the page and try again.'}</p>
        <Button onClick={() => window.location.reload()}>
          Try again
        </Button>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <header className="profile-heading">
        <div>
          <p className="eyebrow">Personal details</p>
          <h2>Your profile</h2>
          <p className="section-intro">Keep your contact details current for smoother bookings and orders.</p>
          <p className="profile-audit">
            Member since {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(profile.createdAt))}
            <span aria-hidden="true"> · </span>
            Last updated {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(profile.updatedAt))}
          </p>
        </div>
        <div className="photo-control">
          <div className={profile.photo ? 'avatar has-photo' : 'avatar'}>
            {profile.photo ? (
              <img src={profile.photo.url} alt={profile.photo.alt ?? 'Profile photo'} />
            ) : (
              <span aria-label={`Initials ${initials}`}>{initials}</span>
            )}
          </div>
          <label className="photo-button" htmlFor="profile-photo">
            {uploadingPhoto ? 'Uploading…' : profile.photo ? 'Change photo' : 'Add photo'}
          </label>
          <input
            className="visually-hidden"
            id="profile-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            disabled={uploadingPhoto}
          />
          {photoError ? <p className="photo-error" role="alert">{photoError}</p> : null}
        </div>
      </header>

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="form-section">
          <legend>Identity</legend>
          <p className="form-section__intro">The name we’ll use across your account and reservations.</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                autoComplete="given-name"
                maxLength={50}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName ? <p className="field__error" id="firstName-error">{errors.firstName}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                autoComplete="family-name"
                maxLength={50}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName ? <p className="field__error" id="lastName-error">{errors.lastName}</p> : null}
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Contact</legend>
          <p className="form-section__intro">Used for confirmations and important account messages.</p>
          <div className="field-grid">
            <div className="field">
              <div className="field__label-row">
                <label htmlFor="email">Email address</label>
                <StatusBadge verified={profile.emailVerified} />
              </div>
              <input id="email" value={profile.email} readOnly aria-readonly="true" />
              <p className="field__hint">Email changes require identity verification.</p>
            </div>
            <div className="field">
              <div className="field__label-row">
                <label htmlFor="phone">Phone number</label>
                {form.phone ? (
                  <StatusBadge verified={profile.phoneVerified} />
                ) : null}
              </div>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                autoComplete="tel"
                placeholder="+358401234567"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              />
              {errors.phone ? (
                <p className="field__error" id="phone-error">{errors.phone}</p>
              ) : (
                <p className="field__hint" id="phone-hint">Include the country code with no spaces.</p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>About you</legend>
          <p className="form-section__intro">Optional details that help make your account feel personal.</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value as Gender)}
                aria-invalid={Boolean(errors.gender)}
              >
                <option value="">Prefer not to say</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender ? <p className="field__error">{errors.gender}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => updateField('dateOfBirth', event.target.value)}
                autoComplete="bday"
                aria-invalid={Boolean(errors.dateOfBirth)}
                aria-describedby={errors.dateOfBirth ? 'date-error' : undefined}
              />
              {errors.dateOfBirth ? <p className="field__error" id="date-error">{errors.dateOfBirth}</p> : null}
            </div>
            <div className="field field--full">
              <div className="field__label-row">
                <label htmlFor="bio">Short bio</label>
                <span className="field__hint">{form.bio.length}/500</span>
              </div>
              <textarea
                id="bio"
                rows={4}
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
                maxLength={500}
                placeholder="Share a little about your dining preferences."
                aria-invalid={Boolean(errors.bio)}
                aria-describedby={errors.bio ? 'bio-error' : undefined}
              />
              {errors.bio ? <p className="field__error" id="bio-error">{errors.bio}</p> : null}
            </div>
          </div>
        </fieldset>

        {errors.form ? <Alert>{errors.form}</Alert> : null}
        <div className="form-actions">
          <p className="save-status" aria-live="polite">
            {saved ? 'Changes saved.' : isDirty ? 'You have unsaved changes.' : 'Everything is up to date.'}
          </p>
          <div className="form-actions__buttons">
            <Button
              variant="secondary"
              disabled={!isDirty || saving}
              onClick={() => {
                setForm(savedForm);
                setErrors({});
                setSaved(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>

      <form
        className="password-form"
        id="password"
        onSubmit={handlePasswordSubmit}
        noValidate
      >
        <fieldset className="form-section security-form-section">
          <legend>Password</legend>
          <p className="form-section__intro">
            You’ll sign in again. Other devices lose access when their current
            session expires.
          </p>
          <div className="field-grid">
            <div className="field field--full">
              <label htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  updatePasswordField('currentPassword', event.target.value)
                }
                maxLength={128}
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                aria-describedby={
                  passwordErrors.currentPassword
                    ? 'currentPassword-error'
                    : undefined
                }
              />
              {passwordErrors.currentPassword ? (
                <p className="field__error" id="currentPassword-error">
                  {passwordErrors.currentPassword}
                </p>
              ) : null}
            </div>
            <div className="field">
              <div className="field__label-row">
                <label htmlFor="newPassword">New password</label>
                <span className="field__hint">12–72 bytes</span>
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  updatePasswordField('newPassword', event.target.value)
                }
                minLength={12}
                maxLength={72}
                aria-invalid={Boolean(passwordErrors.newPassword)}
                aria-describedby={
                  passwordErrors.newPassword ? 'newPassword-error' : undefined
                }
              />
              {passwordErrors.newPassword ? (
                <p className="field__error" id="newPassword-error">
                  {passwordErrors.newPassword}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  updatePasswordField('confirmPassword', event.target.value)
                }
                maxLength={72}
                aria-invalid={Boolean(passwordErrors.confirmPassword)}
                aria-describedby={
                  passwordErrors.confirmPassword
                    ? 'confirmPassword-error'
                    : undefined
                }
              />
              {passwordErrors.confirmPassword ? (
                <p className="field__error" id="confirmPassword-error">
                  {passwordErrors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>
        </fieldset>

        {passwordErrors.form ? (
          <Alert>{passwordErrors.form}</Alert>
        ) : null}
        <div className="password-actions">
          <Button type="submit" disabled={changingPassword}>
            {changingPassword ? 'Changing password…' : 'Change password'}
          </Button>
        </div>
      </form>
    </section>
  );
}
