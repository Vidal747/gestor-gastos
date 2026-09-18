import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';

import { AccountForm, TYPES } from '@/components/AccountForm';
import { AccountList } from '@/components/AccountList';
import { listAccounts } from '@/controllers/accountController';
import { requireUser } from '@/lib/requireUser';
import { accountStore } from '@/models/stores';

export default async function AccountsPage() {
  const userId = await requireUser();
  const accounts = await listAccounts(userId, { prisma: accountStore });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-16">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
            Cuentas
          </Typography>
          <Typography type="h1">Dónde está la plata.</Typography>
          <Typography color="muted">
            {accounts.length === 0 ? 'Sin cuentas registradas' : `${accounts.length} cuentas`}
          </Typography>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Surface className="rounded-3xl p-6">
          <Typography type="h4">Tus cuentas</Typography>
          <div className="mt-4">
            <AccountList accounts={accounts} types={TYPES} />
          </div>
        </Surface>
        <Surface className="rounded-3xl p-6">
          <Typography type="h4">Nueva cuenta</Typography>
          <div className="mt-4">
            <AccountForm />
          </div>
        </Surface>
      </div>
    </main>
  );
}
