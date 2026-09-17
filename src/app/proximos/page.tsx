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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
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
          <li key={item.id}>
            <Link href={item.href}>
              <Surface className="flex items-center justify-between gap-4 rounded-3xl p-5">
                <div>
                  <Typography type="h4">{item.title}</Typography>
                  <Typography color="muted" type="body-sm">
                    {formatDate(item.dueDate)}
                  </Typography>
                </div>
                <span className="font-serif text-2xl tracking-tight">{formatCOP(item.outstanding)}</span>
              </Surface>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
