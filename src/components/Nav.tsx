'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/react/button';
import { buttonVariants } from '@heroui/styles';

import { logoutAction } from '@/app/actions/auth';

const links = [
  { href: '/relaciones', label: 'Personas' },
  { href: '/proximos', label: 'Próximos' },
  { href: '/deudas', label: 'Deudas' },
  { href: '/tarjetas', label: 'Tarjetas' },
  { href: '/ahorros', label: 'Ahorros' },
];

export function Nav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link className="font-serif text-lg tracking-tight" href="/">
          Casa en orden
        </Link>
        {loggedIn ? (
          <>
            <nav className="flex flex-wrap gap-1">
              {links.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      active
                        ? 'rounded-full bg-surface px-3 py-1.5 text-sm text-foreground'
                        : 'rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-foreground'
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <form action={logoutAction} className="ms-auto">
              <Button type="submit" variant="ghost">
                Salir
              </Button>
            </form>
          </>
        ) : (
          <div className="ms-auto flex items-center gap-2">
            <Link className="px-3 py-1.5 text-sm text-muted hover:text-foreground" href="/login">
              Entrar
            </Link>
            <Link className={buttonVariants({ variant: 'primary' })} href="/register">
              Crear cuenta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
