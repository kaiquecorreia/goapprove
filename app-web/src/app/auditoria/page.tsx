'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { AuditFiltersBar, type AuditFilters } from '@/components/domain/AuditFiltersBar';
import { AuditTable } from '@/components/domain/AuditTable';
import { AuditDetailSheet } from '@/components/domain/AuditDetailSheet';
import { getAuditEvents } from '@/services/auditEvents';
import { formatDate } from '@/lib/format/date';
import type { AuditEvent } from '@/lib/mock/types';
import styles from './styles.module.scss';

export default function AuditoriaPage() {
  const events = getAuditEvents();
  const [filters, setFilters] = useState<AuditFilters>({ search: '', date: '' });
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const haystack =
        `${event.user} ${event.action} ${event.entity} ${event.correlationId}`.toLowerCase();
      const matchesSearch = haystack.includes(filters.search.toLowerCase());
      const matchesDate = !filters.date || formatDate(event.at) === formatDate(filters.date);
      return matchesSearch && matchesDate;
    });
  }, [events, filters]);

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
          <AuditTable events={filteredEvents} onViewDetail={setSelectedEvent} />
        </CardContent>
      </Card>

      <AuditDetailSheet
        event={selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
}
