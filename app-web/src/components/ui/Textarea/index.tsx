import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className, wrapperClassName, ...rest },
  ref,
) {
  return (
    <div className={cx(styles.wrapper, wrapperClassName)}>
      <textarea
        ref={ref}
        className={cx(styles.textarea, error && styles.hasError, className)}
        {...rest}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});
