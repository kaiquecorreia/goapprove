import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './styles.module.scss';

export default function PendingQuotesPage() {
  return (
    <div className={styles.page}>
      <PageHeader title="Cotações Pendentes" description="Cotações aguardando aprovação." />

      <Card>
        <CardContent>
          <p className={styles.stateMessage}>Em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
