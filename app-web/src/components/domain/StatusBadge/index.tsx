import { Badge, BadgeVariant } from '@/components/ui/Badge';
import type { OCStatus } from '@/lib/mock/types';

const STATUS_MAP: Record<OCStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  approved: { label: 'Aprovada', variant: 'success' },
  rejected: { label: 'Rejeitada', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'secondary' },
  no_rule: { label: 'Sem regra', variant: 'info' },
  error: { label: 'Erro', variant: 'destructive' },
};

export function StatusBadge({ status }: { status: OCStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
