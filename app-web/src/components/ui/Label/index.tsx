import { LabelHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children?: ReactNode;
}

export function Label({ className, children, ...rest }: LabelProps) {
  return (
    <label className={cx(styles.label, className)} {...rest}>
      {children}
    </label>
  );
}
