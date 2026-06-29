import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatDate } from '@/lib/format/date';
import type { Rule } from '@/lib/mock/types';

export function RulesTable({ rules }: { rules: Rule[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead align="right">Prioridade</TableHead>
          <TableHead>Vigência</TableHead>
          <TableHead>Critérios</TableHead>
          <TableHead>Estratégia</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell>{rule.name}</TableCell>
            <TableCell align="right">{rule.priority}</TableCell>
            <TableCell>
              {formatDate(rule.validFrom)}
              {rule.validTo ? ` – ${formatDate(rule.validTo)}` : ''}
            </TableCell>
            <TableCell>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {rule.criteria.map((criterion, index) => (
                  <Badge key={index} variant="outline">
                    {criterion.field} {criterion.operator} {criterion.value}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{rule.conflictStrategy}</TableCell>
            <TableCell>
              <Badge variant={rule.status === 'Ativa' ? 'success' : 'secondary'}>
                {rule.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
