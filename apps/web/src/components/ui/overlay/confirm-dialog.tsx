'use client';

import type { ReactNode } from 'react';
import { Button, LoadingButton } from '../primitives/button';
import { Modal } from './modal';

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  description,
  loading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  cancelLabel?: string;
  confirmLabel?: string;
  description: ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <Modal
      description={description}
      footer={
        <>
          <Button
            disabled={loading}
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <LoadingButton
            loading={loading}
            loadingText="Working…"
            variant="danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </LoadingButton>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      {null}
    </Modal>
  );
}
