import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { ExpenseForm } from '@/components/ExpenseForm';
import { listRelationships } from '@/controllers/relationshipController';
import { requireCurrentUser } from '@/lib/requireUser';
import { relationshipStore } from '@/models/stores';

export default async function ExpensesPage() {
  const user = await requireCurrentUser();
  const people = await listRelationships(user.id, { prisma: relationshipStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 grid gap-2">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Gastos compartidos
        </Typography>
        <Typography type="h1">Entre todos, en limpio.</Typography>
        <Typography color="muted">
          Registrá un gasto y dividilo entre las personas que ya vinculaste. Cada quien sabe lo que pagó y lo que debe.
        </Typography>
      </section>
      <Surface className="max-w-xl rounded-3xl p-6">
        <Typography type="h4">Nuevo gasto</Typography>
        <div className="mt-4">
          <ExpenseForm
            people={people.map((p) => ({
              id: p.peer.id,
              name: p.peer.name,
            }))}
          />
        </div>
      </Surface>
    </main>
  );
}
