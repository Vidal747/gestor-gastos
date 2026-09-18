'use client';

import { I18nProvider } from 'react-aria';

import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="es-CO">
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  );
}
