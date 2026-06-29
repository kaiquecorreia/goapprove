'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useCssVars } from '@/lib/useCssVars';
import type { CompanyDistributionEntry } from '@/lib/mock/types';

const COLOR_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4'];

export function CompanyDistributionChart({ data }: { data: CompanyDistributionEntry[] }) {
  const colors = useCssVars(COLOR_VARS);
  const palette = COLOR_VARS.map((name) => colors[name]).filter(Boolean);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={palette[index % palette.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
