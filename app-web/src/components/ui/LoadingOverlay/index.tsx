'use client';

import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
}

// Single shared "content is refreshing" look: dim the existing content and
// overlay a centered spinner instead of swapping it out for a bare message.
export function LoadingOverlay({ isLoading, children }: LoadingOverlayProps) {
  return (
    <div className={styles.wrapper}>
      <div className={cx(styles.content, isLoading && styles.dimmed)}>{children}</div>
      {isLoading && (
        <div className={styles.overlay}>
          <RefreshCw size={28} className={styles.spin} />
        </div>
      )}
    </div>
  );
}
