'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, Check, ChevronDown, Lock } from 'lucide-react';
import { Chip } from '@heroui/react/chip';
import { Typography } from '@heroui/react/typography';

import { formatCOP, statusChipColor, statusLabel } from '@/lib/format';
import { PayForm } from '@/components/PayForm';

export type InstallmentRowData = {
  id: string;
  n: number;
  dueLabel: string;
  overdue: boolean;
  /** Debt: cuota. Purchase: total de la cuota. */
  amount: number;
  outstanding: number;
  status: string;
  principal?: number;
  interest?: number;
};

const PENDING_VISIBLE = 6;

export function InstallmentList({
  items,
  variant,
  payId,
}: {
  items: InstallmentRowData[];
  variant: 'debt' | 'purchase';
  /** Si se pasa, la cuota actual muestra pago inline. El backend solo permite pagar la primera pendiente. */
  payId?: string | null;
}) {
  const pending = items.filter((item) => item.outstanding > 0);
  const paid = items.filter((item) => item.outstanding <= 0);
  const [showAllPending, setShowAllPending] = useState(false);
  const [showPaid, setShowPaid] = useState(pending.length === 0 && paid.length > 0);
  const currentId = pending[0]?.id;
  const visiblePending = showAllPending ? pending : pending.slice(0, PENDING_VISIBLE);
  const canExpandPending = pending.length > PENDING_VISIBLE;
  const pendingTopRef = useRef<HTMLDivElement>(null);
  const paidTopRef = useRef<HTMLDivElement>(null);

  const togglePending = () => {
    if (showAllPending) {
      setShowAllPending(false);
      pendingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setShowAllPending(true);
    }
  };

  const collapsePaid = () => {
    setShowPaid(false);
    paidTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid gap-3">
      {pending.length === 0 && paid.length > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-success/10 p-4 text-sm">
          <BadgeCheck className="h-5 w-5 shrink-0 text-success" aria-hidden />
          <span className="min-w-0 text-success">Todo pagado. Nada pendiente.</span>
        </div>
      ) : null}

      {canExpandPending ? (
        <div ref={pendingTopRef} className="scroll-mt-20">
          <ExpandToggle
            expanded={showAllPending}
            moreLabel={`Ver ${pending.length - PENDING_VISIBLE} cuotas más`}
            onToggle={togglePending}
          />
        </div>
      ) : null}

      <ul className="grid gap-2">
        {visiblePending.map((item) => (
          <InstallmentRow
            key={item.id}
            item={item}
            variant={variant}
            isCurrent={item.id === currentId}
            payId={payId ?? null}
          />
        ))}
      </ul>

      {canExpandPending ? (
        <ExpandToggle
          expanded={showAllPending}
          moreLabel={`Ver ${pending.length - PENDING_VISIBLE} cuotas más`}
          onToggle={togglePending}
        />
      ) : null}

      {paid.length > 0 ? (
        <div ref={paidTopRef} className="grid scroll-mt-20 gap-2">
          <button
            type="button"
            onClick={() => setShowPaid((v) => !v)}
            className="flex items-center justify-between gap-2 rounded-2xl px-2 py-1 text-sm text-muted transition-colors hover:text-foreground"
            aria-expanded={showPaid}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
              <span className="truncate">
                Pagadas ({paid.length})
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showPaid ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {showPaid ? (
            <>
              <ul className="grid animate-fade-in gap-2">
                {paid.map((item) => (
                  <InstallmentRow key={item.id} item={item} variant={variant} isCurrent={false} payId={null} />
                ))}
              </ul>
              <ExpandToggle expanded moreLabel="" onToggle={collapsePaid} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ExpandToggle({
  expanded,
  moreLabel,
  onToggle,
}: {
  expanded: boolean;
  moreLabel: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex items-center justify-center gap-1.5 rounded-2xl border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-secondary/60 hover:text-foreground"
    >
      {expanded ? 'Ver menos' : moreLabel}
      <ChevronDown
        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        aria-hidden
      />
    </button>
  );
}

function InstallmentRow({
  item,
  variant,
  isCurrent,
  payId,
}: {
  item: InstallmentRowData;
  variant: 'debt' | 'purchase';
  isCurrent: boolean;
  payId: string | null;
}) {
  const isPaid = item.outstanding <= 0;
  const pct =
    item.amount > 0 ? Math.min(100, Math.max(0, Math.round(((item.amount - item.outstanding) / item.amount) * 100))) : 100;
  const canPay = payId !== null && isCurrent && !isPaid;
  const isLocked = !isPaid && !isCurrent;
  const [payOpen, setPayOpen] = useState(false);

  return (
    <li
      className={`min-w-0 rounded-2xl border p-3.5 transition-all duration-200 sm:p-4 ${
        isCurrent
          ? 'border-accent/60 bg-accent/5 shadow-[0_0_0_1px_var(--accent)]'
          : isPaid
            ? 'border-border/60 opacity-60'
            : item.overdue
              ? 'border-danger/40'
              : 'border-border/70 hover:border-border'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
            isPaid
              ? 'bg-success/15 text-success'
              : item.overdue
                ? 'bg-danger/15 text-danger'
                : isCurrent
                  ? 'bg-accent/20 text-accent'
                  : 'bg-surface-secondary text-muted'
          }`}
          aria-hidden
        >
          {isPaid ? <Check className="h-4 w-4" /> : item.n}
        </span>

        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium tabular-nums">Cuota {item.n}</span>
            {isCurrent ? (
              <Chip color="accent" size="sm" variant="soft">
                Actual
              </Chip>
            ) : null}
            {item.overdue && !isPaid ? (
              <span className="flex shrink-0 items-center gap-1 text-xs text-danger">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Vencida
              </span>
            ) : null}
          </div>
          <p className={`truncate text-xs ${item.overdue && !isPaid ? 'text-danger' : 'text-muted'}`}>
            Vence {item.dueLabel}
          </p>
          {variant === 'purchase' && item.principal !== undefined && item.interest !== undefined ? (
            <p className="truncate text-xs text-muted tabular-nums">
              Cap {formatCOP(item.principal)} · Int {formatCOP(item.interest)}
            </p>
          ) : null}
          {isLocked ? (
            <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted">
              <Lock className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">Se desbloquea al saldar la cuota {item.n - 1}</span>
            </p>
          ) : null}
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-foreground/10"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${isPaid ? 'bg-success' : item.overdue ? 'bg-danger' : 'bg-accent'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid shrink-0 justify-items-end gap-1">
          <span className="font-serif text-lg leading-none tracking-tight tabular-nums sm:text-xl">
            {formatCOP(item.amount)}
          </span>
          {isPaid ? (
            <Chip color="success" size="sm" variant="soft">
              {statusLabel(item.status)}
            </Chip>
          ) : (
            <>
              <span className={`text-xs tabular-nums ${item.overdue ? 'text-danger' : 'text-muted'}`}>
                Pend {formatCOP(item.outstanding)}
              </span>
              <Chip color={statusChipColor(item.status)} size="sm" variant="soft">
                {statusLabel(item.status)}
              </Chip>
            </>
          )}
        </div>
      </div>
      {canPay ? (
        <div className="mt-3 border-t border-border/60 pt-3">
          {!payOpen ? (
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:brightness-110 active:scale-[0.99]"
            >
              Pagar esta cuota
            </button>
          ) : (
            <div className="grid animate-fade-in gap-2">
              <PayForm
                kind={variant}
                id={payId as string}
                maxAmount={formatCOP(item.outstanding)}
                defaultAmount={item.outstanding.toFixed(2)}
                onSuccess={() => setPayOpen(false)}
              />
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="justify-self-center px-2 py-1 text-xs text-muted transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function InstallmentSummary({
  paid,
  total,
  stats,
}: {
  paid: number;
  total: number;
  stats: Array<{ icon: React.ReactNode; label: string; value: string; tone?: 'default' | 'success' | 'danger' }>;
}) {
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((paid / total) * 100))) : 0;
  return (
    <div className="grid gap-4">
      <div>
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <Typography color="muted" type="body-sm">
            Pagado {formatCOP(paid)} de {formatCOP(total)}
          </Typography>
          <span className="shrink-0 text-sm font-medium tabular-nums">{pct}%</span>
        </div>
        <div
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-foreground/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-accent to-success transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-surface-secondary/60 px-3.5 py-2.5"
          >
            <span className="shrink-0 text-muted" aria-hidden>
              {stat.icon}
            </span>
            <div className="grid min-w-0">
              <dt className="truncate text-xs text-muted">{stat.label}</dt>
              <dd
                className={`truncate text-sm font-medium tabular-nums ${
                  stat.tone === 'success' ? 'text-success' : stat.tone === 'danger' ? 'text-danger' : ''
                }`}
              >
                {stat.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
