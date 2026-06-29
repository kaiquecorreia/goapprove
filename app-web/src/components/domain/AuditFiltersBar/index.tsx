'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import styles from './styles.module.scss';

export interface AuditFilters {
  search: string;
  date: string;
}

interface AuditFiltersBarProps {
  filters: AuditFilters;
  onChange: (filters: AuditFilters) => void;
}

export function AuditFiltersBar({ filters, onChange }: AuditFiltersBarProps) {
  return (
    <div className={styles.bar}>
      <Input
        leftIcon={<Search size={16} />}
        placeholder="Buscar por usuário, ação, entidade ou correlation ID..."
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        wrapperClassName={styles.search}
      />
      <Input
        type="date"
        value={filters.date}
        onChange={(event) => onChange({ ...filters, date: event.target.value })}
        wrapperClassName={styles.date}
      />
    </div>
  );
}
