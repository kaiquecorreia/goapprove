import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './styles.module.scss';

export default function QuotesHistoryPage() {
  return (
    <div className={styles.page}>
      <PageHeader title="Histórico de Cotações" description="Cotações já finalizadas." />

      <Card>
        <CardContent>
          <p className={styles.stateMessage}>Em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
