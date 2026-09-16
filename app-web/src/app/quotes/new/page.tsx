import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './styles.module.scss';

export default function NewQuotePage() {
  return (
    <div className={styles.page}>
      <PageHeader title="Nova Cotação" description="Criação de uma nova cotação." />

      <Card>
        <CardContent>
          <p className={styles.stateMessage}>Em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
