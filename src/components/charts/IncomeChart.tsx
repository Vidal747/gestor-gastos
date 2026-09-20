'use client';

import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCOP } from '@/lib/format';
import type { CategoryBreakdown } from '@/controllers/dashboardController';
import { axisTickStyle, CHART_COLORS, tooltipStyle, truncateLabel } from './chartTheme';
import { ChartEmpty } from './CardsChart';

const PALETTE = [
  CHART_COLORS.purple,
  CHART_COLORS.green,
  CHART_COLORS.blue,
  CHART_COLORS.amber,
  CHART_COLORS.purpleSoft,
  CHART_COLORS.red,
];

/** Vertical bars: current-month income by category. */
export function IncomeChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return <ChartEmpty icon={<TrendingUp className="h-5 w-5 shrink-0" aria-hidden />} text="Sin ingresos este mes." />;
  }

  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ ...axisTickStyle, textAnchor: 'middle' }}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={(v: string) => truncateLabel(v, 8)}
            height={32}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) => (v >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : `${Math.round(v / 1000)}k`)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatCOP(Number(value ?? 0)), 'Ingresos']}
            labelFormatter={(label) => String(label ?? '')}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
