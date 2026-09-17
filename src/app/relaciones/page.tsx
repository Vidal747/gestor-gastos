import { Chip } from '@heroui/react/chip';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { ButtonLink } from '@/components/ButtonLink';
import { ConnectForm } from '@/components/ConnectForm';
import { CopyCode } from '@/components/CopyCode';
import { listRelationships } from '@/controllers/relationshipController';
import { directionChipColor, relationshipCopy } from '@/lib/format';
import { formatInviteCode } from '@/lib/inviteCode';
import { requireCurrentUser } from '@/lib/requireUser';
import { relationshipStore } from '@/models/stores';

export default async function RelationshipsPage() {
  const user = await requireCurrentUser();
  const people = await listRelationships(user.id, { prisma: relationshipStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 grid max-w-2xl gap-3">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Relaciones
        </Typography>
        <Typography type="h1">Las personas con las que hay cuentas.</Typography>
        <Typography color="muted">
          No manejas IDs. Vinculas a alguien con su código y desde ahí nace el lenguaje de la casa: le debo, me debe,
          estamos a paz.
        </Typography>
      </section>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Surface className="rounded-3xl p-6">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Tu código
          </Typography>
          <p className="mt-2 font-serif text-4xl tracking-[0.12em]">{formatInviteCode(user.inviteCode)}</p>
          <Typography className="mt-2" color="muted" type="body-sm">
            Este es el único dato que la otra persona necesita.
          </Typography>
          <div className="mt-4">
            <CopyCode code={user.inviteCode} />
          </div>
        </Surface>
        <Surface className="rounded-3xl p-6">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Agregar
          </Typography>
          <Typography type="h3">Vincular con un código</Typography>
          <ConnectForm />
        </Surface>
      </div>
      <ul className="mt-5 grid gap-3">
        {people.length === 0 ? (
          <li>
            <Surface className="rounded-3xl p-6">
              <Typography color="muted">Todavía no hay relaciones. Pide el código de alguien y agrégalo aquí.</Typography>
            </Surface>
          </li>
        ) : null}
        {people.map((person) => (
          <li key={person.peer.id}>
            <Surface className="rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Typography type="h4">{person.peer.name}</Typography>
                  <Typography color="muted" type="body-sm">
                    {person.peer.inviteCodeLabel}
                  </Typography>
                </div>
                <Chip color={directionChipColor(person.direction)} variant="soft">
                  {relationshipCopy(person.direction, person.net)}
                </Chip>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <ButtonLink href={`/deudas/nueva?peer=${person.peer.id}`} variant="secondary">
                  Registrar una deuda
                </ButtonLink>
                <span
                  className={
                    person.direction === 'i_owe'
                      ? 'font-serif text-2xl text-danger'
                      : person.direction === 'they_owe'
                        ? 'font-serif text-2xl text-success'
                        : 'font-serif text-2xl text-muted'
                  }
                >
                  {person.direction === 'even' ? '—' : relationshipCopy(person.direction, person.net)}
                </span>
              </div>
            </Surface>
          </li>
        ))}
      </ul>
    </main>
  );
}
