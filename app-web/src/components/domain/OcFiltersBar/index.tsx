'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './styles.module.scss';

export interface OcFilters {
  search: string;
  companyId: string;
  supplierCode: string;
  requesterCode: string;
  costCenter: string;
}

export const EMPTY_OC_FILTERS: OcFilters = {
  search: '',
  companyId: '',
  supplierCode: '',
  requesterCode: '',
  costCenter: '',
};

type TextFilterKey = 'supplierCode' | 'requesterCode' | 'costCenter';

const TEXT_FILTER_LABELS: Record<TextFilterKey, string> = {
  supplierCode: 'Fornecedor',
  requesterCode: 'Solicitante',
  costCenter: 'Centro de custo',
};

interface OcFiltersBarProps {
  filters: OcFilters;
  onChange: (filters: OcFilters) => void;
  companyOptions: SelectOption[];
  showCompanyFilter?: boolean;
}

export function OcFiltersBar({
  filters,
  onChange,
  companyOptions,
  showCompanyFilter = false,
}: OcFiltersBarProps) {
  const companyLabel = companyOptions.find((option) => option.value === filters.companyId)?.label;

  const activeTextFilters = (Object.keys(TEXT_FILTER_LABELS) as TextFilterKey[]).filter(
    (key) => filters[key],
  );

  const hasActiveFilters =
    Boolean(showCompanyFilter && filters.companyId) || activeTextFilters.length > 0;

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
        {showCompanyFilter && (
          <Select
            placeholder="Empresa"
            options={companyOptions}
            value={filters.companyId}
            onChange={(event) => onChange({ ...filters, companyId: event.target.value })}
            wrapperClassName={styles.select}
          />
        )}
        <Input
          placeholder="Fornecedor"
          value={filters.supplierCode}
          onChange={(event) => onChange({ ...filters, supplierCode: event.target.value })}
          wrapperClassName={styles.select}
        />
        <Input
          placeholder="Solicitante"
          value={filters.requesterCode}
          onChange={(event) => onChange({ ...filters, requesterCode: event.target.value })}
          wrapperClassName={styles.select}
        />
        <Input
          placeholder="Centro de custo"
          value={filters.costCenter}
          onChange={(event) => onChange({ ...filters, costCenter: event.target.value })}
          wrapperClassName={styles.select}
        />
      </div>

      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          {showCompanyFilter && filters.companyId && companyLabel && (
            <Badge variant="outline">
              Empresa: {companyLabel}
              <button
                type="button"
                className={styles.removeFilter}
                onClick={() => onChange({ ...filters, companyId: '' })}
                aria-label="Remover filtro Empresa"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {activeTextFilters.map((key) => (
            <Badge key={key} variant="outline">
              {TEXT_FILTER_LABELS[key]}: {filters[key]}
              <button
                type="button"
                className={styles.removeFilter}
                onClick={() => onChange({ ...filters, [key]: '' })}
                aria-label={`Remover filtro ${TEXT_FILTER_LABELS[key]}`}
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
