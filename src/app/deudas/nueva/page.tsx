import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { DebtForm } from '@/components/DebtForm';
import { listRelationships } from '@/controllers/relationshipController';
import { requireCurrentUser } from '@/lib/requireUser';
import { relationshipStore } from '@/models/stores';

export default async function NewDebtPage({ searchParams }: { searchParams: Promise<{ peer?: string }> }) {
  const user = await requireCurrentUser();
  const { peer } = await searchParams;
  const people = await listRelationships(user.id, { prisma: relationshipStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 grid gap-2">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Nueva deuda
        </Typography>
        <Typography type="h1">Una cuenta entre dos.</Typography>
      </section>
      <Surface className="max-w-xl rounded-3xl p-6">
        <DebtForm
          defaultPeerId={peer}
          people={people.map((person) => ({
            id: person.peer.id,
            name: person.peer.name,
            inviteCodeLabel: person.peer.inviteCodeLabel,
          }))}
        />
      </Surface>
    </main>
  );
}
