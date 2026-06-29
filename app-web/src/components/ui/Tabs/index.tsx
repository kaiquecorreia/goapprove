'use client';

import { ReactNode, createContext, useContext, useState } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within <Tabs>');
  }
  return context;
}

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

export function Tabs({ value, defaultValue, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const activeValue = value ?? internalValue;

  const setValue = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue }}>
      <div className={cx(styles.tabs, className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cx(styles.list, className)}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children?: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: activeValue, setValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      className={cx(styles.trigger, isActive && styles.active, className)}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children?: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return <div className={cx(styles.content, className)}>{children}</div>;
}
