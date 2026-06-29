import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatCurrency } from '@/lib/format/currency';
import type { OCItem } from '@/lib/mock/types';

export function OcItemsTable({ items }: { items: OCItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead align="right">Qtd.</TableHead>
          <TableHead align="right">Preço unit.</TableHead>
          <TableHead align="right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.code}>
            <TableCell>{item.code}</TableCell>
            <TableCell>{item.description}</TableCell>
            <TableCell>{item.category}</TableCell>
            <TableCell align="right">{item.qty}</TableCell>
            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
            <TableCell align="right">{formatCurrency(item.qty * item.unitPrice)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
