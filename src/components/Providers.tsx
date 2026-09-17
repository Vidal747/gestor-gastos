'use client';

import { I18nProvider } from 'react-aria';

export function Providers({ children }: { children: React.ReactNode }) {
  return <I18nProvider locale="es-CO">{children}</I18nProvider>;
}
