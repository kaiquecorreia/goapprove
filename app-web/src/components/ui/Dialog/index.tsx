'use client';

import { ReactNode, createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/lib/cx';
import { useControllableOpen } from '../_internal/useControllableOpen';
import styles from './styles.module.scss';

interface DialogContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within <Dialog>');
  }
  return context;
}

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const { isOpen, setOpen } = useControllableOpen({ open, defaultOpen, onOpenChange });

  return <DialogContext.Provider value={{ isOpen, setOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children }: { children: ReactNode }) {
  const { setOpen } = useDialogContext();
  return <span onClick={() => setOpen(true)}>{children}</span>;
}

interface DialogContentProps {
  children?: ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  const { isOpen, setOpen } = useDialogContext();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div
        className={cx(styles.content, className)}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setOpen(false)}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={cx(styles.header, className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children?: ReactNode; className?: string }) {
  return <h2 className={cx(styles.title, className)}>{children}</h2>;
}

export function DialogDescription({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <p className={cx(styles.description, className)}>{children}</p>;
}

export function DialogFooter({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={cx(styles.footer, className)}>{children}</div>;
}
