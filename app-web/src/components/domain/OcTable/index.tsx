'use client';

import Link from 'next/link';
import { Check, Eye, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { SLABadge } from '@/components/domain/SLABadge';
import { formatCurrency } from '@/lib/format/currency';
import type { PurchaseOrder } from '@/lib/mock/types';
import styles from './styles.module.scss';

interface OcTableProps {
  orders: PurchaseOrder[];
  showSelection?: boolean;
  showQuickActions?: boolean;
  selected?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onApprove?: (order: PurchaseOrder) => void;
  onReject?: (order: PurchaseOrder) => void;
}

export function OcTable({
  orders,
  showSelection = false,
  showQuickActions = false,
  selected = [],
  onToggleSelect,
  onToggleSelectAll,
  onApprove,
  onReject,
}: OcTableProps) {
  const allSelected = orders.length > 0 && selected.length === orders.length;
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showSelection && (
            <TableHead>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleSelectAll}
              />
            </TableHead>
          )}
          <TableHead>OC</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Solicitante</TableHead>
          <TableHead align="right">Valor</TableHead>
          <TableHead>Status</TableHead>
          {showQuickActions && <TableHead>SLA</TableHead>}
          <TableHead align="right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            {showSelection && (
              <TableCell>
                <Checkbox
                  checked={selected.includes(order.id)}
                  onChange={() => onToggleSelect?.(order.id)}
                />
              </TableCell>
            )}
            <TableCell>{order.number}</TableCell>
            <TableCell>{order.company}</TableCell>
            <TableCell>{order.supplier}</TableCell>
            <TableCell>{order.requester}</TableCell>
            <TableCell align="right">{formatCurrency(order.total)}</TableCell>
            <TableCell>
              <StatusBadge status={order.status} />
            </TableCell>
            {showQuickActions && (
              <TableCell>
                {order.status === 'pending' && <SLABadge hours={order.slaHours} />}
              </TableCell>
            )}
            <TableCell align="right">
              <div className={styles.actions}>
                <Link href={`/ocs/${order.id}`}>
                  <Button variant="ghost" size="icon" aria-label="Ver OC">
                    <Eye size={16} />
                  </Button>
                </Link>
                {showQuickActions && order.status === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Aprovar"
                      onClick={() => onApprove?.(order)}
                    >
                      <Check size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Rejeitar"
                      onClick={() => onReject?.(order)}
                    >
                      <X size={16} />
                    </Button>
                    <Link href={`/ocs/${order.id}#comentarios`}>
                      <Button variant="ghost" size="icon" aria-label="Comentar">
                        <MessageSquare size={16} />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
