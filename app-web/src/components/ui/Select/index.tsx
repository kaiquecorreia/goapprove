import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, error, className, wrapperClassName, ...rest },
  ref,
) {
  return (
    <div className={cx(styles.wrapper, wrapperClassName)}>
      <div className={cx(styles.selectContainer, error && styles.hasError)}>
        <select ref={ref} className={cx(styles.select, className)} {...rest}>
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.chevron} />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});
