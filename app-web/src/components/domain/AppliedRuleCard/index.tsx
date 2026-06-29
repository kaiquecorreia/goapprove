import Link from 'next/link';
import { GitBranch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './styles.module.scss';

export function AppliedRuleCard({ ruleName }: { ruleName?: string }) {
  return (
    <Card>
      <CardContent className={styles.content}>
        <div className={styles.iconWrapper}>
          <GitBranch size={18} />
        </div>
        <div className={styles.body}>
          <span className={styles.label}>Regra aplicada</span>
          {ruleName ? (
            <Link href="/regras" className={styles.ruleName}>
              {ruleName}
            </Link>
          ) : (
            <span className={styles.noRule}>Nenhuma regra aplicável</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
