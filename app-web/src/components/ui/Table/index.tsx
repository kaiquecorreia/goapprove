import { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

type Align = 'left' | 'right' | 'center';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children?: ReactNode;
}

export function Table({ className, children, ...rest }: TableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={cx(styles.table, className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cx(styles.thead, className)} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cx(styles.tbody, className)} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cx(styles.tr, className)} {...rest}>
      {children}
    </tr>
  );
}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
}

export function TableHead({ className, align = 'left', children, ...rest }: TableHeadProps) {
  return (
    <th className={cx(styles.th, styles[align], className)} {...rest}>
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
}

export function TableCell({ className, align = 'left', children, ...rest }: TableCellProps) {
  return (
    <td className={cx(styles.td, styles[align], className)} {...rest}>
      {children}
    </td>
  );
}
