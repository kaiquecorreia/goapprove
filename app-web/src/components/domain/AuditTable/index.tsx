import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatDateTime } from '@/lib/format/date';
import type { AuditEvent } from '@/lib/mock/types';

interface AuditTableProps {
  events: AuditEvent[];
  onViewDetail: (event: AuditEvent) => void;
}

export function AuditTable({ events, onViewDetail }: AuditTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data/Hora</TableHead>
          <TableHead>Usuário</TableHead>
          <TableHead>Ação</TableHead>
          <TableHead>Entidade</TableHead>
          <TableHead>Correlation ID</TableHead>
          <TableHead align="right">Detalhes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>{formatDateTime(event.at)}</TableCell>
            <TableCell>{event.user}</TableCell>
            <TableCell>
              <Badge variant="outline">{event.action}</Badge>
            </TableCell>
            <TableCell>
              {event.entity} · {event.entityId}
            </TableCell>
            <TableCell>{event.correlationId}</TableCell>
            <TableCell align="right">
              <Button variant="ghost" size="sm" onClick={() => onViewDetail(event)}>
                Ver detalhe
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
