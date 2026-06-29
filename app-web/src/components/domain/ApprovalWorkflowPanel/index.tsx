import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { ApprovalLevel } from '@/lib/mock/types';
import styles from './styles.module.scss';

const STATUS_ICON = {
  approved: <CheckCircle2 size={16} className={styles.success} />,
  rejected: <XCircle size={16} className={styles.destructive} />,
  pending: <Clock size={16} className={styles.warning} />,
};

export function ApprovalWorkflowPanel({ levels }: { levels: ApprovalLevel[] }) {
  return (
    <div className={styles.panel}>
      {levels.map((level) => (
        <div key={level.level} className={styles.level}>
          <div className={styles.levelHeader}>
            <span className={styles.levelBadge}>N{level.level}</span>
            <Badge variant="outline">{level.mode}</Badge>
            <span className={styles.sla}>SLA: {level.sla}h</span>
          </div>
          <div className={styles.approvers}>
            {level.approvers.map((approver) => (
              <div key={approver} className={styles.approver}>
                <Avatar name={approver} size="sm" />
                <span className={styles.approverName}>{approver}</span>
                {STATUS_ICON[level.status]}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
