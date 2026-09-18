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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
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
          <li key={saving.id}>
            <Link href={`/ahorros/${saving.id}`}>
              <Surface className="flex items-center justify-between gap-4 rounded-3xl p-5">
                <div>
                  <Typography type="h4">{saving.name}</Typography>
                  <Typography color="muted" type="body-sm">
                    {saving.targetDate ? `Objetivo ${formatDate(saving.targetDate)}` : 'Sin fecha límite'}
                  </Typography>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl tracking-tight">
                    {formatCOP(saving.savedAmount)}
                  </div>
                  <Typography color="muted" type="body-sm">
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
