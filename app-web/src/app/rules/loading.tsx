import { PageLoadingState } from '@/components/ui/PageLoadingState';

export default function Loading() {
  return (
    <PageLoadingState
      title="Regras de Negócio"
      description="Regras de aprovação aplicadas automaticamente às OCs recebidas."
    />
  );
}
