import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';

import { ButtonLink } from '@/components/ButtonLink';
import { listCards } from '@/controllers/cardController';
import { formatCOP } from '@/lib/format';
import { requireUser } from '@/lib/requireUser';
import { cardStore } from '@/models/stores';

export default async function CardsPage() {
  const userId = await requireUser();
  const cards = await listCards(userId, { prisma: cardStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Tarjetas
          </Typography>
          <Typography type="h1">El banco por un lado, las personas por otro.</Typography>
        </div>
        <ButtonLink href="/tarjetas/nueva">Nueva tarjeta</ButtonLink>
      </section>
      <ul className="grid gap-3">
        {cards.length === 0 ? (
          <li>
            <Surface className="rounded-3xl p-6">
              <Typography color="muted">No hay tarjetas todavía.</Typography>
            </Surface>
          </li>
        ) : null}
        {cards.map((card) => (
            <li key={card.id} className="min-w-0">
              <Link href={`/tarjetas/${card.id}`} className="block">
                <Surface className="flex items-center justify-between gap-3 rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-5">
                  <div className="min-w-0">
                    <Typography className="truncate" type="h4">{card.name}</Typography>
                    <Typography className="truncate" color="muted" type="body-sm">
                      {card.bank}
                    </Typography>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-serif text-xl tracking-tight tabular-nums sm:text-2xl">{formatCOP(card.availableCredit)}</div>
                    <Typography color="muted" type="body-xs">
                      disponible
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
