import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './styles.module.scss';

interface PageLoadingStateProps {
  title: string;
  description?: string;
}

// Rendered by Next.js route-segment loading.tsx files while a blocking
// Server Component page resolves its data — keeps the menu navigation
// feeling instant instead of showing a blank screen until the fetch finishes.
export function PageLoadingState({ title, description }: PageLoadingStateProps) {
  return (
    <div className={styles.page}>
      <PageHeader title={title} description={description} />

      <Card>
        <CardContent>
          <p className={styles.stateMessage}>Carregando…</p>
        </CardContent>
      </Card>
    </div>
  );
}
