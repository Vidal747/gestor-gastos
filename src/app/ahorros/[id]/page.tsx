import { notFound } from 'next/navigation';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { ContributionForm } from '@/components/ContributionForm';
import { EditSavingForm } from '@/components/EditSavingForm';
import { getSavingGoal } from '@/controllers/savingController';
import { AppError } from '@/lib/errors';
import { formatCOP, formatDate } from '@/lib/format';
import { requireCurrentUser } from '@/lib/requireUser';
import { savingStore } from '@/models/stores';

export default async function SavingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const { id } = await params;
  try {
    const saving = await getSavingGoal(id, user.id, { prisma: savingStore });
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
        <section className="mb-8 grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Ahorro
          </Typography>
          <Typography type="h1">{saving.name}</Typography>
          {saving.description ? <Typography color="muted">{saving.description}</Typography> : null}
          <Typography color="muted">
            Van {formatCOP(saving.savedAmount)} de {formatCOP(saving.targetAmount)}. Faltan {formatCOP(saving.remainingAmount)}.
          </Typography>
          {saving.targetDate ? (
            <Typography color="muted" type="body-sm">
              Fecha objetivo {formatDate(saving.targetDate)}
            </Typography>
          ) : null}
        </section>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Surface className="rounded-3xl p-6">
            <Typography type="h4">Quién ha puesto</Typography>
            <ul className="mt-4 grid gap-3">
              {saving.contributions.length === 0 ? (
                <li>
                  <Typography color="muted">Todavía no hay aportes.</Typography>
                </li>
              ) : null}
              {saving.contributions.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <Typography weight="medium">{item.userName}</Typography>
                    <Typography color="muted" type="body-sm">
                      {formatDate(item.contributionDate)}
                      {item.description ? ` · ${item.description}` : ''}
                    </Typography>
                  </div>
                  <span className="font-serif text-xl">{formatCOP(item.amount)}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface className="rounded-3xl p-6">
            <Typography type="h4">Registrar aporte</Typography>
            <div className="mt-4">
              <ContributionForm savingGoalId={saving.id} />
            </div>
          </Surface>
        </div>
        {saving.ownerUserId === user.id ? (
          <Surface className="mt-4 max-w-md rounded-3xl p-6">
            <Typography type="h4">Administrar</Typography>
            <div className="mt-4">
              <EditSavingForm
                saving={{
                  id: saving.id,
                  name: saving.name,
                  description: saving.description,
                  targetAmount: saving.targetAmount.toFixed(2),
                  targetDate: saving.targetDate ? saving.targetDate.toISOString().slice(0, 10) : null,
                  hasContributions: saving.savedAmount.gt(0),
                }}
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
