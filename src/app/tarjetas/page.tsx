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
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
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
          <li key={card.id}>
            <Link href={`/tarjetas/${card.id}`}>
              <Surface className="flex items-center justify-between gap-4 rounded-3xl p-5">
                <div>
                  <Typography type="h4">{card.name}</Typography>
                  <Typography color="muted" type="body-sm">
                    {card.bank}
                  </Typography>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl tracking-tight">{formatCOP(card.availableCredit)}</div>
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
