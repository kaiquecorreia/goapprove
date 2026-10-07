import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './styles.module.scss';

export default function ReceivedQuotesPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Cotações Recebidas"
        description="Respostas de cotação recebidas dos fornecedores."
      />

      <Card>
        <CardContent>
          <p className={styles.stateMessage}>Em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
