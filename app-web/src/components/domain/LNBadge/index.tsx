import { Badge, BadgeVariant } from '@/components/ui/Badge';
import type { LNStatus } from '@/lib/mock/types';

const LN_STATUS_MAP: Record<LNStatus, { label: string; variant: BadgeVariant }> = {
  received: { label: 'Recebido', variant: 'info' },
  synced: { label: 'Sincronizado', variant: 'success' },
  pending_send: { label: 'Aguardando envio', variant: 'warning' },
  failed: { label: 'Falhou', variant: 'destructive' },
};

export function LNBadge({ status }: { status: LNStatus }) {
  const { label, variant } = LN_STATUS_MAP[status];
  return <Badge variant={variant}>LN: {label}</Badge>;
}
