# Toast architecture

Transient notifications are owned by `ToastProvider`, mounted once in
`AppProviders`. Feature hooks call `useToast`; services return data or throw and
never create UI feedback themselves.

```text
component → feature hook → service → apiClient
                ↓             throws ↑
             useToast ← API error classifier
```

## Usage

```tsx
const toast = useToast();

toast.success('Profile updated');
toast.error('Upload failed', {
  action: { label: 'Retry', onClick: retryUpload },
});
toast.info('Session refreshed');
toast.warning('Connection unstable');
```

Use inline feedback for validation, critical failures, or anything requiring a
decision. The API classifier suppresses `401` refresh handling and common
validation/conflict responses; it standardizes connection, authorization, and
server failures.

The provider applies tone-specific durations, pauses while hovered or focused,
supports one action, deduplicates repeated messages, and shows at most four
notifications. Pass `duration: 0` only when a toast genuinely needs to remain
until dismissed.
