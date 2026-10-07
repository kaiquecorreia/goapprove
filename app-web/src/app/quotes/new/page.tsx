import { PageHeader } from '@/components/ui/PageHeader';
import { QuoteRequestForm } from '@/components/domain/QuoteRequestForm';
import styles from './styles.module.scss';

export default function NewQuotePage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Solicitação de Cotação"
        description="Preencha as informações da solicitação de cotação para envio aos fornecedores."
      />

      <QuoteRequestForm />
    </div>
  );
}
