import { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface DivProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Card({ className, children, ...rest }: DivProps) {
  return (
    <div className={cx(styles.card, className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: DivProps) {
  return (
    <div className={cx(styles.header, className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: DivProps) {
  return (
    <h3 className={cx(styles.title, className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }: DivProps) {
  return (
    <p className={cx(styles.description, className)} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...rest }: DivProps) {
  return (
    <div className={cx(styles.content, className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: DivProps) {
  return (
    <div className={cx(styles.footer, className)} {...rest}>
      {children}
    </div>
  );
}
