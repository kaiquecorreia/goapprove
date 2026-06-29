import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return <div className={cx(styles.separator, styles[orientation], className)} />;
}
