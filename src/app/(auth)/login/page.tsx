import { Surface } from '@heroui/react/surface';
import { Typography } from '@heroui/react/typography';
import Link from 'next/link';

import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20 sm:py-10 lg:pb-16">
      <section className="mb-8 grid gap-2">
        <Typography className="uppercase tracking-[0.16em]" color="muted" type="body-xs">
          Entrar
        </Typography>
        <Typography type="h1">Bienvenido de nuevo.</Typography>
      </section>
      <Surface className="max-w-md rounded-3xl border border-border p-6 shadow-sm">
        <AuthForm mode="login" />
        <p className="mt-4 text-sm text-muted">
          ¿Aún no tienes cuenta?{' '}
          <Link className="text-foreground underline underline-offset-4" href="/register">
            Créala aquí
          </Link>
        </p>
      </Surface>
    </main>
  );
}
