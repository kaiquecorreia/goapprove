import { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children?: ReactNode;
}

export function Badge({ variant = 'default', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[variant], className)} {...rest}>
      {children}
    </span>
  );
}
