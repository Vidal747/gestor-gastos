import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { CardForm } from '@/components/CardForm';
import { requireUser } from '@/lib/requireUser';

export default async function NewCardPage() {
  await requireUser();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 grid gap-2">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Nueva tarjeta
        </Typography>
        <Typography type="h1">El banco, con su propio rincón.</Typography>
      </section>
      <Surface className="max-w-xl rounded-3xl p-6">
        <CardForm />
      </Surface>
    </main>
  );
}
