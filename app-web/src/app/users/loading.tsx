import { PageLoadingState } from '@/components/ui/PageLoadingState';

export default function Loading() {
  return (
    <PageLoadingState
      title="Usuários"
      description="Usuários com acesso ao fluxo de aprovação de OCs."
    />
  );
}
