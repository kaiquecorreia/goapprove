'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OcFiltersBar, EMPTY_OC_FILTERS, type OcFilters } from '@/components/domain/OcFiltersBar';
import { OcTable } from '@/components/domain/OcTable';
import { getPurchaseOrders } from '@/services/purchaseOrders';
import { feedback } from '@/services/feedback';
import type { PurchaseOrder } from '@/lib/mock/types';
import styles from './styles.module.scss';

function toOptions(values: string[]) {
  return Array.from(new Set(values)).map((value) => ({ label: value, value }));
}

export default function OcsPendentesPage() {
  const allOrders = getPurchaseOrders();
  const pendingOrders = useMemo(
    () => allOrders.filter((order) => order.status === 'pending'),
    [allOrders],
  );

  const [filters, setFilters] = useState<OcFilters>(EMPTY_OC_FILTERS);
  const [selected, setSelected] = useState<string[]>([]);

  const filteredOrders = useMemo(() => {
    return pendingOrders.filter((order) => {
      const matchesSearch = order.number.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCompany = !filters.company || order.company === filters.company;
      const matchesSupplier = !filters.supplier || order.supplier === filters.supplier;
      const matchesRequester = !filters.requester || order.requester === filters.requester;
      const matchesCostCenter = !filters.costCenter || order.costCenter === filters.costCenter;
      const matchesCategory = !filters.category || order.category === filters.category;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesSupplier &&
        matchesRequester &&
        matchesCostCenter &&
        matchesCategory
      );
    });
  }, [pendingOrders, filters]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === filteredOrders.length ? [] : filteredOrders.map((order) => order.id),
    );
  };

  const handleApprove = (order: PurchaseOrder) => {
    feedback.success(`OC ${order.number} aprovada.`);
  };

  const handleReject = (order: PurchaseOrder) => {
    feedback.error(`OC ${order.number} rejeitada.`);
  };

  const handleBulkApprove = () => {
    feedback.success(`${selected.length} OC(s) aprovadas.`);
    setSelected([]);
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="OCs Pendentes"
        description="Ordens de compra aguardando aprovação."
        actions={
          selected.length > 0 ? (
            <Button leftIcon={<Check size={16} />} onClick={handleBulkApprove}>
              Aprovar selecionadas ({selected.length})
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent>
          <OcFiltersBar
            filters={filters}
            onChange={setFilters}
            companyOptions={toOptions(pendingOrders.map((order) => order.company))}
            supplierOptions={toOptions(pendingOrders.map((order) => order.supplier))}
            requesterOptions={toOptions(pendingOrders.map((order) => order.requester))}
            costCenterOptions={toOptions(pendingOrders.map((order) => order.costCenter))}
            categoryOptions={toOptions(pendingOrders.map((order) => order.category))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <OcTable
            orders={filteredOrders}
            showSelection
            showQuickActions
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </CardContent>
      </Card>
    </div>
  );
}
