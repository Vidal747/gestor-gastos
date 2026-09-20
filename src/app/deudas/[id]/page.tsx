import { notFound, redirect } from 'next/navigation';
import { CalendarClock, ListChecks, Wallet } from 'lucide-react';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { EditDebtForm } from '@/components/EditDebtForm';
import { InstallmentList, InstallmentSummary, type InstallmentRowData } from '@/components/InstallmentList';
import { getDebt } from '@/controllers/debtController';
import { listRelationships } from '@/controllers/relationshipController';
import { AppError } from '@/lib/errors';
import { debtStance, formatCOP, formatDate } from '@/lib/format';
import { requireCurrentUser } from '@/lib/requireUser';
import { debtStore, relationshipStore } from '@/models/stores';

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  try {
    const [debt, people] = await Promise.all([
      getDebt(id, user.id, { prisma: debtStore }),
      listRelationships(user.id, { prisma: relationshipStore }),
    ]);
    const current = debt.installments.find((item) => item.outstanding.gt(0));
    const stance = debtStance(debt, user.id);
    const paidTotal = debt.originalAmount.minus(debt.remainingAmount);
    const paidCount = debt.installments.filter((item) => item.outstanding.lte(0)).length;
    const now = Date.now();
    const rows: InstallmentRowData[] = debt.installments.map((item) => ({
      id: item.id,
      n: item.installmentNumber,
      dueLabel: formatDate(item.dueDate),
      overdue: item.dueDate.getTime() < now && item.outstanding.gt(0),
      amount: item.amount.toNumber(),
      outstanding: item.outstanding.toNumber(),
      status: item.status,
    }));

    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
        <section className="mb-6 grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            {stance.headline}
          </Typography>
          <Typography className="break-words" type="h1">
            {debt.description}
          </Typography>
          <Typography color="muted">
            Pendiente {formatCOP(debt.remainingAmount)} de {formatCOP(debt.originalAmount)}
          </Typography>
        </section>

        <Surface className="rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
          <InstallmentSummary
            paid={paidTotal.toNumber()}
            total={debt.originalAmount.toNumber()}
            stats={[
              {
                icon: <Wallet className="h-4 w-4" aria-hidden />,
                label: 'Pendiente',
                value: formatCOP(debt.remainingAmount),
                tone: debt.remainingAmount.gt(0) ? 'danger' : 'success',
              },
              {
                icon: <CalendarClock className="h-4 w-4" aria-hidden />,
                label: 'Próximo vencimiento',
                value: current ? formatDate(current.dueDate) : '—',
              },
              {
                icon: <ListChecks className="h-4 w-4" aria-hidden />,
                label: 'Cuotas pagadas',
                value: `${paidCount}/${debt.installments.length}`,
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
              {debt.installments.length} en total
            </Typography>
          </div>
          <InstallmentList
            items={rows}
            variant="debt"
            payId={current && debt.ownerUserId === user.id ? debt.id : null}
          />
        </Surface>

        {debt.ownerUserId === user.id ? (
          <Surface className="mt-4 max-w-md rounded-3xl p-6">
            <Typography type="h4">Administrar</Typography>
            <div className="mt-4">
              <EditDebtForm
                currentUserId={user.id}
                debt={{
                  id: debt.id,
                  description: debt.description,
                  ownerRole: debt.ownerRole,
                  counterpartyUserId: debt.counterpartyUserId,
                  counterpartyName: debt.counterpartyName,
                  counterpartyLabel: debt.counterpartyLabel,
                }}
                people={people.map((p) => ({
                  id: p.peer.id,
                  name: p.peer.name,
                  inviteCodeLabel: p.peer.inviteCodeLabel,
                }))}
              />
            </div>
          </Surface>
        ) : null}
      </main>
    );
  } catch (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
