import { notFound } from 'next/navigation';
import { CalendarClock, ListChecks, Percent, Wallet } from 'lucide-react';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Decimal from 'decimal.js';
import Link from 'next/link';

import { InstallmentList, InstallmentSummary, type InstallmentRowData } from '@/components/InstallmentList';
import { getCard } from '@/controllers/cardController';
import { AppError } from '@/lib/errors';
import { formatCOP, formatDate, statusLabel } from '@/lib/format';
import { requireUser } from '@/lib/requireUser';
import { cardStore } from '@/models/stores';

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; purchaseId: string }>;
}) {
  const userId = await requireUser();
  const { id, purchaseId } = await params;
  try {
    const card = await getCard(id, userId, { prisma: cardStore });
    const purchase = card.purchases.find((item) => item.id === purchaseId);
    if (!purchase) {
      notFound();
    }
    const current = purchase.installments.find((item) => item.outstanding.gt(0));
    const outstandingTotal = purchase.installments.reduce(
      (sum, item) => sum.plus(item.outstanding),
      new Decimal(0),
    );
    const paidTotal = purchase.totalAmount.minus(outstandingTotal);
    const interestTotal = purchase.installments.reduce((sum, item) => sum.plus(item.interest), new Decimal(0));
    const paidCount = purchase.installments.filter((item) => item.outstanding.lte(0)).length;
    const now = Date.now();
    const rows: InstallmentRowData[] = purchase.installments.map((item) => ({
      id: item.id,
      n: item.installmentNumber,
      dueLabel: formatDate(item.dueDate),
      overdue: item.dueDate.getTime() < now && item.outstanding.gt(0),
      amount: item.total.toNumber(),
      outstanding: item.outstanding.toNumber(),
      status: item.status,
      principal: item.principal.toNumber(),
      interest: item.interest.toNumber(),
    }));

    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
        <section className="mb-6 grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            <Link className="hover:text-foreground" href={`/tarjetas/${card.id}`}>
              {card.name}
            </Link>
          </Typography>
          <Typography className="break-words" type="h1">
            {purchase.description}
          </Typography>
          <Typography color="muted">
            {formatCOP(purchase.totalAmount)} · {statusLabel(purchase.status)}
          </Typography>
        </section>

        <Surface className="rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
          <InstallmentSummary
            paid={paidTotal.toNumber()}
            total={purchase.totalAmount.toNumber()}
            stats={[
              {
                icon: <Wallet className="h-4 w-4" aria-hidden />,
                label: 'Pendiente',
                value: formatCOP(outstandingTotal),
                tone: outstandingTotal.gt(0) ? 'danger' : 'success',
              },
              {
                icon: <Percent className="h-4 w-4" aria-hidden />,
                label: 'Intereses totales',
                value: formatCOP(interestTotal),
              },
              {
                icon: <CalendarClock className="h-4 w-4" aria-hidden />,
                label: 'Próximo vencimiento',
                value: current ? formatDate(current.dueDate) : '—',
              },
              {
                icon: <ListChecks className="h-4 w-4" aria-hidden />,
                label: 'Cuotas pagadas',
                value: `${paidCount}/${purchase.installments.length}`,
              },
            ]}
          />
        </Surface>

        <Surface className="mt-4 rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <Typography className="truncate" type="h4">
              Cuotas
            </Typography>
            <Typography className="shrink-0 text-sm tabular-nums" color="muted">
              {purchase.installments.length} en total
            </Typography>
          </div>
          <InstallmentList items={rows} variant="purchase" payId={current ? purchase.id : null} />
        </Surface>
      </main>
    );
  } catch (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
