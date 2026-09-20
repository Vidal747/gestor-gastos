import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';

import { ButtonLink } from '@/components/ButtonLink';
import { listSavingGoals } from '@/controllers/savingController';
import { formatCOP, formatDate } from '@/lib/format';
import { requireUser } from '@/lib/requireUser';
import { savingStore } from '@/models/stores';

export default async function SavingsPage() {
  const userId = await requireUser();
  const savings = await listSavingGoals(userId, { prisma: savingStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Ahorros
          </Typography>
          <Typography type="h1">La meta, y quién ya puso.</Typography>
        </div>
        <ButtonLink href="/ahorros/nueva">Nuevo ahorro</ButtonLink>
      </section>
      <ul className="grid gap-3">
        {savings.length === 0 ? (
          <li>
            <Surface className="rounded-3xl p-6">
              <Typography color="muted">Todavía no hay metas de ahorro.</Typography>
            </Surface>
          </li>
        ) : null}
        {savings.map((saving) => (
            <li key={saving.id} className="min-w-0">
              <Link href={`/ahorros/${saving.id}`} className="block">
                <Surface className="flex items-center justify-between gap-3 rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-5">
                  <div className="min-w-0">
                    <Typography className="truncate" type="h4">{saving.name}</Typography>
                    <Typography className="truncate" color="muted" type="body-sm">
                      {saving.targetDate ? `Objetivo ${formatDate(saving.targetDate)}` : 'Sin fecha límite'}
                    </Typography>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-serif text-xl tracking-tight tabular-nums sm:text-2xl">
                      {formatCOP(saving.savedAmount)}
                    </div>
                    <Typography className="truncate" color="muted" type="body-sm">
                      de {formatCOP(saving.targetAmount)}
                    </Typography>
                  </div>
              </Surface>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
