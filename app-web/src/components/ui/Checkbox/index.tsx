import { InputHTMLAttributes, forwardRef, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, className, checked, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <span className={cx(styles.wrapper, className)}>
      <input
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        type="checkbox"
        className={styles.input}
        checked={checked}
        {...rest}
      />
      <span className={styles.box}>
        {(checked || indeterminate) && <Check size={12} strokeWidth={3} />}
      </span>
    </span>
  );
});
