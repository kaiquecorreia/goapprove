'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/cx';
import { Checkbox } from '@/components/ui/Checkbox';
import { useControllableOpen } from '../_internal/useControllableOpen';
import styles from './styles.module.scss';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  id?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  error?: string;
}

export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Selecione',
  emptyMessage,
  error,
}: MultiSelectProps) {
  const { isOpen, setOpen } = useControllableOpen({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  }>({ left: 0, width: 0, top: 0, maxHeight: 240 });
  const disabled = options.length === 0;

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const preferredHeight = 240;

      if (spaceBelow < preferredHeight && spaceAbove > spaceBelow) {
        setPosition({
          left: rect.left,
          width: rect.width,
          bottom: window.innerHeight - rect.top + 4,
          maxHeight: Math.min(preferredHeight, spaceAbove),
        });
      } else {
        setPosition({
          left: rect.left,
          width: rect.width,
          top: rect.bottom + 4,
          maxHeight: Math.min(preferredHeight, spaceBelow),
        });
      }
    };
    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleValue = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((current) => current !== optionValue)
        : [...value, optionValue],
    );
  };

  const triggerLabel =
    value.length > 0 ? `${value.length} selecionado${value.length > 1 ? 's' : ''}` : placeholder;

  return (
    <div className={styles.wrapper}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={cx(styles.trigger, error && styles.hasError)}
        onClick={() => setOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={cx(styles.triggerLabel, value.length === 0 && styles.placeholder)}>
          {triggerLabel}
        </span>
        <ChevronDown size={16} className={styles.chevron} />
      </button>
      {disabled && emptyMessage && <span className={styles.hint}>{emptyMessage}</span>}
      {error && <span className={styles.errorMessage}>{error}</span>}
      {isOpen &&
        !disabled &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            {options.map((option) => {
              const checked = value.includes(option.value);
              return (
                <label key={option.value} className={styles.option}>
                  <Checkbox checked={checked} onChange={() => toggleValue(option.value)} />
                  {option.label}
                </label>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
