import { Chip } from '@heroui/react/chip';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';

import { ButtonLink } from '@/components/ButtonLink';
import { listDebts } from '@/controllers/debtController';
import { debtStance, formatCOP, statusChipColor, statusLabel } from '@/lib/format';
import { requireUser } from '@/lib/requireUser';
import { debtStore } from '@/models/stores';

export default async function DebtsPage() {
  const userId = await requireUser();
  const debts = await listDebts(userId, { prisma: debtStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Deudas
          </Typography>
          <Typography type="h1">Cuentas con nombre y apellido.</Typography>
        </div>
        <ButtonLink href="/deudas/nueva">Nueva deuda</ButtonLink>
      </section>
      <ul className="grid gap-3">
        {debts.length === 0 ? (
          <li>
            <Surface className="rounded-3xl p-6">
              <Typography color="muted">No hay deudas todavía.</Typography>
            </Surface>
          </li>
        ) : null}
        {debts.map((debt) => {
          const stance = debtStance(debt, userId);
          return (
            <li key={debt.id}>
              <Link href={`/deudas/${debt.id}`}>
                <Surface className="flex items-center justify-between gap-4 rounded-3xl p-5">
                  <div>
                    <Typography type="h4">{debt.description}</Typography>
                    <Typography color="muted" type="body-sm">
                      {stance.headline}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <div className={stance.iOwe ? 'font-serif text-2xl text-danger' : 'font-serif text-2xl text-success'}>
                      {formatCOP(debt.remainingAmount)}
                    </div>
                    <Chip color={statusChipColor(debt.status)} size="sm" variant="soft">
                      {statusLabel(debt.status)}
                    </Chip>
                  </div>
                </Surface>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
