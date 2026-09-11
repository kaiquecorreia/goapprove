'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { OcFiltersBar, EMPTY_OC_FILTERS, type OcFilters } from '@/components/domain/OcFiltersBar';
import { OcTable } from '@/components/domain/OcTable';
import { RejectReasonDialog } from '@/components/domain/RejectReasonDialog';
import { getPendingPurchaseOrders } from '@/services/pendingPurchaseOrdersClient';
import { postDecision } from '@/services/workflowDecisionsClient';
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
  const [rejectTarget, setRejectTarget] = useState<OcTableRow | null>(null);
  const requestIdRef = useRef(0);

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

  const fetchPending = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

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
      if (requestIdRef.current === requestId) setData(result);
    } catch (error) {
      if (requestIdRef.current === requestId) {
        feedback.error(error instanceof Error ? error.message : 'Erro ao carregar OCs pendentes');
      }
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchPending();
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [fetchPending]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === data.items.length ? [] : data.items.map((order) => order.id),
    );
  };

  const handleApprove = async (order: OcTableRow) => {
    try {
      await postDecision(order.id, { decision: 'APPROVED' });
      feedback.success(`OC ${order.number} aprovada.`);
    } catch (error) {
      feedback.error(
        error instanceof Error ? error.message : `Erro ao aprovar OC ${order.number}.`,
      );
    } finally {
      fetchPending();
    }
  };

  const handleReject = (order: OcTableRow) => {
    setRejectTarget(order);
  };

  const handleConfirmReject = async (comment: string) => {
    if (!rejectTarget) return;

    try {
      await postDecision(rejectTarget.id, { decision: 'REJECTED', comment });
      feedback.success(`OC ${rejectTarget.number} rejeitada.`);
    } catch (error) {
      feedback.error(
        error instanceof Error ? error.message : `Erro ao rejeitar OC ${rejectTarget.number}.`,
      );
      throw error;
    } finally {
      fetchPending();
    }
  };

  const handleBulkApprove = async () => {
    const ids = selected;
    const results = await Promise.allSettled(
      ids.map((id) => postDecision(id, { decision: 'APPROVED' })),
    );
    const succeeded = results.filter((result) => result.status === 'fulfilled').length;
    const failed = results.length - succeeded;

    if (succeeded > 0) feedback.success(`${succeeded} OC(s) aprovada(s).`);
    if (failed > 0) feedback.error(`${failed} OC(s) não puderam ser aprovadas.`);

    setSelected([]);
    fetchPending();
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
          <>
            <RefreshButton onRefresh={fetchPending} isLoading={loading} />
            {selected.length > 0 && (
              <Button leftIcon={<Check size={16} />} onClick={handleBulkApprove}>
                Aprovar selecionadas ({selected.length})
              </Button>
            )}
          </>
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
          {data.items.length === 0 && loading ? (
            <p className={styles.stateMessage}>Carregando OCs pendentes…</p>
          ) : data.items.length === 0 ? (
            <p className={styles.stateMessage}>Nenhuma OC pendente encontrada.</p>
          ) : (
            <LoadingOverlay isLoading={loading}>
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
            </LoadingOverlay>
          )}
        </CardContent>
      </Card>

      <RejectReasonDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        orderNumber={rejectTarget?.number}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
