'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { AuditFiltersBar, type AuditFilters } from '@/components/domain/AuditFiltersBar';
import { AuditTable } from '@/components/domain/AuditTable';
import { AuditDetailSheet } from '@/components/domain/AuditDetailSheet';
import { getAuditEvents } from '@/services/auditClient';
import { feedback } from '@/services/feedback';
import type { AuditEvent, AuditEventsPage } from '@/lib/mock/types';
import styles from './styles.module.scss';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;
const EMPTY_FILTERS: AuditFilters = { search: '', date: '' };
const EMPTY_PAGE: AuditEventsPage = { items: [], total: 0, page: 1, limit: PAGE_SIZE };

export default function AuditoriaPage() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditEventsPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const fetchEvents = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const result = await getAuditEvents({
        page,
        limit: PAGE_SIZE,
        search: filters.search || undefined,
        // A single day, resolved server-side: comparing formatted local dates
        // used to drop events depending on the viewer's timezone.
        dateFrom: filters.date ? `${filters.date}T00:00:00.000Z` : undefined,
        dateTo: filters.date ? `${filters.date}T23:59:59.999Z` : undefined,
      });

      if (requestIdRef.current === requestId) setData(result);
    } catch (error) {
      if (requestIdRef.current === requestId) {
        feedback.error(
          error instanceof Error ? error.message : 'Erro ao carregar eventos de auditoria',
        );
      }
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void fetchEvents();
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [fetchEvents]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Auditoria"
        description="Trilha de auditoria de ações realizadas no GoApprove."
      />

      <Card>
        <CardContent className={styles.filtersContent}>
          <AuditFiltersBar filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <p className={styles.stateMessage}>Carregando eventos…</p>
          ) : data.items.length === 0 ? (
            <p className={styles.stateMessage}>Nenhum evento encontrado.</p>
          ) : (
            <>
              <AuditTable events={data.items} onViewDetail={setSelectedEvent} />
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

      <AuditDetailSheet
        event={selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
}
