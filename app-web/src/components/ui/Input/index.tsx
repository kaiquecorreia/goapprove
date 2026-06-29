import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, error, className, wrapperClassName, ...rest },
  ref,
) {
  return (
    <div className={cx(styles.wrapper, wrapperClassName)}>
      <div className={cx(styles.inputContainer, error && styles.hasError)}>
        {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
        <input
          ref={ref}
          className={cx(styles.input, leftIcon ? styles.withIcon : undefined, className)}
          {...rest}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});
