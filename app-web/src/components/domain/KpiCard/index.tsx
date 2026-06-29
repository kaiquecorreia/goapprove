import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

export type KpiTone = 'primary' | 'success' | 'destructive' | 'warning';

interface KpiCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  tone?: KpiTone;
}

export function KpiCard({ title, value, icon, tone = 'primary' }: KpiCardProps) {
  return (
    <Card>
      <CardContent className={styles.content}>
        <div className={cx(styles.iconWrapper, styles[tone])}>{icon}</div>
        <div>
          <span className={styles.title}>{title}</span>
          <span className={styles.value}>{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
