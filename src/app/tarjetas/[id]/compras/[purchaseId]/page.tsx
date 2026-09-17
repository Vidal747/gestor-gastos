import { notFound } from 'next/navigation';
import { Surface } from '@heroui/react/surface';
import { Table } from '@heroui/react/table';
import { Typography } from '@heroui/react/typography';

import { PayForm } from '@/components/PayForm';
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
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
        <section className="mb-8 grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            {card.name}
          </Typography>
          <Typography type="h1">{purchase.description}</Typography>
          <Typography color="muted">
            {formatCOP(purchase.totalAmount)} · {statusLabel(purchase.status)}
          </Typography>
        </section>
        <Surface className="rounded-3xl p-4 sm:p-6">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Cuotas de la compra">
                <Table.Header>
                  <Table.Column isRowHeader>#</Table.Column>
                  <Table.Column>Vence</Table.Column>
                  <Table.Column>Capital</Table.Column>
                  <Table.Column>Interés</Table.Column>
                  <Table.Column>Total</Table.Column>
                  <Table.Column>Pendiente</Table.Column>
                </Table.Header>
                <Table.Body>
                  {purchase.installments.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell>{item.installmentNumber}</Table.Cell>
                      <Table.Cell>{formatDate(item.dueDate)}</Table.Cell>
                      <Table.Cell>{formatCOP(item.principal)}</Table.Cell>
                      <Table.Cell>{formatCOP(item.interest)}</Table.Cell>
                      <Table.Cell>{formatCOP(item.total)}</Table.Cell>
                      <Table.Cell>{formatCOP(item.outstanding)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Surface>
        {current ? (
          <Surface className="mt-4 max-w-md rounded-3xl p-6">
            <Typography type="h4">Pagar la cuota {current.installmentNumber}</Typography>
            <div className="mt-4">
              <PayForm kind="purchase" id={purchase.id} maxAmount={formatCOP(current.outstanding)} />
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
