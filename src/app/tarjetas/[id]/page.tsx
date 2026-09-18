import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Chip } from '@heroui/react/chip';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { PurchaseForm } from '@/components/PurchaseForm';
import { RateForm } from '@/components/RateForm';
import { EditCardForm } from '@/components/EditCardForm';
import { getCard } from '@/controllers/cardController';
import { AppError } from '@/lib/errors';
import { formatCOP, statusChipColor, statusLabel } from '@/lib/format';
import { requireUser } from '@/lib/requireUser';
import { cardStore } from '@/models/stores';

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await params;
  try {
    const card = await getCard(id, userId, { prisma: cardStore });
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
        <section className="mb-8 grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            {card.bank}
          </Typography>
          <Typography type="h1">{card.name}</Typography>
          <Typography color="muted">
            Cupo {formatCOP(card.creditLimit)} · Disponible {formatCOP(card.availableCredit)}
          </Typography>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="rounded-3xl p-6">
            <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
              Tasa
            </Typography>
            <Typography className="mt-1" type="h3">
              IEA viva
            </Typography>
            <Typography className="mt-2" color="muted" type="body-sm">
              Las cuotas pendientes se recalculan con esta tasa. Las ya pagadas no se tocan.
            </Typography>
            <RateForm cardId={card.id} currentPercent={card.annualRate.times(100).toFixed(2)} />
          </Surface>
          <Surface className="rounded-3xl p-6">
            <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
              Compras
            </Typography>
            <ul className="mt-4 grid gap-3">
              {card.purchases.length === 0 ? (
                <li>
                  <Typography color="muted" type="body-sm">
                    Todavía no hay compras.
                  </Typography>
                </li>
              ) : null}
              {card.purchases.map((purchase) => (
                <li key={purchase.id}>
                  <Link className="flex items-center justify-between gap-3" href={`/tarjetas/${card.id}/compras/${purchase.id}`}>
                    <div>
                      <Typography weight="medium">{purchase.description}</Typography>
                      <Chip color={statusChipColor(purchase.status)} size="sm" variant="soft">
                        {statusLabel(purchase.status)}
                      </Chip>
                    </div>
                    <span>{formatCOP(purchase.totalAmount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
        <Surface className="mt-4 rounded-3xl p-6">
          <Typography type="h3">Nueva compra</Typography>
          <PurchaseForm cardId={card.id} />
        </Surface>
        <Surface className="mt-4 max-w-md rounded-3xl p-6">
          <Typography type="h4">Administrar</Typography>
          <div className="mt-4">
            <EditCardForm
              card={{
                id: card.id,
                name: card.name,
                bank: card.bank,
                creditLimit: card.creditLimit.toFixed(2),
                cutoffDay: card.cutoffDay,
                dueDay: card.dueDay,
                hasPurchases: card.purchases.length > 0,
              }}
            />
          </div>
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
