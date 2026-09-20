'use client';

import { PiggyBank } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCOP } from '@/lib/format';
import type { SavingBreakdown } from '@/controllers/dashboardController';
import { axisTickStyle, CHART_COLORS, tooltipStyle, truncateLabel } from './chartTheme';
import { ChartEmpty } from './CardsChart';

/** Stacked horizontal bars: saved vs remaining per goal. */
export function SavingsChart({ data }: { data: SavingBreakdown[] }) {
  if (data.length === 0) {
    return <ChartEmpty icon={<PiggyBank className="h-5 w-5 shrink-0" aria-hidden />} text="Sin metas de ahorro." />;
  }

  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }} barCategoryGap="28%">
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : `${Math.round(v / 1000)}k`)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ ...axisTickStyle, textAnchor: 'end' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => truncateLabel(v, 11)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatCOP(Number(value ?? 0)),
              name === 'saved' ? 'Ahorrado' : 'Falta',
            ]}
            labelFormatter={(label) => String(label ?? '')}
          />
          <Bar dataKey="saved" stackId="goal" fill={CHART_COLORS.green} maxBarSize={22} />
          <Bar dataKey="remaining" stackId="goal" fill={CHART_COLORS.track} radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
