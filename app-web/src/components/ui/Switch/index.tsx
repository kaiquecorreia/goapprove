import { InputHTMLAttributes, forwardRef } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, ...rest },
  ref,
) {
  return (
    <span className={cx(styles.wrapper, className)}>
      <input ref={ref} type="checkbox" className={styles.input} {...rest} />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </span>
  );
});
