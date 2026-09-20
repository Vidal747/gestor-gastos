'use client';

import { CreditCard } from 'lucide-react';
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
import type { CardBreakdown } from '@/controllers/dashboardController';
import { axisTickStyle, CHART_COLORS, tooltipStyle, truncateLabel } from './chartTheme';

/** Stacked horizontal bars: used vs available per card. */
export function CardsChart({ data }: { data: CardBreakdown[] }) {
  if (data.length === 0) {
    return <ChartEmpty icon={<CreditCard className="h-5 w-5 shrink-0" aria-hidden />} text="Sin tarjetas registradas." />;
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
              name === 'used' ? 'Usado' : 'Disponible',
            ]}
            labelFormatter={(label) => String(label ?? '')}
          />
          <Bar dataKey="used" stackId="card" fill={CHART_COLORS.purple} radius={[0, 0, 0, 0]} maxBarSize={22} />
          <Bar dataKey="available" stackId="card" fill={CHART_COLORS.track} radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex h-32 items-center gap-3 rounded-2xl bg-surface-secondary/60 p-4 text-sm text-muted">
      {icon}
      <span className="min-w-0">{text}</span>
    </div>
  );
}
