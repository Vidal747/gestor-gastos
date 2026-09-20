'use client';

import { CalendarClock } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCOP } from '@/lib/format';
import type { DayBreakdown } from '@/controllers/dashboardController';
import { axisTickStyle, CHART_COLORS, tooltipStyle } from './chartTheme';
import { ChartEmpty } from './CardsChart';

/** Area chart: amounts due per day over the next 7 days. */
export function UpcomingChart({ data }: { data: DayBreakdown[] }) {
  const hasAny = data.some((d) => d.amount > 0);
  if (!hasAny) {
    return <ChartEmpty icon={<CalendarClock className="h-5 w-5 shrink-0" aria-hidden />} text="Nada que pagar esta semana." />;
  }

  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="upcomingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.55} />
              <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="fullDay"
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            interval={0}
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
            formatter={(value) => [formatCOP(Number(value ?? 0)), 'A pagar']}
            labelFormatter={(label, payload) => {
              const row = payload?.[0]?.payload as DayBreakdown | undefined;
              return row ? `${row.fullDay} ${row.day}` : String(label ?? '');
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={CHART_COLORS.purple}
            strokeWidth={2.5}
            fill="url(#upcomingFill)"
            dot={{ r: 3, fill: CHART_COLORS.purple, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART_COLORS.purple, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
