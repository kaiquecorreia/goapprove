'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RefreshButton({ onRefresh, isLoading = false, className }: RefreshButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Atualizar"
      title="Atualizar"
      disabled={isLoading}
      onClick={onRefresh}
      className={className}
    >
      <RefreshCw size={16} className={cx(isLoading && styles.spin)} />
    </Button>
  );
}
