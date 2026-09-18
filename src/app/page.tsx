import { Chip } from '@heroui/react/chip';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';

import { ButtonLink } from '@/components/ButtonLink';
import { CopyCode } from '@/components/CopyCode';
import { getDashboard } from '@/controllers/dashboardController';
import { directionChipColor, formatCOP, formatDate, relationshipCopy } from '@/lib/format';
import { formatInviteCode } from '@/lib/inviteCode';
import { getOptionalUser } from '@/lib/currentUser';
import { accountStore, cardStore, debtStore, incomeStore, relationshipStore, savingStore } from '@/models/stores';

export default async function HomePage() {
  const user = await getOptionalUser();
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
        <section className="mb-8 grid max-w-2xl gap-3">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Finanzas entre personas
          </Typography>
          <Typography type="h1">Saber a quién le debes, sin cédulas ni IDs raros.</Typography>
          <Typography color="muted">
            Cada persona tiene un código. Lo compartes, se vinculan y las deudas quedan en lenguaje claro: le debo, me
            debe, estamos a paz.
          </Typography>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          <Surface className="rounded-3xl p-6">
            <Typography type="h3">Tu código es la llave</Typography>
            <Typography className="mt-2" color="muted" type="body-sm">
              Nadie tiene que copiar identificadores técnicos. Solo un código corto, como una clave de casa.
            </Typography>
          </Surface>
          <Surface className="rounded-3xl p-6">
            <Typography type="h3">Empieza aquí</Typography>
            <div className="mt-4 flex flex-col gap-3">
              <ButtonLink href="/register">Crear cuenta</ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                Ya tengo cuenta
              </ButtonLink>
            </div>
          </Surface>
        </div>
      </main>
    );
  }

  const dashboard = await getDashboard(user.id, {
    debts: debtStore,
    cards: cardStore,
    savings: savingStore,
    relationships: relationshipStore,
    accounts: accountStore,
    incomes: incomeStore,
  });

  const hasData =
    dashboard.relationshipsCount > 0 ||
    dashboard.activeDebtCount > 0 ||
    dashboard.cardCreditTotal.gt(0) ||
    dashboard.savingsCount > 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-6 grid gap-1">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Hola, {user.name}
        </Typography>
        <Typography type="h1">El estado de la casa, en una mirada.</Typography>
      </section>

      {!hasData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="rounded-3xl p-6">
            <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
              Tu código
            </Typography>
            <p className="mt-2 font-serif text-4xl tracking-[0.12em]">{formatInviteCode(user.inviteCode)}</p>
            <Typography className="mt-2" color="muted" type="body-sm">
              Compártelo para que te agreguen como relación de negocio.
            </Typography>
            <div className="mt-4">
              <CopyCode code={user.inviteCode} />
            </div>
          </Surface>
          <Surface className="rounded-3xl p-6">
            <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
              Primeros pasos
            </Typography>
            <Typography className="mt-1" type="h3">
              Todavía no hay datos
            </Typography>
            <Typography className="mt-2" color="muted" type="body-sm">
              Empezá por agregar personas, deudas o tarjetas. Todo se ve desde acá.
            </Typography>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/relaciones">Personas</ButtonLink>
              <ButtonLink href="/deudas/nueva" variant="secondary">
                Nueva deuda
              </ButtonLink>
            </div>
          </Surface>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Surface className="rounded-3xl p-5">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Personas
              </Typography>
              <p className="mt-2 font-serif text-3xl tracking-tight">{dashboard.relationshipsCount}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {dashboard.iOweTotal.gt(0) ? (
                  <span className="text-danger">Debes {formatCOP(dashboard.iOweTotal)}</span>
                ) : null}
                {dashboard.theyOweTotal.gt(0) ? (
                  <span className="text-success">Te deben {formatCOP(dashboard.theyOweTotal)}</span>
                ) : null}
                {dashboard.iOweTotal.eq(0) && dashboard.theyOweTotal.eq(0) ? (
                  <span className="text-muted">Sin deudas entre personas</span>
                ) : null}
              </div>
            </Surface>
            <Surface className="rounded-3xl p-5">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Deudas
              </Typography>
              <p className="mt-2 font-serif text-3xl tracking-tight">{dashboard.activeDebtCount}</p>
              <Typography className="mt-2 text-sm text-muted">
                {dashboard.activeDebtCount === 0 ? 'Sin deudas activas' : 'Deudas activas'}
              </Typography>
            </Surface>
            <Surface className="rounded-3xl p-5">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Cuentas
              </Typography>
              <p className="mt-2 font-serif text-3xl tracking-tight">{dashboard.accountCount}</p>
              <Typography className="mt-2 text-sm text-muted">
                {dashboard.accountCount === 0 ? 'Sin cuentas' : 'Cuentas registradas'}
              </Typography>
            </Surface>
            <Surface className="rounded-3xl p-5">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Tarjetas
              </Typography>
              <p className="mt-2 font-serif text-3xl tracking-tight">
                {dashboard.cardDebtTotal.gt(0) ? formatCOP(dashboard.cardDebtTotal) : '—'}
              </p>
              <Typography className="mt-2 text-sm text-muted">
                {dashboard.cardCreditTotal.gt(0)
                  ? `Disponible ${formatCOP(dashboard.cardAvailableTotal)}`
                  : 'Sin tarjetas'}
              </Typography>
            </Surface>
            <Surface className="rounded-3xl p-5">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Ingresos mes
              </Typography>
              <p className="mt-2 font-serif text-3xl tracking-tight">
                {dashboard.currentMonthIncome.gt(0) ? formatCOP(dashboard.currentMonthIncome) : '—'}
              </p>
              <Typography className="mt-2 text-sm text-muted">
                {dashboard.currentMonthIncome.gt(0) ? 'Este mes' : 'Sin ingresos este mes'}
              </Typography>
            </Surface>
            <Surface className="rounded-3xl p-5">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Ahorros
              </Typography>
              <p className="mt-2 font-serif text-3xl tracking-tight">
                {dashboard.savingsCurrent.gt(0) ? formatCOP(dashboard.savingsCurrent) : '—'}
              </p>
              <Typography className="mt-2 text-sm text-muted">
                {dashboard.savingsCount > 0
                  ? `${Math.round(dashboard.savingsProgress)}% de ${formatCOP(dashboard.savingsTarget)}`
                  : 'Sin metas'}
              </Typography>
              {dashboard.savingsCount > 0 ? (
                <div className="mt-2 h-2 w-full rounded-full bg-surface-foreground/10">
                  <div
                    className="h-2 rounded-full bg-success transition-all"
                    style={{ width: `${dashboard.savingsProgress}%` }}
                  />
                </div>
              ) : null}
            </Surface>
          </div>

          {dashboard.overdue.length > 0 ? (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <Typography className="flex items-center gap-2" type="h3">
                  Vencido
                  <span className="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{dashboard.overdue.length}</span>
                </Typography>
              </div>
              <ul className="grid gap-3">
                {dashboard.overdue.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href}>
                      <Surface className="flex items-center justify-between gap-4 rounded-3xl border-l-4 border-danger p-5">
                        <div>
                          <Typography weight="medium">{item.title}</Typography>
                          <Typography color="muted" type="body-sm">
                            {formatDate(item.dueDate)}
                          </Typography>
                        </div>
                        <span className="font-serif text-2xl tracking-tight text-danger">{formatCOP(item.outstanding)}</span>
                      </Surface>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <Typography type="h3">Próximos 7 días</Typography>
              <Link className="text-sm text-muted hover:text-foreground" href="/proximos">
                Ver calendario
              </Link>
            </div>
            {dashboard.upcoming.length === 0 ? (
              <Surface className="rounded-3xl p-6">
                <Typography color="muted">Nada que pagar esta semana.</Typography>
              </Surface>
            ) : (
              <ul className="grid gap-3">
                {dashboard.upcoming.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href}>
                      <Surface className="flex items-center justify-between gap-4 rounded-3xl p-5">
                        <div>
                          <Typography weight="medium">{item.title}</Typography>
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
            )}
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Surface className="rounded-3xl p-6">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Tu código
              </Typography>
              <p className="mt-2 font-serif text-3xl tracking-[0.12em]">{formatInviteCode(user.inviteCode)}</p>
              <div className="mt-4">
                <CopyCode code={user.inviteCode} />
              </div>
            </Surface>
            <Surface className="rounded-3xl p-6">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Atajos
              </Typography>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href="/deudas/nueva" variant="secondary">
                  Deuda
                </ButtonLink>
                <ButtonLink href="/tarjetas/nueva" variant="secondary">
                  Tarjeta
                </ButtonLink>
                <ButtonLink href="/ahorros/nueva" variant="secondary">
                  Ahorro
                </ButtonLink>
              </div>
            </Surface>
            <Surface className="rounded-3xl p-6">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Relaciones
              </Typography>
              {dashboard.relationshipsCount > 0 ? (
                <div className="mt-4 grid gap-2">
                  {['i_owe', 'they_owe', 'even'].map((dir) => {
                    const items = [
                      { i_owe: 'Debes', they_owe: 'Te deben', even: 'A paz' },
                    ][0] as Record<string, string>;
                    const count = dir === 'i_owe'
                      ? dashboard.iOweTotal.gt(0) ? 1 : 0
                      : dir === 'they_owe'
                        ? dashboard.theyOweTotal.gt(0) ? 1 : 0
                        : 0;
                    if (!count && dir !== 'even') return null;
                    return (
                      <div key={dir} className="flex items-center gap-2 text-sm">
                        <Chip color={directionChipColor(dir as 'i_owe' | 'they_owe' | 'even')} size="sm" variant="soft">
                          {items[dir]}
                        </Chip>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <ButtonLink href="/relaciones">Agregar persona</ButtonLink>
                </div>
              )}
            </Surface>
          </div>
        </>
      )}
    </main>
  );
}
