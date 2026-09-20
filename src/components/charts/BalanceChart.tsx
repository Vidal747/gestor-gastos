'use client';

import { ArrowDownToLine, ArrowUpFromLine, Scale } from 'lucide-react';

import { formatCOP } from '@/lib/format';

type Props = {
  iOwe: number;
  theyOwe: number;
};

/** Segmented bar: what I owe vs what they owe me. Pure divs, no overflow. */
export function BalanceChart({ iOwe, theyOwe }: Props) {
  const total = iOwe + theyOwe;
  if (total <= 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-surface-secondary/60 p-4 text-sm text-muted">
        <Scale className="h-5 w-5 shrink-0" aria-hidden />
        <span className="min-w-0">Están a paz. Sin deudas entre personas.</span>
      </div>
    );
  }
  const iOwePct = Math.max(4, Math.round((iOwe / total) * 100));

  return (
    <div className="grid gap-3">
      <div className="flex h-4 w-full gap-1 overflow-hidden rounded-full" aria-hidden>
        <div
          className="h-full rounded-full bg-danger transition-all duration-500"
          style={{ width: `${iOwePct}%` }}
        />
        <div
          className="h-full flex-1 rounded-full bg-success/80 transition-all duration-500"
        />
      </div>
      <div className="grid gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger" aria-hidden />
          <span className="flex min-w-0 items-center gap-1.5 text-muted">
            <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Debes</span>
          </span>
          <span className="ms-auto shrink-0 font-medium tabular-nums text-danger">{formatCOP(iOwe)}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" aria-hidden />
          <span className="flex min-w-0 items-center gap-1.5 text-muted">
            <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Te deben</span>
          </span>
          <span className="ms-auto shrink-0 font-medium tabular-nums text-success">{formatCOP(theyOwe)}</span>
        </div>
      </div>
    </div>
  );
}
