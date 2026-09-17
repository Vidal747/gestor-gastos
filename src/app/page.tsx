import { Chip } from '@heroui/react/chip';
import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';

import { ButtonLink } from '@/components/ButtonLink';
import { CopyCode } from '@/components/CopyCode';
import { listUpcoming } from '@/controllers/upcomingController';
import { listRelationships } from '@/controllers/relationshipController';
import { directionChipColor, formatCOP, formatDate, relationshipCopy } from '@/lib/format';
import { formatInviteCode } from '@/lib/inviteCode';
import { getOptionalUser } from '@/lib/currentUser';
import { cardStore, debtStore, relationshipStore } from '@/models/stores';

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

  const [people, upcoming] = await Promise.all([
    listRelationships(user.id, { prisma: relationshipStore }),
    listUpcoming(user.id, { debts: debtStore, cards: cardStore }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 grid gap-2">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Hola, {user.name}
        </Typography>
        <Typography type="h1">El estado de la casa, en una mirada.</Typography>
      </section>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
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
            Personas
          </Typography>
          <Typography className="mt-1" type="h3">
            {people.length === 0 ? 'Aún no hay vínculos' : `${people.length} relaciones`}
          </Typography>
          <Typography className="mt-2" color="muted" type="body-sm">
            Las deudas viven entre ustedes, no en un ID.
          </Typography>
          <div className="mt-4">
            <ButtonLink href="/relaciones">Ver personas</ButtonLink>
          </div>
        </Surface>
      </div>
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        {people.slice(0, 4).map((person) => (
          <Link key={person.peer.id} href="/relaciones">
            <Surface className="flex items-center justify-between gap-4 rounded-3xl p-5">
              <div>
                <Typography type="h4">{person.peer.name}</Typography>
                <Typography color="muted" type="body-sm">
                  {person.peer.inviteCodeLabel}
                </Typography>
              </div>
              <Chip color={directionChipColor(person.direction)} variant="soft">
                {relationshipCopy(person.direction, person.net)}
              </Chip>
            </Surface>
          </Link>
        ))}
      </section>
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <Typography type="h3">Lo que viene</Typography>
          <Link className="text-sm text-muted hover:text-foreground" href="/proximos">
            Ver calendario
          </Link>
        </div>
        <ul className="grid gap-3">
          {upcoming.slice(0, 4).map((item) => (
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
      </section>
    </main>
  );
}
