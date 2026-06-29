'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCssVars } from '@/lib/useCssVars';
import type { MonthlyStat } from '@/lib/mock/types';

export function MonthlyStatusChart({ data }: { data: MonthlyStat[] }) {
  const colors = useCssVars([
    '--chart-1',
    '--chart-3',
    '--chart-4',
    '--color-border-primary',
    '--color-text-secondary',
  ]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors['--color-border-primary']}
          vertical={false}
        />
        <XAxis dataKey="month" stroke={colors['--color-text-secondary']} fontSize={12} />
        <YAxis stroke={colors['--color-text-secondary']} fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="aprovadas"
          name="Aprovadas"
          fill={colors['--chart-1']}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="rejeitadas"
          name="Rejeitadas"
          fill={colors['--chart-3']}
          radius={[4, 4, 0, 0]}
        />
        <Bar dataKey="semRegra" name="Sem regra" fill={colors['--chart-4']} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
