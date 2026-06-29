'use client';

import { ReactNode, createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/lib/cx';
import { useControllableOpen } from '../_internal/useControllableOpen';
import styles from './styles.module.scss';

interface SheetContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue | undefined>(undefined);

function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within <Sheet>');
  }
  return context;
}

interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function Sheet({ open, defaultOpen, onOpenChange, children }: SheetProps) {
  const { isOpen, setOpen } = useControllableOpen({ open, defaultOpen, onOpenChange });

  return <SheetContext.Provider value={{ isOpen, setOpen }}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ children }: { children: ReactNode }) {
  const { setOpen } = useSheetContext();
  return <span onClick={() => setOpen(true)}>{children}</span>;
}

type SheetSize = 'md' | 'lg' | 'xl';

interface SheetContentProps {
  children?: ReactNode;
  className?: string;
  size?: SheetSize;
}

export function SheetContent({ children, className, size = 'md' }: SheetContentProps) {
  const { isOpen, setOpen } = useSheetContext();

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
        className={cx(styles.content, styles[size], className)}
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

export function SheetHeader({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cx(styles.header, className)}>{children}</div>;
}

export function SheetTitle({ children, className }: { children?: ReactNode; className?: string }) {
  return <h2 className={cx(styles.title, className)}>{children}</h2>;
}

export function SheetDescription({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <p className={cx(styles.description, className)}>{children}</p>;
}

export function SheetFooter({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cx(styles.footer, className)}>{children}</div>;
}
