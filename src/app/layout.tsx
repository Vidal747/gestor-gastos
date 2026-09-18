import { Fraunces, Outfit } from 'next/font/google';

import { Nav } from '@/components/Nav';
import { Providers } from '@/components/Providers';
import { getOptionalUserId } from '@/lib/currentUser';
import './globals.css';
import type { Metadata } from 'next';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

export const metadata: Metadata = {
  title: 'Casa en orden',
  description: 'Finanzas personales y deudas entre personas',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await getOptionalUserId();
  return (
    <html data-theme="dark" lang="es">
      <body className={`${outfit.variable} ${fraunces.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Providers>
          <Nav loggedIn={Boolean(userId)} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
