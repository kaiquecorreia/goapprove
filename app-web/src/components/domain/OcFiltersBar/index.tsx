'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './styles.module.scss';

export interface OcFilters {
  search: string;
  company: string;
  supplier: string;
  requester: string;
  costCenter: string;
  category: string;
}

export const EMPTY_OC_FILTERS: OcFilters = {
  search: '',
  company: '',
  supplier: '',
  requester: '',
  costCenter: '',
  category: '',
};

interface OcFiltersBarProps {
  filters: OcFilters;
  onChange: (filters: OcFilters) => void;
  companyOptions: SelectOption[];
  supplierOptions: SelectOption[];
  requesterOptions: SelectOption[];
  costCenterOptions: SelectOption[];
  categoryOptions: SelectOption[];
}

const FILTER_LABELS: Record<keyof Omit<OcFilters, 'search'>, string> = {
  company: 'Empresa',
  supplier: 'Fornecedor',
  requester: 'Solicitante',
  costCenter: 'Centro de custo',
  category: 'Categoria',
};

export function OcFiltersBar({
  filters,
  onChange,
  companyOptions,
  supplierOptions,
  requesterOptions,
  costCenterOptions,
  categoryOptions,
}: OcFiltersBarProps) {
  const activeFilters = (Object.keys(FILTER_LABELS) as Array<keyof typeof FILTER_LABELS>).filter(
    (key) => filters[key],
  );

  return (
    <div className={styles.bar}>
      <div className={styles.row}>
        <Input
          leftIcon={<Search size={16} />}
          placeholder="Buscar por número da OC..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          wrapperClassName={styles.search}
        />
        <Select
          placeholder="Empresa"
          options={companyOptions}
          value={filters.company}
          onChange={(event) => onChange({ ...filters, company: event.target.value })}
          wrapperClassName={styles.select}
        />
        <Select
          placeholder="Fornecedor"
          options={supplierOptions}
          value={filters.supplier}
          onChange={(event) => onChange({ ...filters, supplier: event.target.value })}
          wrapperClassName={styles.select}
        />
        <Select
          placeholder="Solicitante"
          options={requesterOptions}
          value={filters.requester}
          onChange={(event) => onChange({ ...filters, requester: event.target.value })}
          wrapperClassName={styles.select}
        />
        <Select
          placeholder="Centro de custo"
          options={costCenterOptions}
          value={filters.costCenter}
          onChange={(event) => onChange({ ...filters, costCenter: event.target.value })}
          wrapperClassName={styles.select}
        />
        <Select
          placeholder="Categoria"
          options={categoryOptions}
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
          wrapperClassName={styles.select}
        />
      </div>

      {activeFilters.length > 0 && (
        <div className={styles.activeFilters}>
          {activeFilters.map((key) => (
            <Badge key={key} variant="outline">
              {FILTER_LABELS[key]}: {filters[key]}
              <button
                type="button"
                className={styles.removeFilter}
                onClick={() => onChange({ ...filters, [key]: '' })}
                aria-label={`Remover filtro ${FILTER_LABELS[key]}`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_OC_FILTERS)}>
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
