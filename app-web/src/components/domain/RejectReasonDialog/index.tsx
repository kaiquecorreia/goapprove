'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  onConfirm: (comment: string) => Promise<void>;
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  orderNumber,
  onConfirm,
}: RejectReasonDialogProps) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setComment('');
  }, [open]);

  const handleConfirm = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await onConfirm(comment.trim());
      onOpenChange(false);
    } catch {
      // Error already surfaced by the caller (toast); keep the dialog open for retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar OC{orderNumber ? ` ${orderNumber}` : ''}</DialogTitle>
          <DialogDescription>
            Descreva o motivo da rejeição. Esse comentário fica registrado no histórico da OC.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Motivo da rejeição"
          rows={4}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            isLoading={submitting}
            disabled={!comment.trim()}
          >
            Rejeitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
