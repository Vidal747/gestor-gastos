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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
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
            <li key={debt.id} className="min-w-0">
              <Link href={`/deudas/${debt.id}`} className="block">
                <Surface className="flex items-center justify-between gap-3 rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-5">
                  <div className="min-w-0">
                    <Typography className="truncate" type="h4">{debt.description}</Typography>
                    <Typography className="truncate" color="muted" type="body-sm">
                      {stance.headline}
                    </Typography>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={stance.iOwe ? 'font-serif text-xl text-danger tabular-nums sm:text-2xl' : 'font-serif text-xl text-success tabular-nums sm:text-2xl'}>
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
