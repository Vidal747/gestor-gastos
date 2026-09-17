import { notFound } from 'next/navigation';
import { Chip } from '@heroui/react/chip';
import { Surface } from '@heroui/react/surface';
import { Table } from '@heroui/react/table';
import { Typography } from '@heroui/react/typography';

import { PayForm } from '@/components/PayForm';
import { getDebt } from '@/controllers/debtController';
import { AppError } from '@/lib/errors';
import { debtStance, formatCOP, formatDate, statusChipColor, statusLabel } from '@/lib/format';
import { requireUser } from '@/lib/requireUser';
import { debtStore } from '@/models/stores';

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await params;
  try {
    const debt = await getDebt(id, userId, { prisma: debtStore });
    const current = debt.installments.find((item) => item.outstanding.gt(0));
    const stance = debtStance(debt, userId);
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
        <section className="mb-8 grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            {stance.headline}
          </Typography>
          <Typography type="h1">{debt.description}</Typography>
          <Typography color="muted">
            Pendiente {formatCOP(debt.remainingAmount)} de {formatCOP(debt.originalAmount)}
          </Typography>
        </section>
        <Surface className="rounded-3xl p-4 sm:p-6">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Cuotas de la deuda">
                <Table.Header>
                  <Table.Column isRowHeader>#</Table.Column>
                  <Table.Column>Vence</Table.Column>
                  <Table.Column>Cuota</Table.Column>
                  <Table.Column>Pendiente</Table.Column>
                  <Table.Column>Estado</Table.Column>
                </Table.Header>
                <Table.Body>
                  {debt.installments.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell>{item.installmentNumber}</Table.Cell>
                      <Table.Cell>{formatDate(item.dueDate)}</Table.Cell>
                      <Table.Cell>{formatCOP(item.amount)}</Table.Cell>
                      <Table.Cell>{formatCOP(item.outstanding)}</Table.Cell>
                      <Table.Cell>
                        <Chip color={statusChipColor(item.status)} size="sm" variant="soft">
                          {statusLabel(item.status)}
                        </Chip>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Surface>
        {current && debt.ownerUserId === userId ? (
          <Surface className="mt-4 max-w-md rounded-3xl p-6">
            <Typography type="h4">Pagar la cuota {current.installmentNumber}</Typography>
            <div className="mt-4">
              <PayForm kind="debt" id={debt.id} maxAmount={formatCOP(current.outstanding)} />
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
