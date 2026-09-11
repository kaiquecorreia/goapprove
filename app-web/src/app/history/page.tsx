'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { OcTable } from '@/components/domain/OcTable';
import { getHistoryPurchaseOrders } from '@/services/historyClient';
import { feedback } from '@/services/feedback';
import type { OCStatus, PendingPurchaseOrdersPage } from '@/lib/mock/types';
import styles from './styles.module.scss';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

const STATUS_TABS: { value: OCStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'rejected', label: 'Rejeitada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_rule', label: 'Sem regra' },
  { value: 'error', label: 'Erro' },
];

const EMPTY_PAGE: PendingPurchaseOrdersPage = { items: [], total: 0, page: 1, limit: PAGE_SIZE };

export default function HistoricoPage() {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<OCStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PendingPurchaseOrdersPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setPage(1);
  }, [search, date, status]);

  const fetchHistory = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const result = await getHistoryPurchaseOrders({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        dateFrom: date ? `${date}T00:00:00.000Z` : undefined,
        dateTo: date ? `${date}T23:59:59.999Z` : undefined,
      });
      if (requestIdRef.current === requestId) setData(result);
    } catch (error) {
      if (requestIdRef.current === requestId) {
        feedback.error(
          error instanceof Error ? error.message : 'Erro ao carregar histórico de OCs',
        );
      }
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [search, date, status, page]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchHistory();
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [fetchHistory]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Histórico"
        description="Histórico completo de OCs processadas."
        actions={<RefreshButton onRefresh={fetchHistory} isLoading={loading} />}
      />

      <Card>
        <CardContent className={styles.filtersContent}>
          <div className={styles.filtersRow}>
            <Input
              leftIcon={<Search size={16} />}
              placeholder="Buscar por OC, fornecedor ou solicitante..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              wrapperClassName={styles.search}
            />
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              wrapperClassName={styles.date}
            />
          </div>

          <Tabs value={status} onValueChange={(value) => setStatus(value as OCStatus | 'all')}>
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {data.items.length === 0 && loading ? (
            <p className={styles.stateMessage}>Carregando histórico…</p>
          ) : data.items.length === 0 ? (
            <p className={styles.stateMessage}>Nenhuma OC encontrada.</p>
          ) : (
            <LoadingOverlay isLoading={loading}>
              <OcTable orders={data.items} />
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
    </div>
  );
}
