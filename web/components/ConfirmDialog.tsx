'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogHeader, Text } from '@salt-ds/core';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm',
  danger = false, loading = false, onConfirm, onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogHeader header={title} />
      <DialogContent>
        <Text>{message}</Text>
      </DialogContent>
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={danger ? 'cta' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
