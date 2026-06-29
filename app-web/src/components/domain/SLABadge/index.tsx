import { Badge } from '@/components/ui/Badge';

export function SLABadge({ hours }: { hours: number }) {
  if (hours < 0) {
    return <Badge variant="destructive">{Math.abs(Math.round(hours))}h atrasado</Badge>;
  }
  if (hours <= 2) {
    return <Badge variant="warning">{Math.round(hours)}h restantes</Badge>;
  }
  return <Badge variant="success">{Math.round(hours)}h restantes</Badge>;
}
