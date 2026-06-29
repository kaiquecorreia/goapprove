import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import type { Company } from '@/lib/mock/types';

export function CompaniesTable({ companies }: { companies: Company[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código LN</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>CNPJ</TableHead>
          <TableHead>Ambiente</TableHead>
          <TableHead>URL de integração</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => (
          <TableRow key={company.id}>
            <TableCell>{company.codeLN}</TableCell>
            <TableCell>{company.name}</TableCell>
            <TableCell>{company.cnpj}</TableCell>
            <TableCell>
              <Badge variant={company.environment === 'Produção' ? 'info' : 'secondary'}>
                {company.environment}
              </Badge>
            </TableCell>
            <TableCell>{company.url}</TableCell>
            <TableCell>
              <Badge variant={company.status === 'Ativo' ? 'success' : 'secondary'}>
                {company.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
