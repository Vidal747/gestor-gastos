import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CreditCard,
  HandCoins,
  Landmark,
  PiggyBank,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import { ButtonLink } from '@/components/ButtonLink';
import { BalanceChart } from '@/components/charts/BalanceChart';
import { CardsChart } from '@/components/charts/CardsChart';
import { IncomeChart } from '@/components/charts/IncomeChart';
import { SavingsChart } from '@/components/charts/SavingsChart';
import { UpcomingChart } from '@/components/charts/UpcomingChart';
import { CopyCode } from '@/components/CopyCode';
import { getDashboard } from '@/controllers/dashboardController';
import { formatCOP, formatDate } from '@/lib/format';
import { formatInviteCode } from '@/lib/inviteCode';
import { getOptionalUser } from '@/lib/currentUser';
import { accountStore, cardStore, debtStore, incomeStore, relationshipStore, savingStore } from '@/models/stores';

export default async function HomePage() {
  const user = await getOptionalUser();
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
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
    dashboard.savingsCount > 0 ||
    dashboard.accountCount > 0 ||
    dashboard.currentMonthIncome.gt(0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
      <section className="mb-6 grid gap-1">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Hola, {user.name}
        </Typography>
        <Typography type="h1">El estado de la casa, en una mirada.</Typography>
      </section>

      {!hasData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="rounded-3xl p-6 transition-shadow duration-300 hover:shadow-lg">
            <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
              Tu código
            </Typography>
            <p className="mt-2 break-all font-serif text-4xl tracking-[0.12em]">{formatInviteCode(user.inviteCode)}</p>
            <Typography className="mt-2" color="muted" type="body-sm">
              Compártelo para que te agreguen como relación de negocio.
            </Typography>
            <div className="mt-4">
              <CopyCode code={user.inviteCode} />
            </div>
          </Surface>
          <Surface className="rounded-3xl p-6 transition-shadow duration-300 hover:shadow-lg">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              icon={<Users className="h-4 w-4" aria-hidden />}
              label="Personas"
              value={String(dashboard.relationshipsCount)}
              sub={
                dashboard.iOweTotal.gt(0) ? (
                  <span className="text-danger">Debes {formatCOP(dashboard.iOweTotal)}</span>
                ) : dashboard.theyOweTotal.gt(0) ? (
                  <span className="text-success">Te deben {formatCOP(dashboard.theyOweTotal)}</span>
                ) : (
                  <span className="text-muted">Sin deudas entre personas</span>
                )
              }
            />
            <KpiCard
              icon={<HandCoins className="h-4 w-4" aria-hidden />}
              label="Deudas"
              value={String(dashboard.activeDebtCount)}
              sub={
                <span className="text-muted">
                  {dashboard.activeDebtCount === 0 ? 'Sin deudas activas' : 'Deudas activas'}
                </span>
              }
            />
            <KpiCard
              icon={<Landmark className="h-4 w-4" aria-hidden />}
              label="Cuentas"
              value={String(dashboard.accountCount)}
              sub={
                <span className="text-muted">
                  {dashboard.accountCount === 0 ? 'Sin cuentas' : 'Cuentas registradas'}
                </span>
              }
            />
            <KpiCard
              icon={<CreditCard className="h-4 w-4" aria-hidden />}
              label="Tarjetas"
              value={dashboard.cardDebtTotal.gt(0) ? formatCOP(dashboard.cardDebtTotal) : '—'}
              sub={
                <span className="text-muted">
                  {dashboard.cardCreditTotal.gt(0)
                    ? `Disponible ${formatCOP(dashboard.cardAvailableTotal)}`
                    : 'Sin tarjetas'}
                </span>
              }
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" aria-hidden />}
              label="Ingresos mes"
              value={dashboard.currentMonthIncome.gt(0) ? formatCOP(dashboard.currentMonthIncome) : '—'}
              sub={
                <span className="text-muted">
                  {dashboard.currentMonthIncome.gt(0) ? 'Este mes' : 'Sin ingresos este mes'}
                </span>
              }
            />
            <KpiCard
              icon={<PiggyBank className="h-4 w-4" aria-hidden />}
              label="Ahorros"
              value={dashboard.savingsCurrent.gt(0) ? formatCOP(dashboard.savingsCurrent) : '—'}
              sub={
                <span className="text-muted">
                  {dashboard.savingsCount > 0
                    ? `${Math.round(dashboard.savingsProgress)}% de ${formatCOP(dashboard.savingsTarget)}`
                    : 'Sin metas'}
                </span>
              }
              progress={dashboard.savingsCount > 0 ? dashboard.savingsProgress : undefined}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Surface className="min-w-0 rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
              <ChartHeader
                icon={<CalendarClock className="h-4 w-4" aria-hidden />}
                title="A pagar por día"
                linkHref="/proximos"
                linkLabel="Ver calendario"
              />
              <div className="mt-4">
                <UpcomingChart data={dashboard.upcomingByDay} />
              </div>
            </Surface>
            <Surface className="min-w-0 rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
              <ChartHeader
                icon={<Users className="h-4 w-4" aria-hidden />}
                title="Balance entre personas"
                linkHref="/relaciones"
                linkLabel="Ver personas"
              />
              <div className="mt-4">
                <BalanceChart iOwe={dashboard.iOweTotal.toNumber()} theyOwe={dashboard.theyOweTotal.toNumber()} />
              </div>
            </Surface>
            <Surface className="min-w-0 rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
              <ChartHeader
                icon={<CreditCard className="h-4 w-4" aria-hidden />}
                title="Uso por tarjeta"
                linkHref="/tarjetas"
                linkLabel="Ver tarjetas"
              />
              <div className="mt-4">
                <CardsChart data={dashboard.cardBreakdown} />
              </div>
            </Surface>
            <Surface className="min-w-0 rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
              <ChartHeader
                icon={<PiggyBank className="h-4 w-4" aria-hidden />}
                title="Progreso de metas"
                linkHref="/ahorros"
                linkLabel="Ver ahorros"
              />
              <div className="mt-4">
                <SavingsChart data={dashboard.savingsBreakdown} />
              </div>
            </Surface>
            <Surface className="min-w-0 rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6 lg:col-span-2">
              <ChartHeader
                icon={<Wallet className="h-4 w-4" aria-hidden />}
                title="Ingresos del mes por categoría"
                linkHref="/ingresos"
                linkLabel="Ver ingresos"
              />
              <div className="mt-4">
                <IncomeChart data={dashboard.incomeByCategory} />
              </div>
            </Surface>
          </div>

          {dashboard.overdue.length > 0 ? (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <Typography className="flex min-w-0 items-center gap-2" type="h3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-danger" aria-hidden />
                  <span className="truncate">Vencido</span>
                  <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-xs text-white tabular-nums">
                    {dashboard.overdue.length}
                  </span>
                </Typography>
              </div>
              <ul className="grid gap-3">
                {dashboard.overdue.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <Link href={item.href} className="block">
                      <Surface className="flex items-center justify-between gap-3 rounded-3xl border-l-4 border-danger p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-5">
                        <div className="min-w-0">
                          <Typography className="truncate" weight="medium">{item.title}</Typography>
                          <Typography color="muted" type="body-sm">
                            {formatDate(item.dueDate)}
                          </Typography>
                        </div>
                        <span className="shrink-0 font-serif text-xl tracking-tight text-danger tabular-nums sm:text-2xl">
                          {formatCOP(item.outstanding)}
                        </span>
                      </Surface>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <Typography className="flex min-w-0 items-center gap-2" type="h3">
                <CalendarClock className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate">Próximos 7 días</span>
              </Typography>
              <Link className="flex shrink-0 items-center gap-1 text-sm text-muted hover:text-foreground" href="/proximos">
                Ver calendario
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            {dashboard.upcoming.length === 0 ? (
              <Surface className="rounded-3xl p-6">
                <Typography color="muted">Nada que pagar esta semana.</Typography>
              </Surface>
            ) : (
              <ul className="grid gap-3">
                {dashboard.upcoming.map((item) => (
                  <li key={item.id} className="min-w-0">
                    <Link href={item.href} className="block">
                      <Surface className="flex items-center justify-between gap-3 rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-5">
                        <div className="min-w-0">
                          <Typography className="truncate" weight="medium">{item.title}</Typography>
                          <Typography color="muted" type="body-sm">
                            {formatDate(item.dueDate)}
                          </Typography>
                        </div>
                        <span className="shrink-0 font-serif text-xl tracking-tight tabular-nums sm:text-2xl">
                          {formatCOP(item.outstanding)}
                        </span>
                      </Surface>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Surface className="rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Tu código
              </Typography>
              <p className="mt-2 break-all font-serif text-3xl tracking-[0.12em]">{formatInviteCode(user.inviteCode)}</p>
              <div className="mt-4">
                <CopyCode code={user.inviteCode} />
              </div>
            </Surface>
            <Surface className="rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Atajos
              </Typography>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href="/deudas/nueva" variant="secondary">
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Deuda
                  </span>
                </ButtonLink>
                <ButtonLink href="/tarjetas/nueva" variant="secondary">
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Tarjeta
                  </span>
                </ButtonLink>
                <ButtonLink href="/ahorros/nueva" variant="secondary">
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Ahorro
                  </span>
                </ButtonLink>
              </div>
            </Surface>
            <Surface className="rounded-3xl p-5 transition-shadow duration-300 hover:shadow-lg sm:p-6 sm:col-span-2 lg:col-span-1">
              <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
                Resumen
              </Typography>
              <div className="mt-4 grid gap-2 text-sm">
                <SummaryRow label="Personas vinculadas" value={String(dashboard.relationshipsCount)} href="/relaciones" />
                <SummaryRow label="Cuentas registradas" value={String(dashboard.accountCount)} href="/cuentas" />
                <SummaryRow label="Metas de ahorro" value={String(dashboard.savingsCount)} href="/ahorros" />
              </div>
            </Surface>
          </div>
        </>
      )}
    </main>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
  progress?: number;
}) {
  return (
    <Surface className="min-w-0 rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <Typography className="flex items-center gap-1.5 uppercase tracking-[0.16em]" color="muted" type="body-xs">
        <span className="shrink-0" aria-hidden>{icon}</span>
        <span className="truncate">{label}</span>
      </Typography>
      <p className="mt-2 truncate font-serif text-2xl tracking-tight tabular-nums xl:text-3xl">{value}</p>
      <div className="mt-2 min-w-0 truncate text-sm">{sub}</div>
      {progress !== undefined ? (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-foreground/10">
          <div
            className="h-2 rounded-full bg-success transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </Surface>
  );
}

function ChartHeader({
  icon,
  title,
  linkHref,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <Typography className="flex min-w-0 items-center gap-2" type="h4">
        <span className="shrink-0 text-muted" aria-hidden>{icon}</span>
        <span className="truncate">{title}</span>
      </Typography>
      <Link className="flex shrink-0 items-center gap-1 text-xs text-muted hover:text-foreground sm:text-sm" href={linkHref}>
        <span className="hidden sm:inline">{linkLabel}</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function SummaryRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-secondary/60">
      <span className="min-w-0 truncate text-muted">{label}</span>
      <span className="shrink-0 font-medium tabular-nums">{value}</span>
    </Link>
  );
}
