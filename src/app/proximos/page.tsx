import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';

import { listUpcoming } from '@/controllers/upcomingController';
import { formatCOP, formatDate } from '@/lib/format';
import { requireUser } from '@/lib/requireUser';
import { cardStore, debtStore } from '@/models/stores';

export default async function UpcomingPage() {
  const userId = await requireUser();
  const items = await listUpcoming(userId, { debts: debtStore, cards: cardStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
      <section className="mb-8 grid gap-2">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Calendario
        </Typography>
        <Typography type="h1">Lo que hay que pagar, en orden.</Typography>
      </section>
      <ul className="grid gap-3">
        {items.length === 0 ? (
          <li>
            <Surface className="rounded-3xl p-6">
              <Typography color="muted">No hay cuotas pendientes.</Typography>
            </Surface>
          </li>
        ) : null}
        {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <Link href={item.href} className="block">
                <Surface className="flex items-center justify-between gap-3 rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-5">
                  <div className="min-w-0">
                    <Typography className="truncate" type="h4">{item.title}</Typography>
                    <Typography color="muted" type="body-sm">
                      {formatDate(item.dueDate)}
                    </Typography>
                  </div>
                  <span className="shrink-0 font-serif text-xl tracking-tight tabular-nums sm:text-2xl">{formatCOP(item.outstanding)}</span>
              </Surface>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
