'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { OcFiltersBar, EMPTY_OC_FILTERS, type OcFilters } from '@/components/domain/OcFiltersBar';
import { OcTable } from '@/components/domain/OcTable';
import { getPendingPurchaseOrders } from '@/services/pendingPurchaseOrdersClient';
import { feedback } from '@/services/feedback';
import { EUserRole } from '@/config/navigation';
import type { Company, OcTableRow, PendingPurchaseOrdersPage } from '@/lib/mock/types';
import styles from './styles.module.scss';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

const EMPTY_PAGE: PendingPurchaseOrdersPage = { items: [], total: 0, page: 1, limit: PAGE_SIZE };

const COMPANY_WIDE_ROLES: EUserRole[] = [EUserRole.OWNER, EUserRole.ADMINISTRATOR];

interface PendingOcsBoardProps {
  companies: Company[];
}

export function PendingOcsBoard({ companies }: PendingOcsBoardProps) {
  const { data: session } = useSession();
  const role = session?.role as EUserRole | undefined;
  const showCompanyFilter = Boolean(role && COMPANY_WIDE_ROLES.includes(role));

  const [filters, setFilters] = useState<OcFilters>(EMPTY_OC_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PendingPurchaseOrdersPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [
    filters.search,
    filters.companyId,
    filters.supplierCode,
    filters.requesterCode,
    filters.costCenter,
  ]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const handle = setTimeout(async () => {
      try {
        const result = await getPendingPurchaseOrders({
          page,
          limit: PAGE_SIZE,
          search: filters.search || undefined,
          companyId: filters.companyId || undefined,
          supplierCode: filters.supplierCode || undefined,
          requesterCode: filters.requesterCode || undefined,
          costCenter: filters.costCenter || undefined,
        });
        if (active) setData(result);
      } catch (error) {
        if (active) {
          feedback.error(error instanceof Error ? error.message : 'Erro ao carregar OCs pendentes');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [filters, page]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === data.items.length ? [] : data.items.map((order) => order.id),
    );
  };

  const handleApprove = (order: OcTableRow) => {
    feedback.success(`OC ${order.number} aprovada.`);
  };

  const handleReject = (order: OcTableRow) => {
    feedback.error(`OC ${order.number} rejeitada.`);
  };

  const handleBulkApprove = () => {
    feedback.success(`${selected.length} OC(s) aprovadas.`);
    setSelected([]);
  };

  const companyOptions = companies.map((company) => ({
    label: company.name,
    value: company.companyId,
  }));

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
            companyOptions={companyOptions}
            showCompanyFilter={showCompanyFilter}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <p className={styles.stateMessage}>Carregando OCs pendentes…</p>
          ) : data.items.length === 0 ? (
            <p className={styles.stateMessage}>Nenhuma OC pendente encontrada.</p>
          ) : (
            <>
              <OcTable
                orders={data.items}
                showSelection
                showQuickActions
                selected={selected}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onApprove={handleApprove}
                onReject={handleReject}
              />
              <Pagination
                page={data.page}
                limit={data.limit}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
