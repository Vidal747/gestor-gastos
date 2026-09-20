'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/react/button';
import { Separator } from '@heroui/react/separator';
import {
  CalendarClock,
  CreditCard,
  HandCoins,
  Home,
  Landmark,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Receipt,
  Sun,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { logoutAction } from '@/app/actions/auth';

const links = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/relaciones', label: 'Personas', icon: Users },
  { href: '/proximos', label: 'Próximos', icon: CalendarClock },
  { href: '/cuentas', label: 'Cuentas', icon: Landmark },
  { href: '/deudas', label: 'Deudas', icon: HandCoins },
  { href: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
];

export function Nav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (!loggedIn) {
    return (
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link className="truncate font-serif text-lg tracking-tight" href="/">
            Casa en orden
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <Link className="px-3 py-1.5 text-sm text-muted hover:text-foreground" href="/login">
              Entrar
            </Link>
            <Link
              className="rounded-full bg-foreground px-4 py-1.5 text-sm text-background transition-transform duration-200 hover:scale-[1.03] active:scale-95"
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
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-xl p-2 text-muted transition-colors hover:bg-surface-secondary/60 hover:text-foreground"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Link className="truncate font-serif text-base tracking-tight" href="/">
          Casa en orden
        </Link>
        <div className="ms-auto">
          <ThemeToggle compact />
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 animate-fade-in bg-black/60 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-300 ease-out lg:hidden ${
          drawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-4">
          <Link className="min-w-0 flex-1 truncate font-serif text-base tracking-tight" href="/">
            Casa en orden
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-surface-secondary/60 hover:text-foreground"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <Separator />
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <NavLinks pathname={pathname} collapsed={false} />
        </nav>
        <Separator />
        <div className="shrink-0 p-2">
          <ThemeToggle />
          <LogoutButton collapsed={false} />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-border bg-surface/80 backdrop-blur-md transition-all duration-200 lg:flex ${
          collapsed ? 'w-[68px]' : 'w-[220px]'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-4">
          <button
            className="shrink-0 rounded-xl p-1.5 text-muted transition-colors hover:bg-surface-secondary/60 hover:text-foreground"
            onClick={() => setCollapsed((c) => !c)}
            type="button"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          {!collapsed ? (
            <Link className="min-w-0 flex-1 truncate font-serif text-base tracking-tight" href="/">
              Casa en orden
            </Link>
          ) : null}
        </div>
        <Separator />
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <NavLinks pathname={pathname} collapsed={collapsed} />
        </nav>
        <Separator />
        <div className="shrink-0 p-2">
          <ThemeToggle collapsed={collapsed} />
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>
      <div
        className={`hidden transition-all duration-200 lg:block ${collapsed ? 'ml-[68px]' : 'ml-[220px]'}`}
      />
    </>
  );
}

function NavLinks({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <ul className="grid gap-1">
      {links.map((link) => {
        const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <li key={link.href} className="min-w-0">
            <Link
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 hover:translate-x-0.5 ${
                active
                  ? 'bg-surface-secondary font-medium text-foreground'
                  : 'text-muted hover:bg-surface-secondary/50 hover:text-foreground'
              }`}
              title={collapsed ? link.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {!collapsed ? <span className="min-w-0 flex-1 truncate">{link.label}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  return (
    <form action={logoutAction} className="mt-1">
      <Button
        className="w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-secondary/50 hover:text-foreground"
        type="submit"
        variant="ghost"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
        {!collapsed ? 'Salir' : null}
      </Button>
    </form>
  );
}

function ThemeToggle({ collapsed, compact }: { collapsed?: boolean; compact?: boolean }) {
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

  if (compact) {
    return (
      <button
        className="rounded-xl p-2 text-muted transition-colors hover:bg-surface-secondary/60 hover:text-foreground"
        onClick={toggle}
        type="button"
        aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      >
        {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
      </button>
    );
  }

  if (!ready) {
    return (
      <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted">
        <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        {!collapsed ? 'Tema' : null}
      </div>
    );
  }

  return (
    <button
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-secondary/50 hover:text-foreground"
      onClick={toggle}
      type="button"
    >
      {dark ? (
        <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      )}
      {!collapsed ? (dark ? 'Claro' : 'Oscuro') : null}
    </button>
  );
}
