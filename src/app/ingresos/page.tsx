import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { IncomeForm } from '@/components/IncomeForm';
import { IncomeList } from '@/components/IncomeList';
import { listIncomes } from '@/controllers/incomeController';
import { formatCOP } from '@/lib/format';
import { toMoney } from '@/lib/finance';
import { requireUser } from '@/lib/requireUser';
import { incomeStore } from '@/models/stores';

export default async function IncomesPage() {
  const userId = await requireUser();
  const incomes = await listIncomes(userId, { prisma: incomeStore });

  const now = new Date();
  const thisMonth = incomes.filter(
    (i) => i.date.getUTCFullYear() === now.getUTCFullYear() && i.date.getUTCMonth() === now.getUTCMonth(),
  );
  const monthTotal = thisMonth.reduce((sum, i) => sum.plus(i.amount), toMoney(0));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Ingresos
          </Typography>
          <Typography type="h1">Lo que entró.</Typography>
          <Typography color="muted">
            {monthTotal
              ? `Este mes ${formatCOP(monthTotal)} en ${thisMonth.length} ingresos`
              : 'Sin ingresos este mes'}
          </Typography>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Surface className="rounded-3xl p-6">
          <Typography type="h4">Todos los ingresos</Typography>
          <div className="mt-4">
            <IncomeList incomes={incomes} />
          </div>
        </Surface>
        <Surface className="rounded-3xl p-6">
          <Typography type="h4">Nuevo ingreso</Typography>
          <div className="mt-4">
            <IncomeForm />
          </div>
        </Surface>
      </div>
    </main>
  );
}
