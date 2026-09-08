export type DashboardPeriod = '30d' | '90d' | '6m' | '12m';

export const DEFAULT_PERIOD: DashboardPeriod = '6m';

export const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
];

// Number of month buckets the trend chart should draw for each preset. Day-based
// presets still span whole months so the chart's first bar isn't a stub.
const MONTHS_BY_PERIOD: Record<DashboardPeriod, number> = {
  '30d': 2,
  '90d': 4,
  '6m': 6,
  '12m': 12,
};

// searchParams are untrusted input — anything unrecognized falls back to the default.
export function parsePeriod(value: string | undefined): DashboardPeriod {
  return PERIOD_OPTIONS.some((option) => option.value === value)
    ? (value as DashboardPeriod)
    : DEFAULT_PERIOD;
}

export interface DashboardRange {
  dateFrom: string;
  dateTo: string;
  months: number;
}

export function resolvePeriod(period: DashboardPeriod): DashboardRange {
  const now = new Date();
  const dateFrom = new Date(now);

  if (period === '30d') dateFrom.setUTCDate(dateFrom.getUTCDate() - 30);
  if (period === '90d') dateFrom.setUTCDate(dateFrom.getUTCDate() - 90);
  if (period === '6m') dateFrom.setUTCMonth(dateFrom.getUTCMonth() - 6);
  if (period === '12m') dateFrom.setUTCMonth(dateFrom.getUTCMonth() - 12);

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo: now.toISOString(),
    months: MONTHS_BY_PERIOD[period],
  };
}
