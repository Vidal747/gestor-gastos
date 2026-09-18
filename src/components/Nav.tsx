'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/react/button';
import { Separator } from '@heroui/react/separator';
import { Typography } from '@heroui/react/typography';
import { useState, useEffect } from 'react';

import { logoutAction } from '@/app/actions/auth';

const links = [
  { href: '/', label: 'Inicio', icon: '⌂' },
  { href: '/relaciones', label: 'Personas', icon: '◆' },
  { href: '/proximos', label: 'Próximos', icon: '◷' },
  { href: '/cuentas', label: 'Cuentas', icon: '⬡' },
  { href: '/deudas', label: 'Deudas', icon: '⬒' },
  { href: '/tarjetas', label: 'Tarjetas', icon: '▣' },
  { href: '/ahorros', label: 'Ahorros', icon: '⬙' },
  { href: '/ingresos', label: 'Ingresos', icon: '↑' },
  { href: '/gastos', label: 'Gastos', icon: '↓' },
];

export function Nav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!loggedIn) {
    return (
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link className="font-serif text-lg tracking-tight" href="/">
            Casa en orden
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <Link className="px-3 py-1.5 text-sm text-muted hover:text-foreground" href="/login">
              Entrar
            </Link>
            <Link
              className="rounded-full bg-foreground px-4 py-1.5 text-sm text-background"
              href="/register"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-border bg-surface/80 backdrop-blur-md transition-all duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[220px]'
        }`}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <button
            className="shrink-0 text-lg text-muted hover:text-foreground"
            onClick={() => setCollapsed((c) => !c)}
            type="button"
          >
            ☰
          </button>
          {!collapsed ? (
            <Link className="truncate font-serif text-base tracking-tight" href="/">
              Casa en orden
            </Link>
          ) : null}
        </div>
        <Separator />
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="grid gap-1">
            {links.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      active
                        ? 'bg-surface-secondary font-medium text-foreground'
                        : 'text-muted hover:bg-surface-secondary/50 hover:text-foreground'
                    }`}
                    title={collapsed ? link.label : undefined}
                  >
                    <span className="w-5 text-center text-base">{link.icon}</span>
                    {!collapsed ? <span className="truncate">{link.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Separator />
        <div className="p-2">
          <ThemeToggle />
          <form action={logoutAction} className="mt-1">
            <Button
              className="w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-secondary/50 hover:text-foreground"
              type="submit"
              variant="ghost"
            >
              <span className="w-5 text-center text-base">←</span>
              {!collapsed ? 'Salir' : null}
            </Button>
          </form>
        </div>
      </aside>
      <div className={`transition-all duration-200 ${collapsed ? 'ml-[68px]' : 'ml-[220px]'}`} />
    </>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (!ready) {
    return (
      <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted">
        <span className="w-5 text-center text-base">☾</span>
        Tema
      </div>
    );
  }

  return (
    <button
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-secondary/50 hover:text-foreground"
      onClick={toggle}
      type="button"
    >
      <span className="w-5 text-center text-base">{dark ? '☀' : '☾'}</span>
      {dark ? 'Claro' : 'Oscuro'}
    </button>
  );
}
